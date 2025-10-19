import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'
// Avoid importing Node types directly to keep TS lints quiet in non-node type envs

export const runtime = 'nodejs'

function getAvatarRoot() {
  // Prefer env, then existing known roots, then local folder "filemang"
  const envRoot = process.env.FILE_ROOT
  if (envRoot && fs.existsSync(envRoot)) return path.resolve(envRoot, 'avatars')

  const candidates = [
    path.resolve('/www/eqwip/filemang'),
    path.resolve(process.cwd(), 'filemang'),
    path.resolve(process.cwd(), 'www', 'eqwip', 'filemang'),
  ]
  for (const base of candidates) {
    try { if (fs.existsSync(base)) return path.resolve(base, 'avatars') } catch {}
  }
  return path.resolve(process.cwd(), 'filemang', 'avatars')
}

function normalizeFilename(input: string): string {
  let s = String(input || '')
  try {
    // If user accidentally passed a full URL like "/api/profile/avatar?f=..."
    if (s.includes('?')) {
      const u = new URL(s, 'http://localhost')
      const nested = u.searchParams.get('f')
      if (nested) s = nested
    }
  } catch {}
  // Only file name, prevent traversal
  s = s.replace(/\\/g, '/').split('/').pop() || ''
  return s
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('f')
    const userParam = searchParams.get('user')
    const candidateParam = searchParams.get('candidate')
    const emailParam = searchParams.get('email')

    let filename = file ? normalizeFilename(file) : ''

    // Попробуем определить файл по различным идентификаторам пользователя/кандидата
    if (!filename) {
      let avatarFromDb: string | undefined

      // 1) Если передан email
      if (!avatarFromDb && emailParam) {
        try {
          const uByEmail = await db.user.findUnique({ where: { email: emailParam } })
          avatarFromDb = uByEmail?.avatar || undefined
        } catch {}
      }

      // 2) Если передан user — это может быть как users.id, так и candidate_profiles.id (совместимость)
      if (!avatarFromDb && userParam) {
        try {
          const uById = await db.user.findUnique({ where: { id: userParam } })
          avatarFromDb = uById?.avatar || undefined
        } catch {}
        if (!avatarFromDb) {
          try {
            const cand = await db.candidateProfile.findUnique({ where: { id: userParam }, include: { user: true } })
            avatarFromDb = cand?.user?.avatar || undefined
          } catch {}
        }
      }

      // 3) Если передан candidate — это точно id кандидатского профиля
      if (!avatarFromDb && candidateParam) {
        try {
          const cand = await db.candidateProfile.findUnique({ where: { id: candidateParam }, include: { user: true } })
          avatarFromDb = cand?.user?.avatar || undefined
        } catch {}
      }

      filename = normalizeFilename(avatarFromDb || '')

      // Если аватар не найден — вернём плейсхолдер
      if (!filename) {
        try {
          const altJpg = path.resolve(process.cwd(), 'public', 'placeholder-avatar.jpg')
          const bufJpg = await fs.promises.readFile(altJpg)
          return new NextResponse(bufJpg, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, immutable' } })
        } catch {}
        try {
          const altSvg = path.resolve(process.cwd(), 'public', 'logo-mark.svg')
          const bufSvg = await fs.promises.readFile(altSvg)
          return new NextResponse(bufSvg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' } })
        } catch {}
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const root = getAvatarRoot()
    const filePath = path.resolve(root, filename)
    let buffer: Buffer
    try {
      buffer = await fs.promises.readFile(filePath)
    } catch {
      // Fallback to public placeholder to avoid broken images
      try {
        const altJpg = path.resolve(process.cwd(), 'public', 'placeholder-avatar.jpg')
        buffer = await fs.promises.readFile(altJpg)
        return new NextResponse(buffer, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, immutable' } })
      } catch {}
      try {
        const altSvg = path.resolve(process.cwd(), 'public', 'logo-mark.svg')
        buffer = await fs.promises.readFile(altSvg)
        return new NextResponse(buffer, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' } })
      } catch {}
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const ext = path.extname(filename).toLowerCase()
    const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
    return new NextResponse(buffer, { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400, immutable' } })
  } catch (e) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    // Prepare target dir
    let rootDir = getAvatarRoot()
    try {
      await fs.promises.mkdir(rootDir, { recursive: true })
    } catch (e) {
      const fallbackRoot = path.resolve(process.cwd(), 'www', 'eqwip', 'filemang', 'avatars')
      rootDir = fallbackRoot
      await fs.promises.mkdir(rootDir, { recursive: true })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const safeName = (file.name || 'avatar').replace(/[^a-zA-Z0-9_.-]/g, '_')
    const filename = `${(session.user as any).id}-${Date.now()}-${safeName}`
    const targetPath = path.resolve(rootDir, filename)
    await fs.promises.writeFile(targetPath, buffer)

    // Update user record with stored filename
    await db.user.update({ where: { id: (session.user as any).id }, data: { avatar: filename } })

    // URL to fetch the file back
    const url = `/api/profile/avatar?f=${encodeURIComponent(filename)}`
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    console.error('avatar upload error', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


