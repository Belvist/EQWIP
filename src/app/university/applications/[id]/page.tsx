'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Building, ArrowLeft, CheckCircle, XCircle, Clock, Mail, Globe } from 'lucide-react'
import Link from 'next/link'

interface InternshipApplication {
  id: string
  status: string
  message: string
  createdAt: string
  employer: {
    id: string
    companyName: string
    website: string | null
    description: string | null
    industry: string | null
    size: string | null
    location: string | null
    user: {
      name: string
      email: string
    }
  }
  posting: {
    id: string
    title: string
    specialty: string
    startDate: string
    endDate: string
    location: string
    studentCount: number
    description: string
  }
}

export default function ApplicationDetails({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<InternshipApplication | null>(null)
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
    
    fetchApplication()
  }, [session, status, router, params.id])

  const fetchApplication = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/university/applications/${params.id}`)
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

  const updateApplicationStatus = async (newStatus: string) => {
    try {
      const response = await fetch('/api/internships/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: params.id,
          status: newStatus
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка обновления статуса')
      }
      
      setApplication(prev => prev ? { ...prev, status: newStatus } : null)
      alert(`Статус заявки изменен на: ${newStatus === 'APPROVED' ? 'Одобрено' : 'Отклонено'}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка обновления')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Ожидает</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Одобрено</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Отклонено</Badge>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Заявка не найдена'}
            </h1>
            <Link href="/university/applications">
              <Button>Вернуться к заявкам</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/university/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Заявка на стажировку
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {application.posting.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(application.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Информация о компании
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {application.employer.companyName}
                  </h3>
                  {application.employer.industry && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Отрасль: {application.employer.industry}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {application.employer.user.email}
                    </span>
                  </div>
                  
                  {application.employer.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <a 
                        href={application.employer.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {application.employer.website}
                      </a>
                    </div>
                  )}
                  
                  {application.employer.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {application.employer.location}
                      </span>
                    </div>
                  )}
                  
                  {application.employer.size && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Размер компании: {application.employer.size}
                      </span>
                    </div>
                  )}
                </div>
                
                {application.employer.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">О компании</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {application.employer.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internship Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Информация о стажировке
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {application.posting.title}
                  </h3>
                  <Badge variant="outline" className="mt-1">
                    {application.posting.specialty}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {application.posting.startDate ? new Date(application.posting.startDate).toLocaleDateString() : 'Не указано'} - {application.posting.endDate ? new Date(application.posting.endDate).toLocaleDateString() : 'Не указано'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {application.posting.location}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {application.posting.studentCount} мест
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Описание</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {application.posting.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Message */}
          {application.message && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Сообщение от компании</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    {application.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {application.status === 'PENDING' && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={() => updateApplicationStatus('APPROVED')}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Одобрить заявку
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateApplicationStatus('REJECTED')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Отклонить заявку
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Info */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-500">
                <p>Заявка подана: {new Date(application.createdAt).toLocaleString()}</p>
                <p>ID заявки: {application.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
