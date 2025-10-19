'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, Users, Calendar, MapPin, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface UniversityRequest {
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
      location?: string
      establishedYear?: number
      studentCount?: number
      description?: string
      website?: string
    }
  }
}

export default function UniversityRequestsWidget() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<UniversityRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchRequests()
    }
  }, [session])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employer/internship-applications')
      if (!response.ok) {
        throw new Error('Ошибка загрузки заявок')
      }
      const data = await response.json()
      setRequests(data.applications || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Ожидает</Badge>
      case 'ACCEPTED':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><CheckCircle className="w-3 h-3" />Принято</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Отклонено</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Заявки от вузов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Заявки от вузов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="mb-2" style={{ color: '#dc2626' }}>{error}</p>
            <Button onClick={fetchRequests} variant="outline" size="sm">
              Попробовать снова
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Заявки от вузов
          </CardTitle>
          <Link href="/employer/internship-applications">
            <Button variant="outline" size="sm">
              Все заявки
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Нет заявок от вузов
            </h3>
            <p className="text-gray-600 mb-4">
              Университеты пока не подали заявки на размещение стажеров
            </p>
            <Link href="/employer/internship-applications">
              <Button variant="outline">
                Настроить уведомления
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.slice(0, 3).map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {request.posting.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {request.posting.university.name}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {request.posting.studentCount} мест
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {request.posting.startDate ? new Date(request.posting.startDate).toLocaleDateString() : 'Не указано'}
                  </div>
                  {request.posting.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {request.posting.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {request.posting.specialty}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <Link href={`/employer/internship-applications/${request.id}`}>
                    <Button variant="outline" size="sm">
                      Подробнее
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {requests.length > 3 && (
              <div className="text-center pt-4 border-t">
                <Link href="/employer/internship-applications">
                  <Button variant="outline" size="sm">
                    Показать все ({requests.length})
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
