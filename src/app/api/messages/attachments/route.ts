import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { addSecurityHeaders, RateLimiter, getClientIp, validateOrigin } from '@/lib/auth-utils'
import fs from 'fs'
import path from 'path'

// POST /api/messages/attachments
export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request as any)) {
      return addSecurityHeaders(NextResponse.json({ error: 'Forbidden origin' }, { status: 403 }))
    }
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const applicationId = String(formData.get('applicationId') || '')
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
    }

    const files = formData.getAll('files') as File[]
    if (!files.length) {
      return addSecurityHeaders(NextResponse.json({ error: 'No files' }, { status: 400 }))
    }

    // запрет вложений для закрытого чата (REJECTED)
    const st: any[] = await db.$queryRaw`SELECT a."status" FROM "applications" a WHERE a."id" = ${applicationId}`
    const status = String(st?.[0]?.status || '').toUpperCase()
    if (status === 'REJECTED') {
      return addSecurityHeaders(NextResponse.json({ error: 'Chat closed' }, { status: 403 }))
    }

    // Rate limit per IP
    const limiter = new RateLimiter(60_000, 12)
    const ip = getClientIp(request as any)
    if (!limiter.isAllowed(ip)) {
      return addSecurityHeaders(NextResponse.json({ error: 'Too Many Requests' }, { status: 429 }))
    }

    // Server-side file validation
    const allowed = new Set([
      'image/png','image/jpeg','image/gif','image/webp','application/pdf',
      'text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ])
    const maxBytes = 10 * 1024 * 1024
    const checked: File[] = []
    for (const f of files) {
      const ct = (f as any).type || ''
      const size = (f as any).size || 0
      if (size > maxBytes) continue
      if (ct && !allowed.has(ct)) continue
      checked.push(f)
    }
    if (!checked.length) {
      return addSecurityHeaders(NextResponse.json({ error: 'Invalid files' }, { status: 400 }))
    }

    const primaryRoot = process.env.FILE_ROOT || path.resolve('/www/eqwip/filemang')
    let rootDir = path.resolve(primaryRoot, applicationId)
    try {
      await fs.promises.mkdir(rootDir, { recursive: true })
    } catch (e) {
      // Fallback to project-local path on dev (e.g., Windows without admin rights)
      const fallbackRoot = path.resolve(process.cwd(), 'www', 'eqwip', 'filemang')
      rootDir = path.resolve(fallbackRoot, applicationId)
      await fs.promises.mkdir(rootDir, { recursive: true })
    }

    const saved: { name: string; url: string; size: number }[] = []
    for (const file of checked) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
      const targetPath = path.join(rootDir, safeName)
      await fs.promises.writeFile(targetPath, buffer)
      const urlPath = `/api/files/${applicationId}/${encodeURIComponent(safeName)}`
      saved.push({ name: safeName, url: urlPath, size: buffer.length })
    }

    return addSecurityHeaders(NextResponse.json({ ok: true, files: saved }))
  } catch (e) {
    console.error('upload error', e)
    return addSecurityHeaders(NextResponse.json({ error: 'Upload failed' }, { status: 500 }))
  }
}


