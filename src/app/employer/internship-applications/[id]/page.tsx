'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Building, ArrowLeft, CheckCircle, XCircle, Clock, Globe, GraduationCap, Users2, Calendar as CalendarIcon } from 'lucide-react'
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

export default function InternshipApplicationDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [application, setApplication] = useState<InternshipApplication | null>(null)
  const [loading, setLoading] = useState(true)
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
    
    if (params.id) {
      fetchApplication(params.id as string)
    }
  }, [session, status, router, params.id])

  const fetchApplication = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/employer/internship-applications/${id}`)
      if (!response.ok) {
        throw new Error('Ошибка загрузки заявки')
      }
      const data = await response.json()
      setApplication(data.application)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (action: 'accept' | 'reject') => {
    if (!application) return
    
    try {
      const response = await fetch('/api/internships/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          action
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка обновления статуса')
      }
      
      const data = await response.json()
      setApplication(prev => prev ? { ...prev, status: data.data.status } : null)
      
      const actionText = action === 'accept' ? 'принята' : 'отклонена'
      alert(`Заявка ${actionText}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка обновления')
    }
  }

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
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ошибка</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Заявка не найдена'}</p>
            <Link href="/employer/internship-applications">
              <Button>Вернуться к списку</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/employer/internship-applications">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Назад к списку
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {application.posting.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {getStatusBadge(application.status)}
                <span className="text-sm text-gray-500">
                  Подана: {new Date(application.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* University Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Информация об университете
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {application.posting.university.logo && (
                    <img 
                      src={application.posting.university.logo} 
                      alt={application.posting.university.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {application.posting.university.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.posting.university.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{application.posting.university.location}</span>
                        </div>
                      )}
                      
                      {application.posting.university.establishedYear && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Основан в {application.posting.university.establishedYear} году</span>
                        </div>
                      )}
                      
                      {application.posting.university.studentCount && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users2 className="w-4 h-4" />
                          <span>{application.posting.university.studentCount.toLocaleString()} студентов</span>
                        </div>
                      )}
                      
                      {application.posting.university.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={application.posting.university.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#4f46e5' }}
                            className="hover:underline"
                          >
                            {application.posting.university.website}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {application.posting.university.description && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Описание</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {application.posting.university.description}
                        </p>
                      </div>
                    )}
                    
                    {application.posting.university.specialties && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Специальности</h4>
                        <div className="flex flex-wrap gap-2">
                          {JSON.parse(application.posting.university.specialties).map((specialty: string, index: number) => (
                            <Badge key={index} variant="outline">{specialty}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internship Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Детали стажировки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Специальность</h4>
                    <Badge variant="outline" className="text-sm">{application.posting.specialty}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Количество мест</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{application.posting.studentCount} мест</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Период</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {application.posting.startDate ? new Date(application.posting.startDate).toLocaleDateString() : 'Не указано'} - {application.posting.endDate ? new Date(application.posting.endDate).toLocaleDateString() : 'Не указано'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Местоположение</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{application.posting.location || 'Не указано'}</span>
                    </div>
                  </div>
                </div>
                
                {application.message && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Сообщение от университета</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {application.message}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => updateApplicationStatus('accept')}
                      style={{ backgroundColor: '#4f46e5', color: 'white' }}
                      className="w-full hover:bg-green-800 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Принять заявку
                    </Button>
                    <Button
                      onClick={() => updateApplicationStatus('reject')}
                      style={{ backgroundColor: '#dc2626', color: 'white' }}
                      className="w-full hover:bg-red-600 text-white flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Отклонить заявку
                    </Button>
                  </>
                )}
                
                {application.status === 'ACCEPTED' && (
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#4f46e5' }} />
                    <p className="text-sm font-medium" style={{ color: '#4f46e5' }}>
                      Заявка принята
                    </p>
                  </div>
                )}
                
                {application.status === 'REJECTED' && (
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#fef2f2' }}>
                    <XCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#dc2626' }} />
                    <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
                      Заявка отклонена
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Краткая информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Статус:</span>
                  {getStatusBadge(application.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Подана:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Университет:</span>
                  <span className="text-sm text-gray-900 dark:text-white text-right">
                    {application.posting.university.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Специальность:</span>
                  <span className="text-sm text-gray-900 dark:text-white text-right">
                    {application.posting.specialty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Мест:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {application.posting.studentCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}