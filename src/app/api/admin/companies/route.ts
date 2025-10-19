import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // allow ADMIN or MODERATOR
    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    const role = String(me?.role || '')
    if (role !== 'ADMIN' && role !== 'MODERATOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || '20')))

    const where: any = {}
    if (q) {
      where.companyName = { contains: q, mode: 'insensitive' }
    }

    const total = await db.employerProfile.count({ where })
    const companies = await db.employerProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        companyName: true,
        createdAt: true,
      }
    })

    // Enrich with simple metrics (N+1 but acceptable for admin mock)
    const items = await Promise.all(companies.map(async (c) => {
      const activeJobs = await db.job.count({ where: { employerId: c.id, isActive: true } })
      const responses = await db.application.count({ where: { job: { employerId: c.id } } })
      const hired = await db.application.count({ where: { status: 'HIRED', job: { employerId: c.id } } })
      const hireRate = responses > 0 ? (hired / responses) * 100 : 0
      return {
        id: c.id,
        companyName: c.companyName,
        createdAt: c.createdAt.toISOString(),
        activeJobs,
        responses,
        hireRate,
      }
    }))

    return NextResponse.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) })
  } catch (e) {
    console.error('GET /api/admin/companies error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


