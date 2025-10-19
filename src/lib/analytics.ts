import { db } from '@/lib/db'
import { cache, cacheKeys, cachedFetch } from './cache'
// Локальные утилиты времени, чтобы не зависеть от типов внешних пакетов в среде линтера
function subDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}
function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Типы для аналитики
export interface JobAnalytics {
  jobId: string
  totalViews: number
  uniqueViews: number
  totalApplications: number
  conversionRate: number
  averageTimeToApply: number
  topSources: Array<{
    source: string
    count: number
    percentage: number
  }>
  dailyStats: Array<{
    date: string
    views: number
    applications: number
  }>
  demographicData: {
    experienceLevel: Record<string, number>
    location: Record<string, number>
    skills: Array<{
      skill: string
      count: number
    }>
  }
}

export interface CompanyAnalytics {
  companyId: string
  totalJobs: number
  activeJobs: number
  totalApplications: number
  totalViews: number
  avgResponseTime: number
  conversionRate: number
  averageViewsPerJob: number
  averageApplicationsPerJob: number
  topPerformingJobs: Array<{
    jobId: string
    title: string
    views: number
    applications: number
    conversionRate: number
  }>
  // Добавлено для фронтенда работодателя
  monthlyStats?: Array<{
    date: string
    views: number
    applications: number
    hires: number
  }>
  applicationTrends: Array<{
    date: string
    applications: number
  }>
  candidateSources?: Array<{
    source: string
    count: number
    percentage: number
  }>
  demographics?: Array<{
    category: string
    value: number
  }>
  candidateQuality: {
    averageExperience: number
    topSkills: Array<{
      skill: string
      count: number
    }>
    satisfactionRate: number
  }
}

export interface PlatformAnalytics {
  totalUsers: number
  totalJobs: number
  totalApplications: number
  totalCompanies: number
  userGrowth: Array<{
    date: string
    users: number
  }>
  jobGrowth: Array<{
    date: string
    jobs: number
  }>
  applicationGrowth: Array<{
    date: string
    applications: number
  }>
  topCategories: Array<{
    category: string
    count: number
  }>
  topLocations: Array<{
    location: string
    count: number
  }>
}

// Сервис аналитики для вакансий
export class JobAnalyticsService {
  // Получение аналитики по вакансии
  static async getJobAnalytics(jobId: string, days: number = 30): Promise<JobAnalytics> {
    const cacheKey = { jobId, days }
    
    return await cachedFetch(
      'job-analytics',
      cacheKey,
      async () => {
        const startDate = subDays(new Date(), days)
        
        // Получаем базовую статистику
        const [totalViews, uniqueViews, totalApplications] = await Promise.all([
          db.jobView.count({
            where: {
              jobId,
              createdAt: { gte: startDate }
            }
          }),
          db.jobView.groupBy({
            by: ['userId'],
            where: {
              jobId,
              createdAt: { gte: startDate }
            },
            _count: true
          }),
          db.application.count({
            where: {
              jobId,
              createdAt: { gte: startDate }
            }
          })
        ])

        // Конверсия
        const conversionRate = uniqueViews.length > 0 
          ? (totalApplications / uniqueViews.length) * 100 
          : 0

        // Среднее время до отклика
        const applications = await db.application.findMany({
          where: {
            jobId,
            createdAt: { gte: startDate }
          },
          include: {
            job: {
              select: {
                createdAt: true
              }
            }
          }
        })

        const averageTimeToApply = applications.length > 0
          ? applications.reduce((sum, app) => {
              const timeDiff = app.createdAt.getTime() - app.job.createdAt.getTime()
              return sum + timeDiff
            }, 0) / applications.length / (1000 * 60 * 60 * 24) // в днях
          : 0

        // Источники трафика (примерная реализация)
        const topSources = await this.getTopSources(jobId, startDate)

        // Ежедневная статистика
        const dailyStats = await this.getDailyStats(jobId, startDate)

        // Демографические данные
        const demographicData = await this.getDemographicData(jobId, startDate)

        return {
          jobId,
          totalViews,
          uniqueViews: uniqueViews.length,
          totalApplications,
          conversionRate,
          averageTimeToApply,
          topSources,
          dailyStats,
          demographicData
        }
      },
      { ttl: 3600 } // 1 час
    )
  }

  // Получение источников трафика
  private static async getTopSources(jobId: string, startDate: Date) {
    // Это упрощенная реализация. В реальном приложении здесь был бы анализ рефереров
    const sources = await db.$queryRaw`
      SELECT 
        CASE 
          WHEN "referrer" ILIKE '%google%' THEN 'Google'
          WHEN "referrer" ILIKE '%linkedin%' THEN 'LinkedIn'
          WHEN "referrer" ILIKE '%facebook%' THEN 'Facebook'
          WHEN "referrer" IS NULL OR "referrer" = '' THEN 'Direct'
          ELSE 'Other'
        END as source,
        COUNT(*) as count
      FROM "job_views" 
      WHERE "jobId" = ${jobId} 
        AND "createdAt" >= ${startDate}
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    ` as Array<{ source: string; count: number }>

    const total = sources.reduce((sum, s) => sum + s.count, 0)

    return sources.map(s => ({
      source: s.source,
      count: s.count,
      percentage: total > 0 ? (s.count / total) * 100 : 0
    }))
  }

  // Получение ежедневной статистики
  private static async getDailyStats(jobId: string, startDate: Date) {
    const stats = await db.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as views,
        COUNT(CASE WHEN type = 'application' THEN 1 END) as applications
      FROM (
        SELECT "createdAt", 'view' as type FROM "job_views" WHERE "jobId" = ${jobId} AND "createdAt" >= ${startDate}
        UNION ALL
        SELECT "createdAt", 'application' as type FROM "applications" WHERE "jobId" = ${jobId} AND "createdAt" >= ${startDate}
      ) combined
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    ` as Array<{ date: string; views: number; applications: number }>

    return stats
  }

  // Получение демографических данных
  private static async getDemographicData(jobId: string, startDate: Date) {
    const [experienceData, locationData, skillsData] = await Promise.all([
      db.$queryRaw`
        SELECT 
          cp."experience" as level,
          COUNT(*) as count
        FROM "applications" a
        JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
        WHERE a."jobId" = ${jobId} AND a."createdAt" >= ${startDate}
        GROUP BY cp."experience"
      ` as Array<{ level: number; count: number }>,

      db.$queryRaw`
        SELECT 
          cp."location",
          COUNT(*) as count
        FROM "applications" a
        JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
        WHERE a."jobId" = ${jobId} AND a."createdAt" >= ${startDate}
        GROUP BY cp."location"
        ORDER BY count DESC
        LIMIT 10
      ` as Array<{ location: string; count: number }>,

      db.$queryRaw`
        SELECT 
          s."name" as skill,
          COUNT(*) as count
        FROM "applications" a
        JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
        JOIN "candidate_skills" cs ON cp."id" = cs."candidateId"
        JOIN "skills" s ON cs."skillId" = s."id"
        WHERE a."jobId" = ${jobId} AND a."createdAt" >= ${startDate}
        GROUP BY s."name"
        ORDER BY count DESC
        LIMIT 10
      ` as Array<{ skill: string; count: number }>
    ])

    const experienceLevel = experienceData.reduce((acc, item) => {
      acc[item.level] = item.count
      return acc
    }, {} as Record<string, number>)

    const location = locationData.reduce((acc, item) => {
      acc[item.location] = item.count
      return acc
    }, {} as Record<string, number>)

    return {
      experienceLevel,
      location,
      skills: skillsData
    }
  }
}

// Сервис аналитики для компаний
export class CompanyAnalyticsService {
  // Получение аналитики по компании
  static async getCompanyAnalytics(companyId: string, days: number = 30): Promise<CompanyAnalytics> {
    const cacheKey = { companyId, days }
    
    return await cachedFetch(
      'company-analytics-v2',
      cacheKey,
      async () => {
        const startDate = subDays(new Date(), days)
        
        // Получаем базовую статистику
        const [totalJobs, activeJobs, totalApplications] = await Promise.all([
          db.job.count({
            where: {
              employerId: companyId
            }
          }),
          db.job.count({
            where: {
              employerId: companyId,
              isActive: true
            }
          }),
          db.application.count({
            where: {
              job: {
                employerId: companyId
              },
              // Берём отклики за период; если их нет, позже отдадим 0
              createdAt: { gte: startDate }
            }
          })
        ])

        // Средние показатели
        // Просмотры: предпочитаем события из job_views; если их нет, используем суммарный счётчик из jobs.viewsCount
        let eventViewsCount = 0
        try {
          eventViewsCount = await db.jobView.count({
            where: {
              job: { employerId: companyId },
              createdAt: { gte: startDate },
            },
          })
        } catch {}
        const sumViewsFromJobs = await db.job.aggregate({
          _sum: { viewsCount: true },
          where: { employerId: companyId },
        })

        // Если за период нет событий просмотров, используем общий накопительный счётчик
        const totalViews = eventViewsCount > 0 ? eventViewsCount : (sumViewsFromJobs._sum.viewsCount ?? 0)

        const averageApplicationsPerJob = activeJobs > 0 ? totalApplications / activeJobs : 0
        const averageViewsPerJob = activeJobs > 0 ? totalViews / activeJobs : 0
        const conversionRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0

        // Топ вакансий
        const topPerformingJobs = await this.getTopPerformingJobs(companyId, startDate)

        // Тренды откликов
        let applicationTrends = await this.getApplicationTrends(companyId, startDate)
        // Если за период нет откликов, вернём пустой ряд, но метрики останутся нулевыми
        if (!Array.isArray(applicationTrends)) applicationTrends = []

        // Ежедневные просмотры/отклики суммарно по компании
        const monthlyStats = await this.getMonthlyStats(companyId, startDate)

        // Источники кандидатов (по referrer просмотров вакансий)
        const candidateSources = await this.getCandidateSources(companyId, startDate)

        // Демография: локации кандидатов
        const demographics = await this.getDemographics(companyId, startDate)

        // Качество кандидатов
        const candidateQuality = await this.getCandidateQuality(companyId, startDate)

        // Среднее время ответа (приближенно): время от создания отклика до его первого изменения статуса из PENDING
        const avgResponseTime = await this.getAverageResponseTime(companyId, startDate)

        return {
          companyId,
          totalJobs,
          activeJobs,
          totalApplications,
          totalViews,
          avgResponseTime,
          conversionRate,
          averageViewsPerJob,
          averageApplicationsPerJob,
          topPerformingJobs,
          applicationTrends,
          monthlyStats,
          candidateSources: candidateSources.length > 0
            ? candidateSources
            : (totalViews > 0 ? [{ source: 'Direct', count: totalViews, percentage: 100 }] : []),
          demographics,
          candidateQuality
        }
      },
      { ttl: 3600 } // 1 час
    )
  }

  // Получение топ вакансий
  private static async getTopPerformingJobs(companyId: string, startDate: Date) {
    try {
      const jobs = await db.$queryRaw`
        SELECT 
          j."id" as "jobId",
          j."title",
          j."viewsCount" as views,
          COUNT(a."id") as applications
        FROM "jobs" j
        LEFT JOIN "applications" a ON j."id" = a."jobId" AND a."createdAt" >= ${startDate}
        WHERE j."employerId" = ${companyId}
        GROUP BY j."id", j."title", j."viewsCount"
        ORDER BY applications DESC, views DESC
        LIMIT 5
      ` as Array<{ jobId: string; title: string; views: number; applications: number }>

      return jobs.map(j => ({
        ...j,
        conversionRate: j.views > 0 ? (j.applications / j.views) * 100 : 0,
      }))
    } catch {
      // Фолбэк без raw SQL: Prisma + группировка в памяти
      const [jobs, apps] = await Promise.all([
        db.job.findMany({
          where: { employerId: companyId },
          select: { id: true, title: true, viewsCount: true },
        }),
        db.application.groupBy({
          by: ['jobId'],
          where: { job: { employerId: companyId }, createdAt: { gte: startDate } },
          _count: { _all: true },
        }) as unknown as Array<{ jobId: string; _count: { _all: number } }>,
      ])

      const appsByJob = new Map<string, number>()
      for (const a of apps) appsByJob.set(a.jobId, (a as any)._count?._all ?? 0)
      const enriched = jobs.map(j => ({
        jobId: j.id,
        title: j.title,
        views: j.viewsCount || 0,
        applications: appsByJob.get(j.id) || 0,
        conversionRate: (j.viewsCount || 0) > 0 ? ((appsByJob.get(j.id) || 0) / (j.viewsCount || 0)) * 100 : 0,
      }))
      enriched.sort((a, b) => (b.applications - a.applications) || (b.views - a.views))
      return enriched.slice(0, 5)
    }
  }

  // Получение трендов откликов
  private static async getApplicationTrends(companyId: string, startDate: Date) {
    try {
      const trends = await db.$queryRaw`
        SELECT 
          DATE(a."createdAt") as date,
          COUNT(*) as applications
        FROM "applications" a
        WHERE a."createdAt" >= ${startDate}
          AND EXISTS (
            SELECT 1 FROM "jobs" j WHERE j."id" = a."jobId" AND j."employerId" = ${companyId}
          )
        GROUP BY DATE(a."createdAt")
        ORDER BY date DESC
        LIMIT 30
      ` as Array<{ date: string; applications: number }>
      return Array.isArray(trends) ? trends : []
    } catch {
      const apps = await db.application.findMany({
        where: { job: { employerId: companyId }, createdAt: { gte: startDate } },
        select: { createdAt: true },
        take: 5000,
      })
      const byDate = new Map<string, number>()
      for (const a of apps) {
        const key = new Date(a.createdAt).toISOString().slice(0, 10)
        byDate.set(key, (byDate.get(key) || 0) + 1)
      }
      return Array.from(byDate.entries())
        .map(([date, applications]) => ({ date, applications }))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 30)
    }
  }

  // Суммарные просмотры/отклики по дням для компании
  private static async getMonthlyStats(companyId: string, startDate: Date) {
    try {
      const rows = await db.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          SUM(CASE WHEN type = 'view' THEN 1 ELSE 0 END) as views,
          SUM(CASE WHEN type = 'application' THEN 1 ELSE 0 END) as applications,
          SUM(CASE WHEN type = 'hire' THEN 1 ELSE 0 END) as hires
        FROM (
          SELECT jv."createdAt", 'view' as type
          FROM "job_views" jv
          JOIN "jobs" j ON jv."jobId" = j."id"
          WHERE j."employerId" = ${companyId} AND jv."createdAt" >= ${startDate}
          UNION ALL
          SELECT a."createdAt", 'application' as type
          FROM "applications" a
          JOIN "jobs" j ON a."jobId" = j."id"
          WHERE j."employerId" = ${companyId} AND a."createdAt" >= ${startDate}
          UNION ALL
          SELECT a."createdAt", 'hire' as type
          FROM "applications" a
          JOIN "jobs" j ON a."jobId" = j."id"
          WHERE j."employerId" = ${companyId} AND a."createdAt" >= ${startDate} AND a."status" = 'HIRED'
        ) combined
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
        LIMIT 90
      ` as Array<{ date: string; views: number; applications: number; hires: number }>

      // Заполняем пропущенные дни нулями
      const byDate = new Map<string, { date: string; views: number; applications: number; hires: number }>()
      for (const r of rows) byDate.set(String(r.date), { date: String(r.date), views: Number(r.views)||0, applications: Number(r.applications)||0, hires: Number(r.hires)||0 })

      // Fallback для просмотров по дням из jobs.viewsCount, если событий просмотров нет
      const totalEventViews = rows.reduce((s, r) => s + Number(r.views || 0), 0)
      if (totalEventViews === 0) {
        const sumViews = await db.job.aggregate({
          _sum: { viewsCount: true },
          where: { employerId: companyId },
        })
        const totalViews = Number(sumViews._sum.viewsCount || 0)
        if (totalViews > 0) {
          const days: string[] = []
          let d2 = startOfDay(startDate)
          const today2 = startOfDay(new Date())
          while (d2 <= today2) {
            days.push(d2.toISOString().slice(0, 10))
            d2 = new Date(d2.getTime() + 24 * 60 * 60 * 1000)
          }
          const perDay = Math.floor(totalViews / Math.max(1, days.length))
          const remainder = totalViews - perDay * days.length
          days.forEach((key, idx) => {
            const existing = byDate.get(key) || { date: key, views: 0, applications: 0, hires: 0 }
            existing.views = perDay + (idx < remainder ? 1 : 0)
            byDate.set(key, existing)
          })
        }
      }
      const result: Array<{ date: string; views: number; applications: number; hires: number }> = []
      let d = startOfDay(startDate)
      const today = startOfDay(new Date())
      while (d <= today) {
        const key = d.toISOString().slice(0, 10)
        const item = byDate.get(key)
        result.push(item ?? { date: key, views: 0, applications: 0, hires: 0 })
        d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
      }
      return result
    } catch {
      // Fallback без raw SQL и без зависимости от таблицы job_views
      // 1) Считаем отклики и наймы по дням
      const [apps, hires] = await Promise.all([
        db.application.findMany({
          where: { job: { employerId: companyId }, createdAt: { gte: startDate } },
          select: { createdAt: true },
          take: 10000,
        }),
        db.application.findMany({
          where: { job: { employerId: companyId }, createdAt: { gte: startDate }, status: 'HIRED' },
          select: { createdAt: true },
          take: 10000,
        }),
      ])
      const byDate = new Map<string, { views: number; applications: number; hires: number }>()
      for (const a of apps) {
        const k = new Date((a as any).createdAt).toISOString().slice(0, 10)
        const rec = byDate.get(k) || { views: 0, applications: 0, hires: 0 }
        rec.applications += 1
        byDate.set(k, rec)
      }
      for (const h of hires) {
        const k = new Date((h as any).createdAt).toISOString().slice(0, 10)
        const rec = byDate.get(k) || { views: 0, applications: 0, hires: 0 }
        rec.hires += 1
        byDate.set(k, rec)
      }
      // 2) Распределяем общий счётчик просмотров jobs.viewsCount равномерно по диапазону
      const sumViews = await db.job.aggregate({ _sum: { viewsCount: true }, where: { employerId: companyId } })
      const totalViews = Number(sumViews._sum.viewsCount || 0)
      if (totalViews > 0) {
        const days: string[] = []
        let d2 = startOfDay(startDate)
        const today2 = startOfDay(new Date())
        while (d2 <= today2) {
          days.push(d2.toISOString().slice(0, 10))
          d2 = new Date(d2.getTime() + 24 * 60 * 60 * 1000)
        }
        const perDay = Math.floor(totalViews / Math.max(1, days.length))
        const remainder = totalViews - perDay * days.length
        days.forEach((key, idx) => {
          const rec = byDate.get(key) || { views: 0, applications: 0, hires: 0 }
          rec.views = perDay + (idx < remainder ? 1 : 0)
          byDate.set(key, rec)
        })
      }
      const result: Array<{ date: string; views: number; applications: number; hires: number }> = []
      let d = startOfDay(startDate)
      const today = startOfDay(new Date())
      while (d <= today) {
        const key = d.toISOString().slice(0, 10)
        const rec = byDate.get(key) || { views: 0, applications: 0, hires: 0 }
        result.push({ date: key, ...rec })
        d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
      }
      return result
    }
  }

  // Источники кандидатов по просмотрам вакансий компании
  private static async getCandidateSources(companyId: string, startDate: Date) {
    try {
      const rows = await db.$queryRaw`
        SELECT 
          CASE 
            WHEN jv."referrer" ILIKE '%google%' THEN 'Google'
            WHEN jv."referrer" ILIKE '%linkedin%' THEN 'LinkedIn'
            WHEN jv."referrer" ILIKE '%facebook%' THEN 'Facebook'
            WHEN jv."referrer" IS NULL OR jv."referrer" = '' THEN 'Direct'
            ELSE 'Other'
          END as source,
          COUNT(*) as count
        FROM "job_views" jv
        JOIN "jobs" j ON jv."jobId" = j."id"
        WHERE j."employerId" = ${companyId} AND jv."createdAt" >= ${startDate}
        GROUP BY source
        ORDER BY count DESC
        LIMIT 6
      ` as Array<{ source: string; count: number }>

      if (rows.length > 0) {
        const total = rows.reduce((sum, r) => sum + r.count, 0)
        return rows.map(r => ({
          source: r.source,
          count: r.count,
          percentage: total > 0 ? (r.count / total) * 100 : 0,
        }))
      }
    } catch {
      // ignore and return safe fallback below
    }
    // Фолбэк: показываем один источник Direct с суммарными просмотрами
    const sumViews = await db.job.aggregate({
      _sum: { viewsCount: true },
      where: { employerId: companyId },
    })
    const total = Number(sumViews._sum.viewsCount || 0)
    return total > 0
      ? [{ source: 'Direct', count: total, percentage: 100 }]
      : []
  }

  // Демография: распределение по локациям кандидатов
  private static async getDemographics(companyId: string, startDate: Date) {
    try {
      const rows = await db.$queryRaw`
        SELECT 
          COALESCE(cp."location", 'Не указано') as category,
          COUNT(*) as count
        FROM "applications" a
        JOIN "jobs" j ON a."jobId" = j."id"
        JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
        WHERE j."employerId" = ${companyId} AND a."createdAt" >= ${startDate}
        GROUP BY COALESCE(cp."location", 'Не указано')
        ORDER BY count DESC
        LIMIT 6
      ` as Array<{ category: string; count: number }>
      const total = rows.reduce((sum, r) => sum + r.count, 0)
      return rows.map(r => ({
        category: r.category,
        value: total > 0 ? Math.round((r.count / total) * 100) : 0,
      }))
    } catch {
      const apps = await db.application.findMany({
        where: { job: { employerId: companyId }, createdAt: { gte: startDate } },
        select: { candidate: { select: { location: true } } },
        take: 5000,
      })
      const byLoc = new Map<string, number>()
      for (const a of apps) {
        const loc = (a as any).candidate?.location || 'Не указано'
        byLoc.set(loc, (byLoc.get(loc) || 0) + 1)
      }
      const total = Array.from(byLoc.values()).reduce((s, n) => s + n, 0)
      return Array.from(byLoc.entries())
        .map(([category, count]) => ({ category, value: total > 0 ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    }
  }

  // Среднее время ответа: разница между application.updatedAt и createdAt для заявок, по которым статус менялся с PENDING
  private static async getAverageResponseTime(companyId: string, startDate: Date): Promise<number> {
    const apps = await db.application.findMany({
      where: {
        job: { employerId: companyId },
        createdAt: { gte: startDate },
        NOT: { status: 'PENDING' },
      },
      select: { createdAt: true, updatedAt: true },
      take: 5000,
    })
    if (apps.length === 0) return 0
    const totalMs = apps.reduce((sum, a) => sum + Math.max(0, a.updatedAt.getTime() - a.createdAt.getTime()), 0)
    const avgHours = totalMs / apps.length / (1000 * 60 * 60)
    return Math.round(avgHours)
  }

  // Получение данных о качестве кандидатов
  private static async getCandidateQuality(companyId: string, startDate: Date) {
    const [experienceData, skillsData] = await Promise.all([
      db.$queryRaw`
        SELECT AVG(cp."experience") as "avgExperience"
        FROM "applications" a
        JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
        WHERE a."createdAt" >= ${startDate}
          AND EXISTS (
            SELECT 1 FROM "jobs" j WHERE j."id" = a."jobId" AND j."employerId" = ${companyId}
          )
      ` as Array<{ avgExperience: number }>,

      db.$queryRaw`
        SELECT 
          s."name" as skill,
          COUNT(*) as count
        FROM "applications" a
        JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
        JOIN "candidate_skills" cs ON cp."id" = cs."candidateId"
        JOIN "skills" s ON cs."skillId" = s."id"
        WHERE a."createdAt" >= ${startDate}
          AND EXISTS (
            SELECT 1 FROM "jobs" j WHERE j."id" = a."jobId" AND j."employerId" = ${companyId}
          )
        GROUP BY s."name"
        ORDER BY count DESC
        LIMIT 10
      ` as Array<{ skill: string; count: number }>
    ])

    const averageExperience = experienceData[0]?.avgExperience || 0
    const satisfactionRate = await this.calculateSatisfactionRate(companyId, startDate)

    return {
      averageExperience,
      topSkills: skillsData,
      satisfactionRate
    }
  }

  // Расчет уровня удовлетворенности (упрощенный)
  private static async calculateSatisfactionRate(companyId: string, startDate: Date) {
    const totalApplications = await db.application.count({
      where: {
        job: {
          employerId: companyId
        },
        createdAt: { gte: startDate }
      }
    })

    const positiveOutcomes = await db.application.count({
      where: {
        job: {
          employerId: companyId
        },
        status: { in: ['SHORTLISTED', 'HIRED'] },
        createdAt: { gte: startDate }
      }
    })

    return totalApplications > 0 ? (positiveOutcomes / totalApplications) * 100 : 0
  }
}

// Сервис платформенной аналитики
export class PlatformAnalyticsService {
  // Получение платформенной аналитики
  static async getPlatformAnalytics(days: number = 30): Promise<PlatformAnalytics> {
    const cacheKey = { days }
    
    return await cachedFetch(
      'platform-analytics',
      cacheKey,
      async () => {
        const startDate = subDays(new Date(), days)
        
        // Базовая статистика
        const [totalUsers, totalJobs, totalApplications, totalCompanies] = await Promise.all([
          db.user.count(),
          db.job.count(),
          db.application.count(),
          db.employerProfile.count()
        ])

        // Рост пользователей
        const userGrowth = await this.getGrowthData(
          'users',
          'createdAt',
          startDate
        ) as Array<{ date: string; users: number }>

        // Рост вакансий
        const jobGrowth = await this.getGrowthData(
          'jobs',
          'createdAt',
          startDate
        ) as Array<{ date: string; jobs: number }>

        // Рост откликов
        const applicationGrowth = await this.getGrowthData(
          'applications',
          'createdAt',
          startDate
        ) as Array<{ date: string; applications: number }>

        // Топ категории
        const topCategories = await this.getTopCategories(startDate)

        // Топ локации
        const topLocations = await this.getTopLocations(startDate)

        return {
          totalUsers,
          totalJobs,
          totalApplications,
          totalCompanies,
          userGrowth,
          jobGrowth,
          applicationGrowth,
          topCategories,
          topLocations
        }
      },
      { ttl: 1800 } // 30 минут
    )
  }

  // Получение данных о росте
  private static async getGrowthData(table: string, dateColumn: string, startDate: Date) {
    const growth = await db.$queryRaw`
      SELECT 
        DATE(${dateColumn}) as date,
        COUNT(*) as count
      FROM ${table}
      WHERE ${dateColumn} >= ${startDate}
      GROUP BY DATE(${dateColumn})
      ORDER BY date ASC
    ` as Array<{ date: string; count: number }>

    // Рассчитываем накопительный итог
    let cumulative = 0
    return growth.map(item => {
      cumulative += item.count
      return {
        date: item.date,
        [table === 'users' ? 'users' : table === 'jobs' ? 'jobs' : 'applications']: cumulative
      }
    })
  }

  // Получение топ категорий
  private static async getTopCategories(startDate: Date) {
    const categories = await db.$queryRaw`
      SELECT 
        s.category,
        COUNT(*) as count
      FROM job_skills js
      JOIN skills s ON js.skill_id = s.id
      JOIN jobs j ON js.job_id = j.id
      WHERE j.created_at >= ${startDate}
      GROUP BY s.category
      ORDER BY count DESC
      LIMIT 10
    ` as Array<{ category: string; count: number }>

    return categories
  }

  // Получение топ локаций
  private static async getTopLocations(startDate: Date) {
    const locations = await db.$queryRaw`
      SELECT 
        location,
        COUNT(*) as count
      FROM jobs
      WHERE created_at >= ${startDate} AND location IS NOT NULL
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    ` as Array<{ location: string; count: number }>

    return locations
  }
}

// Функция для отслеживания просмотров вакансий
export async function trackJobView(jobId: string, userId?: string) {
  try {
    await db.jobView.create({
      data: {
        jobId,
        userId,
        referrer: '', // В реальном приложении здесь был бы реферер
        userAgent: '' // В реальном приложении здесь был бы user agent
      }
    })

    // Инвалидируем кэш аналитики
    await cache.delete('job-analytics', { jobId })
  } catch (error) {
    console.error('Error tracking job view:', error)
  }
}

// Функция для получения реалтайм статистики
export async function getRealtimeStats() {
  const cacheKey = 'realtime-stats'
  
  return await cachedFetch(
    'realtime-stats',
    cacheKey,
    async () => {
      const [activeUsers, onlineJobs, recentApplications] = await Promise.all([
        db.user.count({
          where: {
            updatedAt: {
              gte: subDays(new Date(), 1)
            }
          }
        }),
        db.job.count({
          where: {
            isActive: true
          }
        }),
        db.application.count({
          where: {
            createdAt: {
              gte: subDays(new Date(), 1)
            }
          }
        })
      ])

      return {
        activeUsers,
        onlineJobs,
        recentApplications
      }
    },
    { ttl: 300 } // 5 минут
  )
}