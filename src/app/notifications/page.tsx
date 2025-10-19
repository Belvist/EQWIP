'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  CheckCircle, 
  Info, 
  X, 
  Eye,
  Clock,
  Building,
  Briefcase,
  MessageCircle,
  Star,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useUser } from '@/contexts/UserContext'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ApiNotification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: any
    jobTitle?: string
}

export default function NotificationsPage() {
  const { userRole, isLoggedIn } = useUser()
  const router = useRouter()
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/notifications?limit=200', { cache: 'no-store' })
        if (res.status === 401) {
          setNotifications([])
          setError('Требуется вход')
          return
        }
        if (!res.ok) {
          setNotifications([])
          setError(`Ошибка ${res.status}`)
          return
        }
        const data = await res.json()
        const mapped: ApiNotification[] = Array.isArray(data)
          ? data.map((n: any) => {
              const rawTitle = String(n.title || '')
              const rawMessage = String(n.message || '')
              const parsed = (() => {
                const m = rawMessage.trim()
                if (m.startsWith('{') && m.endsWith('}')) {
                  try { return JSON.parse(m) } catch { return undefined }
                }
                return undefined
              })()
              const rawType = n.type ? String(n.type) : ''
              const normalizedType = rawType
                ? rawType
                : (rawTitle.toUpperCase() === 'AI_FEEDBACK' || (parsed && (parsed.reason || parsed.jobId))
                    ? 'AI_FEEDBACK'
                    : 'SYSTEM')
              return {
                id: String(n.id),
                type: normalizedType,
                title: rawTitle,
                message: rawMessage,
                isRead: !!n.isRead,
                createdAt: n.createdAt ? String(n.createdAt) : new Date().toISOString(),
                data: n.data ?? parsed,
              }
            })
          : []
        setNotifications(mapped)
      } catch (e) {
        setError('Не удалось загрузить уведомления')
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationIds: [id], markAsRead: true }) })
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
    } catch {}
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length === 0) return
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationIds: unreadIds, markAsRead: true }) })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  // old helpers removed (inline mapping is used below)

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.isRead) ||
                         (filter === 'important' && (notification as any).important)
    
    const matchesSearch = searchQuery === '' || 
                         notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const timeLabel = (iso: string) => {
    const date = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'только что'
    if (diff < 3600) return `${Math.floor(diff/60)} мин. назад`
    if (diff < 86400) return `${Math.floor(diff/3600)} ч. назад`
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const parsePayload = (n: ApiNotification): any | null => {
    if (n && n.data && typeof n.data === 'object') return n.data
    const msg = (n && typeof n.message === 'string') ? n.message.trim() : ''
    if (msg.startsWith('{') && msg.endsWith('}')) {
      try {
        const obj = JSON.parse(msg)
        if (obj && typeof obj === 'object') return obj
      } catch {}
    }
    // Try to extract JSON substring if message contains extra text
    const first = msg.indexOf('{')
    const last = msg.lastIndexOf('}')
    if (first >= 0 && last > first) {
      try {
        const obj = JSON.parse(msg.slice(first, last + 1))
        if (obj && typeof obj === 'object') return obj
      } catch {}
    }
    return null
  }

  const humanizeReason = (reason?: string) => {
    if (!reason) return ''
    const map: Record<string, string> = {
      not_interested: 'Не заинтересован',
      salary_too_low: 'Низкая зарплата',
      location_mismatch: 'Локация не подходит',
      skills_mismatch: 'Навыки не подходят',
      other: 'Другая причина',
    }
    return map[reason] || reason.replace(/_/g, ' ')
  }

  const isAiFeedback = (n: ApiNotification) => {
    const t = String(n.type || '').toUpperCase()
    const titleUpper = String(n.title || '').toUpperCase()
    const payload = parsePayload(n)
    return t === 'AI_FEEDBACK' || titleUpper === 'AI_FEEDBACK' || !!(payload && (payload.reason || payload.jobId || payload.feedback))
  }

  const readableTitle = (n: ApiNotification) => {
    if (isAiFeedback(n)) return 'Фидбэк от кандидата'
    return n.title || 'Уведомление'
  }

  const getNotificationHref = (n: ApiNotification): string | null => {
    const t = String(n.type || '').toUpperCase()
    const payload = parsePayload(n)
    if (t === 'AI_FEEDBACK' && payload?.jobId) return `/jobs/${payload.jobId}`
    if (payload?.actionUrl && typeof payload.actionUrl === 'string') return payload.actionUrl
    return null
  }

  useEffect(() => {
    // hydrate job titles for AI_FEEDBACK
    const withJob = notifications.filter(n => isAiFeedback(n) && n.data?.jobId && !n.jobTitle)
    if (withJob.length === 0) return
    let cancelled = false
    ;(async () => {
      const results = await Promise.all(withJob.map(async (n) => {
        try {
          const r = await fetch(`/api/jobs/${n.data.jobId}`)
          if (r.ok) {
            const j = await r.json()
            return { id: n.id, title: j?.title as string | undefined }
          }
        } catch {}
        return { id: n.id, title: undefined as string | undefined }
      }))
      if (cancelled) return
      const map = new Map(results.map(r => [r.id, r.title]))
      setNotifications(prev => prev.map(n => isAiFeedback(n) && n.data?.jobId ? { ...n, jobTitle: n.jobTitle ?? map.get(n.id) } : n))
    })()
    return () => { cancelled = true }
  }, [notifications])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка уведомлений...
              </h3>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Уведомления
              </h1>
            </div>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400">
              Центр уведомлений и обновлений
            </p>
            {unreadCount > 0 && (
              <Badge className="mt-2 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {unreadCount} непрочитанных
              </Badge>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Поиск уведомлений..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 overflow-x-auto">
                {(['all', 'unread', 'important'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filter === filterType
                        ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {filterType === 'all' && 'Все'}
                    {filterType === 'unread' && 'Непрочитанные'}
                    {filterType === 'important' && 'Важные'}
                  </button>
                ))}
              </div>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Прочитать все
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {error && (
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-4">
                <CardContent className="text-center text-red-500">{error}</CardContent>
              </Card>
            )}
            {filteredNotifications.length === 0 && !error ? (
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
                <CardContent className="text-center">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Нет уведомлений
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {filter === 'unread' ? 'Все уведомления прочитаны' : 'У вас пока нет уведомлений'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    onClick={() => {
                      const href = getNotificationHref(notification)
                      if (href) {
                        markAsRead(notification.id)
                        router.push(href)
                      }
                    }}
                    className={`bg-white dark:bg-black border-2 overflow-hidden rounded-2xl sm:rounded-3xl ${
                    notification.isRead 
                      ? 'border-gray-200 dark:border-gray-800' 
                      : 'border-gray-200 dark:border-gray-800'
                  } hover:shadow-lg transition-shadow ${getNotificationHref(notification) ? 'cursor-pointer hover:bg-gray-50/40 dark:hover:bg-white/5' : ''}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${(() => {
                          const kind = isAiFeedback(notification) ? 'AI_FEEDBACK' : String(notification.type).toUpperCase()
                          switch (kind) {
                            case 'JOB_MATCH':
                              return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                            case 'APPLICATION_STATUS':
                              return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            case 'MESSAGE':
                              return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                            case 'SYSTEM':
                              return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            case 'REMINDER':
                              return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                            case 'AI_FEEDBACK':
                              return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-300'
                            default:
                              return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }
                        })()}`}>
                          {(() => {
                            const kind = isAiFeedback(notification) ? 'AI_FEEDBACK' : String(notification.type).toUpperCase()
                            switch (kind) {
                              case 'JOB_MATCH':
                                return <Briefcase className="w-5 h-5" />
                              case 'APPLICATION_STATUS':
                                return <CheckCircle className="w-5 h-5" />
                              case 'MESSAGE':
                                return <MessageCircle className="w-5 h-5" />
                              case 'SYSTEM':
                                return <Info className="w-5 h-5" />
                              case 'REMINDER':
                                return <Calendar className="w-5 h-5" />
                              case 'AI_FEEDBACK':
                                return <MessageCircle className="w-5 h-5" />
                              default:
                                return <Bell className="w-5 h-5" />
                            }
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`text-base sm:text-lg font-semibold ${
                              notification.isRead 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {readableTitle(notification)}
                              {!notification.isRead && (
                                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full ml-2"></span>
                              )}
                            </h3>
                            
                            <div className="flex items-center gap-2">
                              {(notification as any).important && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                              {/* Удаление не реализовано на сервере */}
                            </div>
                          </div>
                          
                          {(() => {
                            const payload = parsePayload(notification)
                            if (isAiFeedback(notification) && payload) {
                              const reason = humanizeReason(payload.reason)
                              const note = typeof payload.note === 'string' ? payload.note.trim() : ''
                              return (
                                <div className={`text-gray-600 dark:text-gray-400 mb-3 ${notification.isRead ? '' : 'font-medium'}`}>
                                  <div className="mb-1">{reason ? `Причина: ${reason}` : 'Получен фидбэк'}</div>
                                  {note && (
                                    <div className="text-gray-500 dark:text-gray-400 italic break-anywhere">Комментарий: {note}</div>
                                  )}
                                  {payload.jobId && (
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-xs cursor-pointer max-w-[320px]" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); router.push(`/jobs/${String(payload.jobId)}`) }}>
                                        <Briefcase className="w-3 h-3 mr-1" />
                                        <span className="truncate" title={notification.jobTitle || String(payload.jobId)}>
                                          {notification.jobTitle || String(payload.jobId)}
                                        </span>
                                      </Badge>
                                      <Link
                                        href={`/jobs/${String(payload.jobId)}`}
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notification.id); router.push(`/jobs/${String(payload.jobId)}`) }}
                                        className="text-xs text-gray-900 hover:underline dark:text-white"
                                      >
                                        Открыть
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            return (
                              <p className={`text-gray-600 dark:text-gray-400 mb-3 ${notification.isRead ? '' : 'font-medium'} break-anywhere`}>
                                {notification.message}
                              </p>
                            )
                          })()}
                          
                          {notification.data && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {notification.data.jobTitle && (
                                <Badge variant="outline" className="text-xs">
                                  <Briefcase className="w-3 h-3 mr-1" />
                                  {notification.data.jobTitle}
                                </Badge>
                              )}
                              {notification.data.company && (
                                <Badge variant="outline" className="text-xs">
                                  <Building className="w-3 h-3 mr-1" />
                                  {notification.data.company}
                                </Badge>
                              )}
                              {notification.data.salary && (
                                <Badge variant="outline" className="text-xs">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  {notification.data.salary}
                                </Badge>
                              )}
                              {notification.data.location && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {notification.data.location}
                                </Badge>
                              )}
                              {notification.data.matchScore && (
                                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  {notification.data.matchScore}% совпадение
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {timeLabel(notification.createdAt)}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}
                                  className="text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Прочитать
                                </Button>
                              )}
                              {(() => { const href = getNotificationHref(notification); return href ? (
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); router.push(href) }}
                                  className="text-xs"
                                >
                                  Перейти
                                </Button>
                              ) : null })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}