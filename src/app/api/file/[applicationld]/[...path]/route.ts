import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(_request: NextRequest, { params }: { params: { applicationId: string; path: string[] } }) {
  const applicationId = params.applicationId
  const rel = params.path.join('/')
  const primaryRoot = process.env.FILE_ROOT || path.resolve('/www/eqwip/filemang')
  let target = path.resolve(primaryRoot, applicationId, rel)
  try {
    await fs.promises.access(target)
  } catch {
    // Fallback to local dev storage
    const fallbackRoot = path.resolve(process.cwd(), 'www', 'eqwip', 'filemang')
    target = path.resolve(fallbackRoot, applicationId, rel)
  }
  const ext = path.extname(target).toLowerCase()
  const type = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.gif' ? 'image/gif' : 'application/octet-stream'
  try {
    const data = await fs.promises.readFile(target)
    return new Response(data, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}


