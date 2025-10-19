'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Eye, Edit, Trash2, Plus, FileText } from 'lucide-react'
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

export default function UniversityPostingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [postings, setPostings] = useState<InternshipPosting[]>([])
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
    
    fetchPostings()
  }, [session, status, router])

  const fetchPostings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/university/postings')
      if (!response.ok) {
        throw new Error('Ошибка загрузки публикаций')
      }
      const data = await response.json()
      setPostings(data.postings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const deletePosting = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту публикацию? Все связанные заявки будут также удалены.')) return
    
    try {
      const response = await fetch(`/api/internships/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка удаления')
      }
      setPostings(prev => prev.filter(p => p.id !== id))
      alert('Стажировка успешно удалена')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  const togglePostingStatus = async (id: string, isActive: boolean) => {
    if (!confirm(`Вы уверены, что хотите ${isActive ? 'деактивировать' : 'активировать'} эту стажировку?`)) return
    
    try {
      const response = await fetch(`/api/internships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка обновления статуса')
      }
      setPostings(prev => prev.map(p => p.id === id ? { ...p, isActive: !isActive } : p))
      alert(`Стажировка ${!isActive ? 'активирована' : 'деактивирована'}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка обновления')
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
            <Button onClick={fetchPostings}>Попробовать снова</Button>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Мои заявки</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Управляйте вашими заявками на размещение стажеров
            </p>
          </div>
          <Link href="/internships/create">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Подать заявку
            </Button>
          </Link>
        </div>

        {postings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <FileText className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Публикаций пока нет
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Создайте первую публикацию стажировки для вашего университета
              </p>
              <Link href="/internships/create">
                <Button>Создать стажировку</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {postings.map((posting) => (
              <Card key={posting.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                        {posting.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(posting.startDate).toLocaleDateString()} - {new Date(posting.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {posting.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {posting.studentCount} мест
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={posting.isActive ? 'default' : 'secondary'}>
                          {posting.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                        <Badge variant="outline">
                          {posting.applicationsCount} заявок
                        </Badge>
                        <Badge variant="outline">
                          {posting.specialty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePostingStatus(posting.id, posting.isActive)}
                      >
                        {posting.isActive ? 'Деактивировать' : 'Активировать'}
                      </Button>
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
                        onClick={() => router.push(`/university/postings/${posting.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
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
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {posting.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
