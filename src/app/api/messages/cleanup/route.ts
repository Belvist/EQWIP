import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// DELETE /api/messages/cleanup?applicationId=...
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

    // Remove files folder
    const baseRoot = process.env.FILE_ROOT || path.resolve('/www/eqwip/filemang')
    const dir = path.resolve(baseRoot, applicationId)
    try {
      await fs.promises.rm(dir, { recursive: true, force: true })
    } catch {}

    // Optionally can delete messages here if needed
    // await db.message.deleteMany({ where: { applicationId } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('cleanup error', e)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}


