import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE: remove a job (ADMIN or MODERATOR)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    const role = String(me?.role || '')
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = params.id
    // Ensure the job exists
    const job = await db.job.findUnique({ where: { id }, select: { id: true } })
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.job.delete({ where: { id } })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    console.error('DELETE /api/admin/moderation/jobs/[id] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


