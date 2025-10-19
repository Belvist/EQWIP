'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Eye, Edit, Trash2, Plus, TrendingUp, Building, FileText, BarChart3, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface InternshipPosting {
  id: string
  title: string
  specialty: string
  description: string
  studentCount: number
  startDate: string
  endDate: string
  location: string
  isActive: boolean
  createdAt: string
  applicationsCount: number
}

interface UniversityStats {
  totalPostings: number
  activePostings: number
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
}

export default function UniversityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [postings, setPostings] = useState<InternshipPosting[]>([])
  const [stats, setStats] = useState<UniversityStats>({
    totalPostings: 0,
    activePostings: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0
  })
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
    
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [postingsRes, statsRes] = await Promise.all([
        fetch('/api/university/postings'),
        fetch('/api/university/stats')
      ])
      
      if (!postingsRes.ok) {
        throw new Error('Ошибка загрузки публикаций')
      }
      
      const postingsData = await postingsRes.json()
      setPostings(postingsData.postings || [])
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const deletePosting = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту публикацию?')) return
    
    try {
      const response = await fetch(`/api/internships/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка удаления')
      }
      setPostings(prev => prev.filter(p => p.id !== id))
      // Refresh stats
      const statsRes = await fetch('/api/university/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
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
            <Button onClick={fetchData}>Попробовать снова</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Панель вуза</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Управляйте стажировками и отслеживайте заявки
            </p>
          </div>
          <Link href="/internships/create">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Создать стажировку
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего публикаций</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPostings}</p>
                </div>
                <FileText className="h-8 w-8" style={{ color: '#4f46e5' }} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Активные</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activePostings}</p>
                </div>
                <TrendingUp className="h-8 w-8" style={{ color: '#4f46e5' }} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего заявок</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Одобрено</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approvedApplications}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/internships/create">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Plus className="h-12 w-12 mx-auto mb-4" style={{ color: '#4f46e5' }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Создать стажировку</h3>
                <p className="text-gray-600 dark:text-gray-400">Добавить новую публикацию</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/university/postings">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: '#4f46e5' }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Мои публикации</h3>
                <p className="text-gray-600 dark:text-gray-400">Управление стажировками</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/university/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Профиль вуза</h3>
                <p className="text-gray-600 dark:text-gray-400">Настройки университета</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Postings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Последние публикации
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postings.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Публикаций пока нет
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Создайте первую публикацию стажировки для вашего университета
                </p>
                <Link href="/internships/create">
                  <Button>Создать стажировку</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {postings.slice(0, 5).map((posting) => (
                  <div key={posting.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{posting.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(posting.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {posting.applicationsCount} заявок
                        </span>
                        <Badge variant={posting.isActive ? 'default' : 'secondary'}>
                          {posting.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('Детали заявки: ' + posting.title)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePosting(posting.id)}
                        style={{ color: '#dc2626' }}
                        className="hover:opacity-80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {postings.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/university/postings">
                      <Button variant="outline">Показать все публикации</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}