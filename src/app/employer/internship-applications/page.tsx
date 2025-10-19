'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Users, Building, Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import Link from 'next/link'

interface InternshipApplication {
  id: string
  status: string
  message: string
  createdAt: string
  posting: {
    id: string
    title: string
    specialty: string
    startDate: string
    endDate: string
    location: string
    studentCount: number
    university: {
      id: string
      name: string
      logo: string | null
      website: string | null
      description: string | null
      location: string | null
      establishedYear: number | null
      studentCount: number | null
      specialties: string | null
    }
  }
}

export default function InternshipApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<InternshipApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [error, setError] = useState<string | null>(null)
  const [acceptInternships, setAcceptInternships] = useState(false)

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
    
    fetchApplications()
    fetchEmployerSettings()
  }, [session, status, router])

  const fetchEmployerSettings = async () => {
    try {
      const response = await fetch('/api/employer/settings')
      if (response.ok) {
        const data = await response.json()
        setAcceptInternships(data.notifyOnUniversityPost || false)
      }
    } catch (err) {
      console.error('Error fetching employer settings:', err)
    }
  }

  const handleToggleAcceptance = async () => {
    try {
      const newValue = !acceptInternships
      const response = await fetch('/api/employer/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyOnUniversityPost: newValue })
      })
      
      if (response.ok) {
        setAcceptInternships(newValue)
        alert(newValue ? 'Теперь вы будете получать заявки от вузов' : 'Вы больше не будете получать заявки от вузов')
      } else {
        alert('Ошибка обновления настроек')
      }
    } catch (err) {
      console.error('Error updating settings:', err)
      alert('Ошибка обновления настроек')
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employer/internship-applications')
      if (!response.ok) {
        throw new Error('Ошибка загрузки заявок')
      }
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/api/internships/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          action
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка обновления статуса')
      }
      
      const data = await response.json()
      
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: data.data.status } : app
      ))
      
      const actionText = action === 'accept' ? 'принята' : 'отклонена'
      alert(`Заявка ${actionText}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка обновления')
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.posting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.posting.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.posting.university.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Ожидает рассмотрения</Badge>
      case 'ACCEPTED':
        return <Badge variant="default" className="flex items-center gap-1" style={{ backgroundColor: '#4f46e5', color: 'white' }}><CheckCircle className="w-3 h-3" />Принято</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="flex items-center gap-1" style={{ backgroundColor: '#dc2626', color: 'white' }}><XCircle className="w-3 h-3" />Отклонено</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
            <Button onClick={fetchApplications}>Попробовать снова</Button>
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
                Заявки от вузов
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Рассматривайте заявки от университетов на размещение стажеров в вашей компании
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="acceptInternships"
                  checked={acceptInternships}
                  onChange={handleToggleAcceptance}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="acceptInternships" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Принимаю стажеров
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Message when not accepting internships */}
        {!acceptInternships && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    Вы не принимаете стажеров
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Включите переключатель выше, чтобы начать получать заявки от университетов
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Поиск по названию стажировки, специальности или университету..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="ALL">Все статусы</option>
                  <option value="PENDING">Ожидает</option>
                  <option value="ACCEPTED">Принято</option>
                  <option value="REJECTED">Отклонено</option>
                </select>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#4f46e5' }}>{applications.length}</p>
                  <p className="text-sm text-gray-600">Всего заявок</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                    {applications.filter(a => a.status === 'PENDING').length}
                  </p>
                  <p className="text-sm text-gray-600">Ожидают</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#4f46e5' }}>
                    {applications.filter(a => a.status === 'ACCEPTED').length}
                  </p>
                  <p className="text-sm text-gray-600">Принято</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                    {applications.filter(a => a.status === 'REJECTED').length}
                  </p>
                  <p className="text-sm text-gray-600">Отклонено</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Building className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Заявки не найдены
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'Попробуйте изменить фильтры поиска'
                  : 'У вашей компании пока нет заявок на стажировки'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {application.posting.title}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Университет</h4>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {application.posting.university.name}
                            </p>
                            {application.posting.university.location && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Местоположение:</strong> {application.posting.university.location}
                              </p>
                            )}
                            {application.posting.university.establishedYear && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Год основания:</strong> {application.posting.university.establishedYear}
                              </p>
                            )}
                            {application.posting.university.studentCount && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Количество студентов:</strong> {application.posting.university.studentCount}
                              </p>
                            )}
                            {application.posting.university.website && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Сайт:</strong> 
                                <a href={application.posting.university.website} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }} className="hover:underline ml-1">
                                  {application.posting.university.website}
                                </a>
                              </p>
                            )}
                            {application.posting.university.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                <strong>Описание:</strong> {application.posting.university.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Стажировка</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {application.posting.startDate ? new Date(application.posting.startDate).toLocaleDateString() : 'Не указано'} - {application.posting.endDate ? new Date(application.posting.endDate).toLocaleDateString() : 'Не указано'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {application.posting.location}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {application.posting.studentCount} мест
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <Badge variant="outline">{application.posting.specialty}</Badge>
                      </div>
                      
                      {application.message && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Сообщение:</strong> {application.message}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Подана: {new Date(application.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Link href={`/employer/internship-applications/${application.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Подробнее
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('Детали заявки: ' + application.posting.title)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Стажировка
                      </Button>
                      
                      {application.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'accept')}
                            style={{ backgroundColor: '#4f46e5', color: 'white' }}
                            className="hover:bg-green-800 flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Принять
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'reject')}
                            style={{ backgroundColor: '#dc2626', color: 'white' }}
                            className="hover:bg-red-600 text-white flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Отклонить
                          </Button>
                        </>
                      )}
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
