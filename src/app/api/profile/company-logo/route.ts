import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'
// Avoid importing Node types directly to keep TS lints quiet in non-node type envs

export const runtime = 'nodejs'

function getLogoRoot() {
  const envRoot = process.env.FILE_ROOT
  if (envRoot && fs.existsSync(envRoot)) return path.resolve(envRoot, 'company-logos')
  const candidates = [
    path.resolve('/www/eqwip/filemang'),
    path.resolve(process.cwd(), 'filemang'),
    path.resolve(process.cwd(), 'www', 'eqwip', 'filemang'),
  ]
  for (const base of candidates) {
    try { if (fs.existsSync(base)) return path.resolve(base, 'company-logos') } catch {}
  }
  return path.resolve(process.cwd(), 'filemang', 'company-logos')
}

function normalizeFilename(input: string): string {
  let s = String(input || '')
  try {
    if (s.includes('?')) {
      const u = new URL(s, 'http://localhost')
      const nested = u.searchParams.get('f')
      if (nested) s = nested
    }
  } catch {}
  s = s.replace(/\\/g, '/').split('/').pop() || ''
  return s
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('f')
    const companyId = searchParams.get('company')
    let filename = file ? normalizeFilename(file) : ''
    if (!filename) {
      if (!companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const company = await db.employerProfile.findUnique({ where: { id: companyId } })
      filename = normalizeFilename(company?.logo || '')
      if (!filename) {
        try {
          const alt = path.resolve(process.cwd(), 'public', 'logo-mark.svg')
          const buf = await fs.promises.readFile(alt)
          return new NextResponse(buf, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' } })
        } catch {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
      }
    }

    const root = getLogoRoot()
    const filePath = path.resolve(root, filename)
    let buffer: Buffer
    try {
      buffer = await fs.promises.readFile(filePath)
    } catch {
      // Фолбэк: если файла нет, вернём бренд‑иконку из public
      try {
        const alt = path.resolve(process.cwd(), 'public', 'logo-mark.svg')
        const fallback = await fs.promises.readFile(alt)
        return new NextResponse(fallback, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' } })
      } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
    const ext = path.extname(filename).toLowerCase()
    const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
    return new NextResponse(buffer, { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' } })
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

    // Ensure user is employer
    const user = await db.user.findUnique({ where: { id: (session.user as any).id }, include: { employerProfile: true } })
    if (!user?.employerProfile) {
      return NextResponse.json({ error: 'Only employers can upload company logo' }, { status: 403 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    // Prepare target dir
    let rootDir = getLogoRoot()
    try {
      await fs.promises.mkdir(rootDir, { recursive: true })
    } catch (e) {
      const fallbackRoot = path.resolve(process.cwd(), 'www', 'eqwip', 'filemang', 'company-logos')
      rootDir = fallbackRoot
      await fs.promises.mkdir(rootDir, { recursive: true })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const safeName = (file.name || 'logo').replace(/[^a-zA-Z0-9_.-]/g, '_')
    const filename = `${user.employerProfile.id}-${Date.now()}-${safeName}`
    const targetPath = path.resolve(rootDir, filename)
    await fs.promises.writeFile(targetPath, buffer)

    // Update employer profile
    await db.employerProfile.update({ where: { id: user.employerProfile.id }, data: { logo: filename } })

    const url = `/api/profile/company-logo?f=${encodeURIComponent(filename)}`
    return NextResponse.json({ ok: true, url, filename })
  } catch (e) {
    console.error('company logo upload error', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


