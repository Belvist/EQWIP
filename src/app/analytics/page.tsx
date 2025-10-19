'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MessageCircle, 
  Calendar,
  Target,
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Footer from '@/components/Footer'
import { useUser } from '@/contexts/UserContext'

interface AnalyticsData {
  totalViews: number
  totalApplications: number
  avgResponseTime: number
  conversionRate: number
  topJobs: Array<{
    id: string
    title: string
    views: number
    applications: number
    conversionRate: number
  }>
  dailyStats: Array<{
    date: string
    views: number
    applications: number
  }>
  demographicData: {
    locations: Array<{
      location: string
      count: number
      percentage: number
    }>
    experience: Array<{
      level: string
      count: number
      percentage: number
    }>
  }
}

export default function AnalyticsPage() {
  const { userRole, isLoggedIn } = useUser()
  const router = useRouter()
  // If an ADMIN lands on the public analytics page, redirect to admin analytics.
  // Some contexts may not populate `userRole` immediately, so query the session endpoint directly as a fallback.
  useEffect(() => {
    let cancelled = false
    const tryRedirect = async () => {
      try {
        // first prefer client context value
        if (userRole === 'ADMIN') {
          router.replace('/admin/analytics')
          return
        }
        // fallback: ask NextAuth session endpoint
        const res = await fetch('/api/auth/session')
        if (!res.ok) return
        const session = await res.json()
        if (cancelled) return
        if (session?.user?.role === 'ADMIN') {
          router.replace('/admin/analytics')
        }
      } catch {
        // ignore
      }
    }
    tryRedirect()
    return () => { cancelled = true }
  }, [userRole, router])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedJob, setSelectedJob] = useState<string>('all')

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isLoggedIn || userRole !== 'employer') {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/employer/analytics?range=${timeRange}`)
        if (response.ok) {
          const payload = await response.json()
          const d = payload?.data
          if (d) {
            // Преобразуем ответ /api/employer/analytics к локальному интерфейсу страницы
            const mapped: AnalyticsData = {
              totalViews: Number(d.totalViews || 0),
              totalApplications: Number(d.totalApplications || 0),
              avgResponseTime: Number(d.avgResponseTime || 0),
              conversionRate: Number(d.conversionRate || 0),
              topJobs: Array.isArray(d.topPerformingJobs)
                ? d.topPerformingJobs.map((j: any) => ({
                    id: String(j.jobId),
                    title: String(j.title || ''),
                    views: Number(j.views || 0),
                    applications: Number(j.applications || 0),
                    conversionRate: Number(j.conversionRate || 0),
                  }))
                : [],
              dailyStats: Array.isArray(d.monthlyStats)
                ? d.monthlyStats.map((m: any) => ({
                    date: String(m.date),
                    views: Number(m.views || 0),
                    applications: Number(m.applications || 0),
                  }))
                : [],
              demographicData: {
                locations: Array.isArray(d.demographics)
                  ? d.demographics.map((x: any) => ({
                      location: String(x.category || 'Не указано'),
                      count: Number(x.value || 0),
                      percentage: Number(x.value || 0),
                    }))
                  : [],
                experience: [],
              },
            }
            setAnalyticsData(mapped)
          } else {
            setAnalyticsData(null)
          }
        } else {
          // Fallback to mock data
          setAnalyticsData({
            totalViews: 15420,
            totalApplications: 342,
            avgResponseTime: 2.4,
            conversionRate: 2.2,
            topJobs: [
              { id: '1', title: 'Senior React Developer', views: 3420, applications: 89, conversionRate: 2.6 },
              { id: '2', title: 'Python ML Engineer', views: 2890, applications: 67, conversionRate: 2.3 },
              { id: '3', title: 'DevOps Engineer', views: 2150, applications: 45, conversionRate: 2.1 },
              { id: '4', title: 'Product Manager', views: 1980, applications: 38, conversionRate: 1.9 },
              { id: '5', title: 'UX Designer', views: 1650, applications: 32, conversionRate: 1.9 }
            ],
            dailyStats: [
              { date: '2024-01-01', views: 450, applications: 12 },
              { date: '2024-01-02', views: 520, applications: 15 },
              { date: '2024-01-03', views: 480, applications: 11 },
              { date: '2024-01-04', views: 610, applications: 18 },
              { date: '2024-01-05', views: 590, applications: 16 },
              { date: '2024-01-06', views: 720, applications: 22 },
              { date: '2024-01-07', views: 680, applications: 19 }
            ],
            demographicData: {
              locations: [
                { location: 'Москва', count: 145, percentage: 42.4 },
                { location: 'Санкт-Петербург', count: 89, percentage: 26.0 },
                { location: 'Новосибирск', count: 45, percentage: 13.2 },
                { location: 'Екатеринбург', count: 32, percentage: 9.4 },
                { location: 'Другие', count: 31, percentage: 9.0 }
              ],
              experience: [
                { level: 'Senior', count: 156, percentage: 45.6 },
                { level: 'Middle', count: 124, percentage: 36.3 },
                { level: 'Junior', count: 42, percentage: 12.3 },
                { level: 'Lead', count: 20, percentage: 5.8 }
              ]
            }
          })
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [isLoggedIn, userRole, timeRange, selectedJob])

  if (!isLoggedIn || userRole !== 'employer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Аналитика
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Только работодатели имеют доступ к аналитике. Войдите как работодатель, чтобы продолжить.
          </p>
          <Button 
            size="lg"
            variant="inverted"
            onClick={() => window.location.href = '/auth/signin'}
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
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Загрузка аналитики...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Собираем данные о ваших вакансиях
          </p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Нет данных
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            У вас пока нет вакансий для анализа. Создайте первую вакансию, чтобы увидеть аналитику.
          </p>
          <Button 
            size="lg"
            variant="inverted"
            onClick={() => window.location.href = '/post-job'}
          >
            Создать вакансию
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Аналитика
              </h1>
              <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Детальная статистика по вашим вакансиям и кандидатам
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-48 bg-white dark:bg-black border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Выберите вакансию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все вакансии</SelectItem>
                {analyticsData.topJobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
              <SelectTrigger className="w-32 bg-white dark:bg-black border-gray-300 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
                <SelectItem value="90d">90 дней</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-2xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.totalViews.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Просмотры</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +8%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.totalApplications.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Отклики</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +0.3%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.conversionRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Конверсия</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  -0.5
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.avgResponseTime} дня
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Средний ответ</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Jobs */}
          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Топ вакансий
                </h2>
              </div>

              <div className="space-y-4">
                {analyticsData.topJobs.map((job, index) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {job.views.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {job.applications}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {job.conversionRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">конверсия</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Демография кандидатов
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">По локациям</h3>
                  <div className="space-y-2">
                    {analyticsData.demographicData.locations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{location.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-400"
                              style={{ width: `${location.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                            {location.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">По опыту</h3>
                  <div className="space-y-2">
                    {analyticsData.demographicData.experience.map((exp, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{exp.level}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-400"
                              style={{ width: `${exp.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                            {exp.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Stats */}
        <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6 mb-8">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Ежедневная статистика
              </h2>
            </div>

            <div className="space-y-4">
              {analyticsData.dailyStats.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {day.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {day.applications}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {((day.applications / day.views) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  )
}