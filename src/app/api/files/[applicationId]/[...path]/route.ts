import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(_request: NextRequest, { params }: { params: { applicationId: string; path: string[] } }) {
  const applicationId = params.applicationId
  const rel = params.path.join('/')
  const primaryRoot = process.env.FILE_ROOT || path.resolve('/www/eqwip/filemang')
  const primaryDir = path.resolve(primaryRoot, applicationId)
  let target = path.resolve(primaryDir, rel)
  // Защита от traversal
  if (!target.startsWith(primaryDir + path.sep) && target !== primaryDir) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    await fs.promises.access(target)
  } catch {
    // Fallback to local dev storage
    const fallbackRoot = path.resolve(process.cwd(), 'www', 'eqwip', 'filemang')
    const fallbackDir = path.resolve(fallbackRoot, applicationId)
    target = path.resolve(fallbackDir, rel)
    if (!target.startsWith(fallbackDir + path.sep) && target !== fallbackDir) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  const ext = path.extname(target).toLowerCase()
  const type = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : ext === '.pdf' ? 'application/pdf' : 'application/octet-stream'
  try {
    const data = await fs.promises.readFile(target)
    return new Response(data, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}


