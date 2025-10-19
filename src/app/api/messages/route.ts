import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deepDecrypt } from '@/lib/crypto'
import fs from 'fs'
import path from 'path'
import { RateLimiter, getClientIp, sanitizeInput, addSecurityHeaders } from '@/lib/auth-utils'

// Полностью удаляем base64‑фрагменты, чтобы пользователи видели только текст
function stripBase64Segments(input: string): string {
  if (!input) return ''
  let text = String(input)
  text = text.replace(/data:[^;\s]+;base64,[A-Za-z0-9+/=]+/gi, '')
  try {
    text = text.replace(/(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9+/=])/g, '')
  } catch {
    text = text.replace(/[A-Za-z0-9+/]{48,}={0,2}/g, '')
  }
  return text
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId') || ''
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
    }

    // Verify that current user participates in this application (snake_case schema)
    const rows: any[] = await db.$queryRaw`
      SELECT a."id" as application_id,
             ep."userId" as employer_user_id,
             cp."userId" as candidate_user_id
      FROM "applications" a
      JOIN "jobs" j ON a."jobId" = j."id"
      JOIN "employer_profiles" ep ON j."employerId" = ep."id"
      JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
      WHERE a."id" = ${applicationId}
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    const employerUserId = rows[0].employer_user_id as string
    const candidateUserId = rows[0].candidate_user_id as string
    const currentUserId = (session.user as any).id as string
    if (currentUserId !== employerUserId && currentUserId !== candidateUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Проверим авто-архив по истечении 30 дней после отказа
    const appRow: any[] = await db.$queryRaw`
      SELECT a."status" as status, a."updatedAt" as updated_at
      FROM "applications" a
      WHERE a."id" = ${applicationId}
    `
    const st = String(appRow?.[0]?.status || '').toUpperCase()
    const updatedAt = appRow?.[0]?.updated_at as Date | undefined
    const now = Date.now()
    const expired = st === 'REJECTED' && updatedAt && (now - new Date(updatedAt).getTime() > 30 * 24 * 60 * 60 * 1000)
    if (expired) {
      try {
        await db.message.deleteMany({ where: { applicationId } })
      } catch {}
      try {
        const baseRoot = process.env.FILE_ROOT || path.resolve('/www/eqwip/filemang')
        const dir = path.resolve(baseRoot, applicationId)
        await fs.promises.rm(dir, { recursive: true, force: true })
      } catch {}
      return NextResponse.json({ ok: true, data: [] })
    }

    // Fetch messages history
    const messages: any[] = await db.$queryRaw`
      SELECT m."id", m."content", m."isRead", m."createdAt",
             s."id" as sender_id, s."name" as sender_name, s."avatar" as sender_avatar,
             r."id" as receiver_id, r."name" as receiver_name, r."avatar" as receiver_avatar
      FROM "messages" m
      JOIN "users" s ON s."id" = m."senderId"
      JOIN "users" r ON r."id" = m."receiverId"
      WHERE m."applicationId" = ${applicationId}
      ORDER BY m."createdAt" ASC
    `

    const isBase64Like = (value: string): boolean => {
      if (!value) return false
      if (value.length < 24) return false
      if (/\s/.test(value)) return false
      return /^[A-Za-z0-9+/]+={0,2}$/.test(value)
    }
    const decodeBase64IfText = (value: string): string | null => {
      try {
        const buf = Buffer.from(value, 'base64')
        const text = buf.toString('utf8')
        if (!text) return null
        // Heuristic: at least 85% printable or whitespace
        const chars = Array.from(text)
        const printable = chars.filter(c => /[\x20-\x7E\n\r\t]/.test(c)).length
        if (printable / Math.max(chars.length, 1) >= 0.85) return text
        return null
      } catch {
        return null
      }
    }

    const data = messages.map((m) => {
      const raw = String(m.content)
      // First try normal deep decrypt (5 rounds)
      let dec = deepDecrypt(raw, 5)
      let content = dec

      // If nothing changed and it looks like base64, try to decode heuristically
      if (dec === raw && isBase64Like(raw)) {
        const maybeText = decodeBase64IfText(raw)
        if (maybeText) {
          content = maybeText
        } else {
          // Try more decryption rounds as a last attempt
          const decMore = deepDecrypt(raw, 10)
          if (decMore !== raw) content = decMore
          else content = '[скрыто: кодированные данные]'
        }
      }
      // Никогда не возвращаем base64‑похожие фрагменты пользователю (полностью удаляем)
      let finalContent = typeof content === 'string' ? stripBase64Segments(content) : ''
      if (!finalContent.trim()) finalContent = '[пусто]'

      return {
        id: String(m.id),
        content: finalContent,
        isRead: !!m.isRead,
        createdAt: (m.createdAt as Date).toISOString(),
        sender: { id: String(m.sender_id), name: m.sender_name as string, avatar: (m.sender_avatar as string) || undefined },
        receiver: { id: String(m.receiver_id), name: m.receiver_name as string, avatar: (m.receiver_avatar as string) || undefined },
      }
    })

    return addSecurityHeaders(NextResponse.json({ ok: true, data }))
  } catch (error) {
    console.error('GET /api/messages error', error)
    return addSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

// Отправка сообщения по существующему applicationId (работодатель или кандидат)
const postLimiter = new RateLimiter(10_000, 8) // 8 запросов за 10 секунд с одного IP
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { applicationId, text } = await request.json().catch(() => ({}))
    if (!applicationId || typeof applicationId !== 'string') {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
    }

    // Rate limit by IP
    const ip = getClientIp(request as any)
    if (!postLimiter.isAllowed(ip)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    // Verify participation in the thread
    const rows: any[] = await db.$queryRaw`
      SELECT a."id" as application_id,
             ep."userId" as employer_user_id,
             cp."userId" as candidate_user_id
      FROM "applications" a
      JOIN "jobs" j ON a."jobId" = j."id"
      JOIN "employer_profiles" ep ON j."employerId" = ep."id"
      JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
      WHERE a."id" = ${applicationId}
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    const employerUserId = String(rows[0].employer_user_id)
    const candidateUserId = String(rows[0].candidate_user_id)
    const currentUserId = String((session.user as any).id)
    if (currentUserId !== employerUserId && currentUserId !== candidateUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Закрытый чат при отказе — отправка запрещена
    const appRow: any[] = await db.$queryRaw`
      SELECT a."status" as status FROM "applications" a WHERE a."id" = ${applicationId}
    `
    const status = String(appRow?.[0]?.status || '').toUpperCase()
    if (status === 'REJECTED') {
      return addSecurityHeaders(NextResponse.json({ error: 'Chat closed' }, { status: 403 }))
    }

    const receiverId = currentUserId === employerUserId ? candidateUserId : employerUserId
    // Маркдаун: поддержим жирный (**...**) и перенос строки. Остальное экранируем.
    let raw = String(text || '').slice(0, 2000)
    // Разрешаем **...** и \n, блокируем теги
    raw = raw.replace(/[<>]/g, '')
    const content = sanitizeInput(raw)

    const message = await db.message.create({
      data: {
        senderId: currentUserId,
        receiverId,
        applicationId,
        content,
      }
    })

    return addSecurityHeaders(NextResponse.json({ ok: true, id: message.id }))
  } catch (error) {
    console.error('POST /api/messages error', error)
    return addSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

// Удаление всех сообщений и вложений для указанного applicationId
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId') || ''
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
    }

    // Verify participation
    const rows: any[] = await db.$queryRaw`
      SELECT a."id" as application_id,
             ep."userId" as employer_user_id,
             cp."userId" as candidate_user_id
      FROM "applications" a
      JOIN "jobs" j ON a."jobId" = j."id"
      JOIN "employer_profiles" ep ON j."employerId" = ep."id"
      JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
      WHERE a."id" = ${applicationId}
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    const employerUserId = rows[0].employer_user_id as string
    const candidateUserId = rows[0].candidate_user_id as string
    const currentUserId = (session.user as any).id as string
    if (currentUserId !== employerUserId && currentUserId !== candidateUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await db.message.deleteMany({ where: { applicationId } })

    // Remove attachments directory
    const baseRoot = process.env.FILE_ROOT || path.resolve('/www/eqwip/filemang')
    const dir = path.resolve(baseRoot, applicationId)
    try {
      await fs.promises.rm(dir, { recursive: true, force: true })
    } catch {}

    return addSecurityHeaders(NextResponse.json({ ok: true, deleted: result.count }))
  } catch (error) {
    console.error('DELETE /api/messages error', error)
    return addSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}


