import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    const role = String(me?.role || '')
    if (role !== 'ADMIN' && role !== 'MODERATOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Compute aggregated metrics from DB where possible
    // Average salary: for every active vacancy take its salary estimate:
    // - if both salaryMin and salaryMax present -> (min+max)/2
    // - else if one present -> that value
    // - else -> 0
    // Then sum across all active vacancies and divide by total number of active vacancies
    const totalActiveJobs = await db.job.count({ where: { isActive: true } })
    const salaryRows = await db.job.findMany({
      where: { isActive: true },
      select: { salaryMin: true, salaryMax: true }
    })

    let totalSalarySum = 0
    for (const j of salaryRows) {
      const min = j.salaryMin
      const max = j.salaryMax
      if (min != null && max != null) totalSalarySum += (min + max) / 2
      else if (min != null) totalSalarySum += min
      else if (max != null) totalSalarySum += max
      else totalSalarySum += 0
    }

    const avgSalary = totalActiveJobs > 0 ? Math.round(totalSalarySum / totalActiveJobs) : 0

    // Parse period query (supports '1d','7d','30d','90d','365d' or keywords 'day','week','month','quarter','year')
    const url = new URL(request.url)
    const periodParam = (url.searchParams.get('period') || '30d').toLowerCase()
    const parsePeriodToDays = (p: string) => {
      if (!p) return 30
      if (p === 'day' || p === '1d') return 1
      if (p === 'week' || p === '7d') return 7
      if (p === 'month' || p === '30d') return 30
      if (p === 'quarter' || p === '90d') return 90
      if (p === 'year' || p === '365d') return 365
      // fallback: try to parse number like '14d'
      const m = p.match(/(\d+)d/)
      if (m) return Number(m[1])
      return 30
    }

    const days = parsePeriodToDays(periodParam)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Count total applications (responses) in the selected period
    const responsesCount = await db.application.count({ where: { createdAt: { gte: cutoff } } })

    const metrics = {
      avgSalary,
      responses: responsesCount,
      hireRate: 12,
      employedStudents: 86,
    }

    const trend = [
      { name: '2025-06', value: 120 },
      { name: '2025-07', value: 140 },
      { name: '2025-08', value: 160 },
      { name: '2025-09', value: 150 },
      { name: '2025-10', value: 170 },
    ]

    const salary = [
      { name: 'IT', salary: 90000 },
      { name: 'Engineering', salary: 80000 },
      { name: 'Biotech', salary: 70000 },
    ]

    const eff = [
      { name: 'Closed', value: 40 },
      { name: 'Open', value: 60 },
    ]

    const univReport = [
      { id: 'u1', name: 'МГУ', onInternships: 120, employed: 45, issues: 'Недостаток практики' },
      { id: 'u2', name: 'СПбГУ', onInternships: 90, employed: 30, issues: 'Низкая квалификация' },
      { id: 'u3', name: 'ИТМО', onInternships: 200, employed: 80, issues: 'Хорошо' },
    ]

    return NextResponse.json({ metrics, trend, salary, eff, univReport })
  } catch (e) {
    console.error('GET /api/admin/analytics error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


