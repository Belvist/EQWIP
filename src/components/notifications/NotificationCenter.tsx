'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, X, Check, ExternalLink, Mail, MessageSquare, Briefcase, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationCenter() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetchNotifications()
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true&limit=10')
      if (response.ok) {
        const data = await response.json()
        const normalized: Notification[] = Array.isArray(data)
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
              }
            })
          : []
        setNotifications(normalized)
        setUnreadCount(normalized.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          markAsRead: true
        }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомления как прочитанные",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (String(type).toUpperCase()) {
      case 'NEW_JOB':
        return <Briefcase className="w-4 h-4" />
      case 'APPLICATION_STATUS':
        return <User className="w-4 h-4" />
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4" />
      case 'INTERVIEW_INVITE':
        return <Mail className="w-4 h-4" />
      case 'AI_FEEDBACK':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (String(type).toUpperCase()) {
      case 'NEW_JOB':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'APPLICATION_STATUS':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'MESSAGE':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'INTERVIEW_INVITE':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'AI_FEEDBACK':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
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

  const parsePayload = (n: Notification): any | null => {
    if ((n as any).data && typeof (n as any).data === 'object') return (n as any).data
    const msg = (n && typeof n.message === 'string') ? n.message.trim() : ''
    if (msg.startsWith('{') && msg.endsWith('}')) {
      try {
        const obj = JSON.parse(msg)
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

  const readableTitle = (n: Notification) => {
    const t = String(n.type || '').toUpperCase()
    if (t === 'AI_FEEDBACK') return 'Фидбэк от кандидата'
    return n.title || 'Уведомление'
  }

  const getNotificationHref = (n: Notification): string | null => {
    const t = String(n.type || '').toUpperCase()
    const payload = parsePayload(n)
    if (t === 'AI_FEEDBACK' && payload?.jobId) return `/jobs/${payload.jobId}`
    if (payload?.actionUrl && typeof payload.actionUrl === 'string') return payload.actionUrl
    return null
  }

  const isAiFeedback = (n: Notification) => {
    const titleUpper = String(n.title || '').toUpperCase()
    const t = String(n.type || '').toUpperCase()
    const payload = parsePayload(n)
    return t === 'AI_FEEDBACK' || titleUpper === 'AI_FEEDBACK' || !!(payload && (payload.reason || payload.jobId || payload.feedback))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={isLoading}
              className="text-xs"
            >
              Отметить все как прочитанные
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => {
                  const href = getNotificationHref(notification)
                  if (href) {
                    markAsRead([notification.id])
                    router.push(href)
                  }
                }}
                className={`p-0 focus:bg-gray-50 ${
                  !notification.isRead ? 'bg-gray-50' : ''
                } ${getNotificationHref(notification) ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start gap-3 p-3 w-full">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                          {isAiFeedback(notification) ? 'Фидбэк от кандидата' : readableTitle(notification)}
                        </p>
                        {(() => {
                          const payload = parsePayload(notification)
                          if (isAiFeedback(notification) && payload) {
                            const reason = humanizeReason(payload.reason)
                            const note = typeof payload.note === 'string' ? payload.note.trim() : ''
                            return (
                              <div className={`text-xs ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'} mt-1 space-y-1`}>
                                <div>{reason ? `Причина: ${reason}` : 'Получен фидбэк'}</div>
                                {note && <div className="italic">Комментарий: {note}</div>}
                                {payload.jobId && (
                                  <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded px-2 py-0.5">
                                    <Briefcase className="w-3 h-3" />
                                    Вакансия: {String(payload.jobId)}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          return (
                            <p className={`text-xs ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'} line-clamp-2 mt-1`}>
                              {notification.message}
                            </p>
                          )
                        })()}
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); markAsRead([notification.id]) }}
                            disabled={isLoading}
                            className="w-6 h-6 p-0"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        {getNotificationHref(notification) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); const href = getNotificationHref(notification); if (href) { markAsRead([notification.id]); router.push(href) } }}
                            className="w-6 h-6 p-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Нет новых уведомлений</p>
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/notifications')}
          className="text-center justify-center text-sm text-gray-600 cursor-pointer"
        >
          Все уведомления
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}