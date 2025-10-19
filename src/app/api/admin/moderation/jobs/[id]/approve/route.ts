import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    if (!me || String(me.role) !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = params.id
    const job = await db.job.findUnique({ where: { id } })
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Одобрение публикует вакансию (делает видимой на сайте)
    const updated = await db.job.update({ where: { id }, data: { isActive: true } })
    return NextResponse.json({ ok: true, id: updated.id, status: 'published' })
  } catch (e) {
    console.error('POST /api/admin/moderation/jobs/[id]/approve error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


