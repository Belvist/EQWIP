'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  Eye,
  Ban,
  Trash2,
  Download,
  ChevronDown
} from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface AdminStats {
  totalUsers: number
  totalJobs: number
  totalApplications: number
  activeUsers: number
  newUsersToday: number
  newJobsToday: number
  pendingReports: number
  flaggedContent: number
}

interface RecentActivity {
  id: string
  type: 'user' | 'job' | 'application' | 'report'
  action: 'created' | 'updated' | 'deleted' | 'flagged'
  description: string
  timestamp: string
  user: {
    name: string
    email: string
    avatar?: string
  }
}

interface PendingReport {
  id: string
  type: 'job' | 'user' | 'company'
  reason: string
  description: string
  reportedBy: string
  createdAt: string
  target: {
    id: string
    name: string
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newJobsToday: 0,
    pendingReports: 0,
    flaggedContent: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  // dropdown state handled by Radix; no local state required

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchAdminData()
    }
  }, [status, router, session, timeRange])

  const fetchAdminData = async () => {
    setIsLoading(true)
    try {
      // Fetch stats
      const statsResponse = await fetch(`/api/admin/stats?range=${timeRange}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }

      // Fetch pending reports
      const reportsResponse = await fetch('/api/admin/reports?status=pending')
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setPendingReports(reportsData)
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные панели администратора",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportAction = async (reportId: string, action: 'approve' | 'reject' | 'ban') => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await fetchAdminData()
        toast({
          title: "Успешно",
          description: `Жалоба обработана`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обработать жалобу",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать жалобу",
        variant: "destructive",
      })
    }
  }

  const getActivityIcon = (type: string, action: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />
      case 'job':
        return <Briefcase className="w-4 h-4" />
      case 'application':
        return <TrendingUp className="w-4 h-4" />
      case 'report':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-gray-100 text-gray-800'
      case 'updated':
        return 'bg-gray-100 text-gray-800'
      case 'deleted':
        return 'bg-gray-100 text-gray-800'
      case 'flagged':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return 'только что'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} мин. назад`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} ч. назад`
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="relative">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Панель администратора
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-xl px-2 py-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">меню</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  <DropdownMenuItem onClick={() => router.push('/admin/moderation/vacancies')}>Модерация вакансий и стажировок</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/companies')}>Управление резидентами (HR компаний)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/universities')}>Управление образовательными учрежденияениями</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { window.location.href = '/admin/analytics' }}>Аналитика и отчёты</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/admin')}>Пользователи и настройки</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-slate-600">
              Управление платформой и модерация контента
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 часа</SelectItem>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
                <SelectItem value="90d">90 дней</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Всего пользователей</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                  <p className="text-xs text-slate-500">
                    +{stats.newUsersToday} сегодня
                  </p>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Всего вакансий</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalJobs}</p>
                  <p className="text-xs text-slate-500">
                    +{stats.newJobsToday} сегодня
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Всего откликов</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalApplications}</p>
                  <p className="text-xs text-slate-500">
                    {stats.activeUsers} активных пользователей
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Ожидают проверки</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingReports}</p>
                  <p className="text-xs text-slate-500">
                    {stats.flagedContent} помечено
                  </p>
                </div>
                <Shield className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Последняя активность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                          {getActivityIcon(activity.type, activity.action)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900">{activity.description}</p>
                            <span className="text-xs text-slate-500">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={activity.user.avatar ? (activity.user.avatar.startsWith('/api/') ? activity.user.avatar : `/api/profile/avatar?user=${encodeURIComponent((activity as any).userId || '')}`) : undefined} />
                              <AvatarFallback className="text-xs">
                                {activity.user.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm text-slate-600">{activity.user.name}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Нет недавней активности</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Reports */}
          <div>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Ожидающие жалобы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReports.length > 0 ? (
                    pendingReports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {report.type}
                            </Badge>
                            <p className="font-medium text-slate-900 mt-1">
                              {report.target.name}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatTime(report.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-2">
                          <strong>Причина:</strong> {report.reason}
                        </p>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {report.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            Жалоба от: {report.reportedBy}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReportAction(report.id, 'approve')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReportAction(report.id, 'reject')}
                              className="text-slate-600 hover:text-slate-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReportAction(report.id, 'ban')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-slate-600">Нет ожидающих жалоб</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}