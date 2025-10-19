import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CompanyAnalyticsService } from '@/lib/analytics'
import { getUserSubscription, hasFeature } from '@/lib/subscription'
import { cache } from '@/lib/cache'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Разрешаем доступ, если у пользователя есть профиль работодателя,
    // даже если поле role не равно 'EMPLOYER'. Это устраняет проблемы с несоответствием роли.

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const force = searchParams.get('force') === '1'
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    const days = daysMap[range] ?? 30

    // Находим профиль работодателя текущего пользователя
    const employer = await db.employerProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!employer) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    }

    // Гейтинг по подписке: временно отключаем, чтобы аналитика была бесплатной для всех
    const analyticsFreeFlag = (() => {
      const raw = String(process.env.ANALYTICS_FREE ?? '1').toLowerCase()
      return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
    })()
    if (!analyticsFreeFlag) {
      const sub = await getUserSubscription(session.user.id)
      if (!hasFeature(sub.plan as any, 'analytics')) {
        return NextResponse.json({ error: 'Subscription required', plan: sub.plan }, { status: 402 })
      }
    }

    try {
      if (force) {
        // сбрасываем кэш аналитики компании, чтобы получить свежие данные
        await cache.clearByPrefix('company-analytics-v2')
      }
      const analytics = await CompanyAnalyticsService.getCompanyAnalytics(employer.id, days)
      const res = NextResponse.json({ ok: true, data: analytics })
      res.headers.set('Cache-Control', 'private, max-age=60')
      return res
    } catch (e: any) {
      console.error('Company analytics compute error:', e)
      // Безопасный фолбэк на простые агрегаты (без raw SQL)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const [jobs, apps] = await Promise.all([
        db.job.findMany({
          where: { employerId: employer.id },
          select: { id: true, title: true, isActive: true, viewsCount: true },
        }),
        db.application.findMany({
          where: { job: { employerId: employer.id }, createdAt: { gte: startDate } },
          select: { createdAt: true, jobId: true, status: true, candidate: { select: { location: true } } },
          take: 10000,
        }),
      ])

      const totalJobs = jobs.length
      const activeJobs = jobs.filter(j => j.isActive).length
      const totalApplications = apps.length
      const sumViews = jobs.reduce((s, j) => s + (j.viewsCount || 0), 0)
      const averageApplicationsPerJob = activeJobs > 0 ? totalApplications / activeJobs : 0
      const averageViewsPerJob = activeJobs > 0 ? sumViews / activeJobs : 0
      const conversionRate = sumViews > 0 ? (totalApplications / sumViews) * 100 : 0

      // Топ вакансий по количеству откликов
      const appsByJob = new Map<string, number>()
      for (const a of apps) appsByJob.set(a.jobId, (appsByJob.get(a.jobId) || 0) + 1)
      const topPerformingJobs = jobs
        .map(j => ({
          jobId: j.id,
          title: j.title,
          views: j.viewsCount || 0,
          applications: appsByJob.get(j.id) || 0,
          conversionRate: (j.viewsCount || 0) > 0 ? ((appsByJob.get(j.id) || 0) / (j.viewsCount || 0)) * 100 : 0,
        }))
        .sort((a, b) => (b.applications - a.applications) || (b.views - a.views))
        .slice(0, 5)

      // Ежедневная статистика: распределяем отклики по дням; просмотры берём как нули (если нет событий)
      const byDate = new Map<string, { date: string; views: number; applications: number; hires: number }>()
      for (const a of apps) {
        const key = new Date(a.createdAt).toISOString().slice(0, 10)
        const rec = byDate.get(key) || { date: key, views: 0, applications: 0, hires: 0 }
        rec.applications += 1
        if (a.status === 'HIRED') rec.hires += 1
        byDate.set(key, rec)
      }
      const monthlyStats: Array<{ date: string; views: number; applications: number; hires: number }> = []
      let d = new Date(startDate)
      d.setHours(0, 0, 0, 0)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      while (d <= today) {
        const key = d.toISOString().slice(0, 10)
        monthlyStats.push(byDate.get(key) || { date: key, views: 0, applications: 0, hires: 0 })
        d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
      }

      // Источники: без событий просмотров показываем один Direct
      const candidateSources = sumViews > 0 ? [{ source: 'Direct', count: sumViews, percentage: 100 }] : []

      // География кандидатов по откликам
      const locCounter = new Map<string, number>()
      for (const a of apps) {
        const loc = a.candidate?.location || 'Не указано'
        locCounter.set(loc, (locCounter.get(loc) || 0) + 1)
      }
      const locTotal = Array.from(locCounter.values()).reduce((s, n) => s + n, 0)
      const demographics = Array.from(locCounter.entries())
        .map(([category, count]) => ({ category, value: locTotal > 0 ? Math.round((count / locTotal) * 100) : 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      const fallback = {
        companyId: employer.id,
        totalJobs,
        activeJobs,
        totalApplications,
        totalViews: sumViews,
        avgResponseTime: 0,
        conversionRate,
        averageViewsPerJob,
        averageApplicationsPerJob,
        topPerformingJobs,
        monthlyStats,
        applicationTrends: monthlyStats.map(m => ({ date: m.date, applications: m.applications })),
        candidateSources,
        demographics,
        candidateQuality: { averageExperience: 0, topSkills: [], satisfactionRate: 0 },
      }
      return NextResponse.json({ ok: false, data: fallback })
    }
  } catch (error) {
    console.error('Employer analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


