'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Building, Search, Filter } from 'lucide-react'
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
  university: {
    id: string
    name: string
    logo: string | null
  }
}

export default function EmployerInternshipsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [internships, setInternships] = useState<InternshipPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if ((session?.user as any)?.role !== 'EMPLOYER') {
      router.push('/')
      return
    }
    
    fetchInternships()
  }, [session, status, router])

  const fetchInternships = async (query?: string) => {
    try {
      setLoading(true)
      const url = query ? `/api/internships?q=${encodeURIComponent(query)}` : '/api/internships'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Ошибка загрузки стажировок')
      }
      const data = await response.json()
      setInternships(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInternships(searchQuery)
  }

  const applyToInternship = async (internshipId: string) => {
    try {
      const response = await fetch(`/api/internships/${internshipId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Заинтересованы в сотрудничестве по данной стажировке'
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка подачи заявки')
      }
      
      alert('Заявка успешно подана!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка подачи заявки')
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
            <Button onClick={() => fetchInternships()}>Попробовать снова</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Поиск стажеров
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Найдите подходящих стажеров из университетов для вашей компании
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Поиск по названию, специальности или описанию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Найти
                </Button>
              </form>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{internships.length}</p>
                  <p className="text-sm text-gray-600">Найдено стажировок</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {internships.filter(i => i.isActive).length}
                  </p>
                  <p className="text-sm text-gray-600">Активных</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {internships.reduce((sum, i) => sum + i.studentCount, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Всего мест</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {new Set(internships.map(i => i.university.id)).size}
                  </p>
                  <p className="text-sm text-gray-600">Университетов</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {internships.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Building className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Стажировки не найдены
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Попробуйте изменить поисковый запрос или проверьте позже
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {internships.map((internship) => (
              <Card key={internship.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                        {internship.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {internship.university.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {internship.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {internship.studentCount} мест
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={internship.isActive ? 'default' : 'secondary'}>
                          {internship.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                        <Badge variant="outline">
                          {internship.specialty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/internships/${internship.id}`)}
                      >
                        Подробнее
                      </Button>
                      {internship.isActive && (
                        <Button
                          size="sm"
                          onClick={() => applyToInternship(internship.id)}
                        >
                          Подать заявку
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {internship.description}
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
