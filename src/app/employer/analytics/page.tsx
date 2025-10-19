'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import * as Recharts from 'recharts'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Eye, 
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Clock,
  DollarSign,
  Building,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import * as recharts from 'recharts'

interface AnalyticsData {
  totalViews: number
  totalApplications: number
  avgResponseTime: number
  conversionRate: number
  topPerformingJobs: Array<{
    jobId: string
    title: string
    views: number
    applications: number
    conversionRate: number
  }>
  candidateSources: Array<{
    source: string
    count: number
    percentage: number
  }>
  monthlyStats: Array<{
    date: string
    views: number
    applications: number
    hires: number
  }>
  demographics: Array<{
    category: string
    value: number
  }>
}

export default function EmployerAnalytics() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const isEmployer = (session?.user as any)?.role === 'EMPLOYER'

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fetchAnalytics = async () => {
      if (!isLoggedIn || !isEmployer) return
      setLoading(true)
      setError(null)
      try {
        const force = refreshTick > 0 ? '&force=1' : ''
        const res = await fetch(`/api/employer/analytics?range=${timeRange}${force}`)
        if (!res.ok) {
          let msg = `Failed to fetch analytics (${res.status})`
          try { const j = await res.json(); if (j?.error) msg = j.error } catch {}
          throw new Error(msg)
        }
        const payload = await res.json()
        setData(payload.data as AnalyticsData)
      } catch (e: any) {
        setError(e?.message || 'Не удалось загрузить аналитику')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [isLoggedIn, isEmployer, timeRange, refreshTick])

  const safeNumber = (v: any, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d)
  const formatNumber = (num: number | undefined) => {
    const n = safeNumber(num, 0)
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
  }
  const formatPercentage = (num: number | undefined) => safeNumber(num, 0).toFixed(1) + '%'
  const getChangeColor = (current: number | undefined, previous: number | undefined) => {
    const c = safeNumber(current, 0); const p = safeNumber(previous, 0)
    const change = p ? ((c - p) / p) * 100 : 0
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }
  const getChangeIcon = (current: number | undefined, previous: number | undefined) => {
    const c = safeNumber(current, 0); const p = safeNumber(previous, 0)
    const change = p ? ((c - p) / p) * 100 : 0
    if (change > 0) return <ArrowUpRight className="w-4 h-4" />
    if (change < 0) return <ArrowDownRight className="w-4 h-4" />
    return null
  }

  if (!isLoggedIn || !isEmployer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Аналитика и статистика
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как работодатель, чтобы получить доступ к детальной аналитике по вашим вакансиям
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => (window.location.href = '/auth/signin')}
          >
            Войти как работодатель
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        Загрузка аналитики…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-xl mx-auto px-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-xl mx-auto px-4 text-gray-600 dark:text-gray-400">
          Нет данных для отображения. Создайте вакансии и дождитесь набора статистики.
        </div>
      </div>
    )
  }

  const analyticsData = {
    totalViews: safeNumber(data.totalViews, 0),
    totalApplications: safeNumber(data.totalApplications, 0),
    avgResponseTime: safeNumber((data as any).avgResponseTime, 0),
    conversionRate: safeNumber((data as any).conversionRate, 0),
    topPerformingJobs: Array.isArray(data.topPerformingJobs) ? data.topPerformingJobs : [],
    candidateSources: Array.isArray(data.candidateSources) ? data.candidateSources : [],
    monthlyStats: Array.isArray((data as any).monthlyStats) ? (data as any).monthlyStats : [],
    demographics: Array.isArray((data as any).demographics) ? (data as any).demographics : [],
  } as AnalyticsData

  const isYearRange = timeRange === '1y' || timeRange === '90d'

  // Градации серого для диаграмм (универсально для обеих тем)
  const donutColors = ['#1a1a1a', '#2a2a2a', '#808080', '#4b5563', '#6b7280', '#9ca3af']
  const hasMultipleSources = (Array.isArray(analyticsData.candidateSources) ? analyticsData.candidateSources.length : 0) > 1
  const piePaddingAngle = hasMultipleSources ? 2 : 0

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }

  const monthGroups = (() => {
    const groups = new Map<string, { key: string; views: number; applications: number; hires: number; days: typeof analyticsData.monthlyStats }>()
    for (const s of analyticsData.monthlyStats) {
      const d = new Date(s.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const existing = groups.get(key) || { key, views: 0, applications: 0, hires: 0, days: [] as typeof analyticsData.monthlyStats }
      existing.views += Number(s.views || 0)
      existing.applications += Number(s.applications || 0)
      existing.hires += Number(s.hires || 0)
      existing.days.push(s)
      groups.set(key, existing)
    }
    return Array.from(groups.values()).sort((a, b) => (a.key < b.key ? -1 : 1))
  })()

  // Ключ текущего месяца вида YYYY-MM
  const todayObj = new Date()
  const currentMonthKey = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}`

  // Данные по дням текущего месяца (1..сегодня)
  const dailyCurrentMonth = (() => {
    const y = todayObj.getFullYear()
    const m = todayObj.getMonth()
    const lastDay = new Date(y, m + 1, 0).getDate()
    const endDay = todayObj.getDate()
    const byDate = new Map<string, { views: number; applications: number }>()
    for (const s of analyticsData.monthlyStats) {
      const d = new Date(s.date)
      if (d.getFullYear() === y && d.getMonth() === m) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        byDate.set(key, { views: Number(s.views || 0), applications: Number(s.applications || 0) })
      }
    }
    const out: Array<{ name: string; views: number; applications: number }> = []
    const stop = Math.min(lastDay, endDay)
    for (let day = 1; day <= stop; day++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const v = byDate.get(key) || { views: 0, applications: 0 }
      out.push({ name: String(day), views: v.views, applications: v.applications })
    }
    return out
  })()

  const chartData = isYearRange
    ? monthGroups.slice(-3).map(g => ({ name: monthLabel(g.key), views: g.views, applications: g.applications }))
    : dailyCurrentMonth

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Аналитика
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Детальная статистика по вашим вакансиям и эффективности найма
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                {['7d', '30d', '90d', '1y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setRefreshTick(v => v + 1)}>
                <RefreshCw className="w-4 h-4" />
                Обновить
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Всего просмотров
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analyticsData.totalViews)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Отклики
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analyticsData.totalApplications)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Среднее время ответа
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.avgResponseTime}ч
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Конверсия
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(analyticsData.conversionRate)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Line chart: Views/Applications by month */}
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Тренды просмотров и откликов</h3>
                {!mounted ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Загрузка…</div>
                ) : analyticsData.monthlyStats.length === 0 ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Нет данных за выбранный период</div>
                ) : (
                  <ChartContainer
                    id="line-trends"
                    config={{
                      views: {
                        label: 'Просмотры',
                        theme: { light: 'var(--chart-2)', dark: 'var(--chart-2)' },
                      },
                      applications: {
                        label: 'Отклики',
                        theme: { light: '#1f2937', dark: '#d1d5db' }, // gray-800 / gray-300
                      },
                    }}
                    className="h-80 w-full"
                  >
                    <Recharts.LineChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" />
                      <Recharts.XAxis dataKey="name" />
                      <Recharts.YAxis />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(value: any) => {
                          const str = String(value)
                          // Для 30d показываем «ДД <месяц>»
                          if (!isYearRange && /^\d+$/.test(str)) {
                            const day = str.padStart(2, '0')
                            const month = todayObj.toLocaleDateString('ru-RU', { month: 'long' })
                            return `${day} ${month}`
                          }
                          return str
                        }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Recharts.Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={false} />
                      <Recharts.Line type="monotone" dataKey="applications" stroke="var(--color-applications)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                    </Recharts.LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie chart: Candidate sources */}
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Источники кандидатов</h3>
                {!mounted ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Загрузка…</div>
                ) : analyticsData.candidateSources.length === 0 ? (
                  <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Нет источников</div>
                ) : (
                  <ChartContainer
                    id="pie-sources"
                    config={{ sources: { label: 'Источник', color: 'var(--chart-3)' } }}
                    className="h-80 w-full"
                  >
                    <Recharts.PieChart>
                      <Recharts.Pie
                        data={analyticsData.candidateSources.map(s => ({ name: s.source, value: s.percentage }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={piePaddingAngle}
                        startAngle={90}
                        endAngle={-270}
                        label
                      >
                        {analyticsData.candidateSources.map((s, i) => (
                          <Recharts.Cell key={i} fill={donutColors[i % donutColors.length]} />
                        ))}
                      </Recharts.Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </Recharts.PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lists */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Топ вакансий
                  </h3>
                </div>
                <div className="space-y-4">
                  {analyticsData.topPerformingJobs.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Нет данных</div>
                  )}
                  {analyticsData.topPerformingJobs.map((job) => (
                    <button key={job.jobId} onClick={() => (window.location.href = `/employer/jobs/${job.jobId}`)} className="w-full text-left flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(job.views)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {job.applications}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatPercentage(job.conversionRate)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">конверсия</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Источники кандидатов
                  </h3>
                </div>
                <div className="space-y-4">
                  {analyticsData.candidateSources.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.source}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {source.count} ({formatPercentage(source.percentage)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-gray-600 to-gray-800 h-2 rounded-full transition-all duration-300" style={{ width: `${source.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Динамика по месяцам</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Период
                  </Button>
                </div>
              </div>
              {isYearRange ? (
                <div className="space-y-3">
                  {monthGroups.map(g => (
                    <div key={g.key} className="border rounded-xl p-3">
                      <button
                        className="w-full flex items-center justify-between"
                        onClick={() => setExpandedMonth(prev => (prev === g.key ? null : g.key))}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{monthLabel(g.key)}</div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2"><Eye className="w-4 h-4" />{formatNumber(g.views)}</div>
                          <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />{g.applications}</div>
                          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />{g.hires}</div>
                        </div>
                      </button>
                      {expandedMonth !== g.key && (
                        <div className="mt-2">
                          <ChartContainer
                            id={`mini-${g.key}`}
                            config={{
                              views: {
                                label: 'Просмотры',
                                theme: { light: 'var(--chart-2)', dark: 'var(--chart-2)' },
                              },
                              applications: {
                                label: 'Отклики',
                                theme: { light: '#059669', dark: '#34d399' },
                              },
                            }}
                            className="h-32 w-full"
                          >
                            <Recharts.LineChart data={g.days.map(s => ({ name: s.date.slice(8,10), views: s.views, applications: s.applications }))} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                              <Recharts.CartesianGrid strokeDasharray="3 3" />
                              <Recharts.XAxis hide dataKey="name" />
                              <Recharts.YAxis hide />
                              <Recharts.Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={false} />
                              <Recharts.Line type="monotone" dataKey="applications" stroke="var(--color-applications)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                            </Recharts.LineChart>
                          </ChartContainer>
                        </div>
                      )}
                      {expandedMonth === g.key && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium">Просмотры</span>
                            </div>
                            {g.days.map((s, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{s.date}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(s.views)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium">Отклики</span>
                            </div>
                            {g.days.map((s, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{s.date}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{s.applications}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-medium">Наймы</span>
                            </div>
                            {g.days.map((s, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{s.date}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{s.hires}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Просмотры</span>
                    </div>
                    {analyticsData.monthlyStats.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{s.date}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(s.views)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Отклики</span>
                    </div>
                    {analyticsData.monthlyStats.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{s.date}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{s.applications}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Наймы</span>
                    </div>
                    {analyticsData.monthlyStats.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{s.date}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{s.hires}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">География кандидатов</h3>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <svg viewBox="0 0 800 450" className="w-full h-[320px] bg-white dark:bg-black">
                  <defs>
                    <style>{`.country{fill:none;stroke:#9ca3af;stroke-width:0.8}.dark .country{stroke:#6b7280}.hot{fill:#9ca3af}.dark .hot{fill:#6b7280}`}</style>
                  </defs>
                  <g>
                    <path className="country" d="M90,120 L150,110 L200,130 L210,170 L160,190 L100,170 Z"/>
                    <path className="country" d="M260,140 L330,130 L360,160 L320,200 L250,180 Z"/>
                    <path className="country" d="M420,120 L500,140 L520,180 L470,210 L410,180 Z"/>
                    <path className="country" d="M560,210 L640,200 L680,240 L620,270 L560,250 Z"/>
                  </g>
                </svg>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsData.demographics.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">Нет данных</div>
                )}
                {analyticsData.demographics.map((d, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{d.value}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{d.category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}