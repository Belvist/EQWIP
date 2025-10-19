import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only ADMIN
    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    if (!me || String(me.role) !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(request.url)
    const status = (url.searchParams.get('status') || 'pending').toLowerCase()
    const company = (url.searchParams.get('company') || '').trim()
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const page = Number(url.searchParams.get('page') || '1')
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || '10')))

    const where: any = {}
    if (status === 'pending') where.isActive = false
    else if (status === 'published') where.isActive = true
    if (from) where.createdAt = { ...(where.createdAt || {}), gte: new Date(from) }
    if (to) where.createdAt = { ...(where.createdAt || {}), lte: new Date(to) }
    if (company) {
      where.employer = { companyName: { contains: company, mode: 'insensitive' } }
    }

    const total = await db.job.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(Math.max(1, page), totalPages)

    const jobs = await db.job.findMany({
      where,
      include: {
        employer: { select: { companyName: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * limit,
      take: limit,
    })

    const items = jobs.map(j => ({
      id: j.id,
      companyName: j.employer?.companyName || '',
      title: j.title,
      submittedAt: j.createdAt.toISOString(),
      status: j.isActive ? 'published' : 'pending',
      description: j.description || '',
    }))

    return NextResponse.json({ items, page: safePage, limit, total, totalPages })
  } catch (e) {
    console.error('GET /api/admin/moderation/jobs error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


