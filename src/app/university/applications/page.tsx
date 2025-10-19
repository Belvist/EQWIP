'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function UniversityApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if ((session?.user as any)?.role !== 'UNIVERSITY') {
      router.push('/')
      return
    }
    
    fetchNotifications()
    
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [session, status, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let notifications = []
      
      // Try multiple API endpoints in order of preference
      const apiEndpoints = [
        '/api/university/notifications',
        '/api/notifications/university', 
        '/api/notifications'
      ]
      
      let lastError = null
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying API endpoint: ${endpoint}`)
          const response = await fetch(endpoint)
          
          if (response.ok) {
            const data = await response.json()
            notifications = data.notifications || data || []
            
            // If using general notifications API, filter for university-relevant notifications
            if (endpoint === '/api/notifications') {
              notifications = notifications.filter((n: any) => 
                n.type === 'APPLICATION_STATUS' || 
                n.title?.toLowerCase().includes('заявка') ||
                n.title?.toLowerCase().includes('стажер')
              )
            }
            
            console.log(`Successfully loaded ${notifications.length} notifications from ${endpoint}`)
            break
          } else {
            console.log(`API ${endpoint} returned ${response.status}`)
            lastError = new Error(`API ${endpoint} returned ${response.status}`)
          }
        } catch (apiError) {
          console.warn(`API ${endpoint} failed:`, apiError)
          lastError = apiError
        }
      }
      
      if (notifications.length === 0 && lastError) {
        throw lastError
      }
      
      setNotifications(notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ошибка</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchNotifications}>Попробовать снова</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ответы компаний ({notifications.length})
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ответы работодателей на ваши заявки о размещении стажеров
              </p>
            </div>
            <Button 
              onClick={fetchNotifications} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </div>



        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Mail className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Уведомлений нет
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Пока нет ответов от работодателей на ваши заявки
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {notifications.map((notification) => (
              <Card key={notification.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                            {!notification.isRead && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#4f46e5' }}>
                                Новое
                              </span>
                            )}
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
