'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Download,
  Eye,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Application {
  id: string
  status: string
  coverLetter?: string
  createdAt: string
  resumeId?: string
  candidate: {
    id: string
    user: {
      name: string
      email: string
      avatar?: string
    }
    title?: string
    bio?: string
    location?: string
    experience?: number
    skills: Array<{
      id: string
      level: number
      skill: {
        name: string
        category: string
      }
    }>
    workExperience: Array<{
      title: string
      company: string
      description?: string
      startDate: string
      endDate?: string
      isCurrent: boolean
    }>
    education: Array<{
      institution: string
      degree?: string
      field?: string
      startDate: string
      endDate?: string
      isCurrent: boolean
    }>
  }
  job: {
    id: string
    title: string
    salaryMin?: number
    salaryMax?: number
    currency: string
    experienceLevel: string
    employmentType: string
    workFormat: string
    location?: string
  }
  messages: Array<{
    id: string
    content: string
    createdAt: string
    sender: {
      name: string
      avatar?: string
    }
  }>
}

export default function EmployerApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'EMPLOYER') {
        router.push('/dashboard')
        return
      }
      fetchApplications()
    }
  }, [status, router, session, filterStatus])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      // Прочитаем jobId из адресной строки (переход из управления вакансией)
      try {
        const url = new URL(window.location.href)
        const jid = url.searchParams.get('jobId')
        if (jid) params.append('jobId', jid)
      } catch {}
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      
      const response = await fetch(`/api/applications?${params}`)
      if (response.ok) {
        const data = await response.json()
        // API возвращает { applications: [...] }
        setApplications(data.applications || [])
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить отклики",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отклики",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openChat = () => {
    if (!selectedApplication) return
    router.push(`/chat?applicationId=${selectedApplication.id}`)
  }

  const downloadResume = async () => {
    const rid = selectedApplication?.resumeId
    if (!rid) {
      toast({ title: 'Резюме недоступно', description: 'Кандидат не прикрепил резюме', variant: 'destructive' })
      return
    }
    try {
      const url = `/api/resumes/${rid}/pdf`
      window.open(url, '_blank')
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось скачать резюме', variant: 'destructive' })
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string, templateText?: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus
        }),
      })

      if (response.ok) {
        // При успешном обновлении статуса — отправим шаблонное сообщение в чат
        if (templateText && templateText.trim()) {
          try {
            await fetch(`/api/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId, text: templateText.trim() })
            })
          } catch {}
        }
        // Если отказ — запланируем авто‑удаление чата через 30 дней (метка в сообщении)
        if (newStatus === 'REJECTED') {
          try {
            await fetch(`/api/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId, text: '[system] auto-archive-after-30d' })
            })
          } catch {}
        }
        await fetchApplications()
        toast({
          title: "Успешно",
          description: "Статус отклика обновлен",
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить статус",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      case 'REVIEWED':
        return 'bg-gray-100 text-gray-800'
      case 'SHORTLISTED':
        return 'bg-gray-100 text-gray-800'
      case 'REJECTED':
        return 'bg-gray-100 text-gray-800'
      case 'HIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'REVIEWED':
        return <Eye className="w-4 h-4" />
      case 'SHORTLISTED':
        return <CheckCircle className="w-4 h-4" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />
      case 'HIRED':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'На рассмотрении'
      case 'REVIEWED':
        return 'Просмотрено'
      case 'SHORTLISTED':
        return 'В шорт-листе'
      case 'REJECTED':
        return 'Отклонено'
      case 'HIRED':
        return 'Принято'
      default:
        return status
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Управление откликами
            </h1>
            <p className="text-gray-600">
              Просматривайте и управляйте откликами на ваши вакансии
            </p>
          </div>
        </div>

        {/* Filters */}
          <Card className="mb-6 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все отклики</SelectItem>
                  <SelectItem value="PENDING">На рассмотрении</SelectItem>
                  <SelectItem value="REVIEWED">Просмотрено</SelectItem>
                  <SelectItem value="SHORTLISTED">В шорт-листе</SelectItem>
                  <SelectItem value="REJECTED">Отклонено</SelectItem>
                  <SelectItem value="HIRED">Принято</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-4">
            {applications.length > 0 ? (
              applications.map((application) => (
                <Card 
                  key={application.id} 
                  className={`bg-white cursor-pointer transition-all hover:shadow-md ${
                    selectedApplication?.id === application.id ? 'ring-2 ring-gray-400' : ''
                  }`}
                  onClick={() => setSelectedApplication(application)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={application.candidate.user.avatar ? (application.candidate.user.avatar.startsWith('/api/') ? application.candidate.user.avatar : `/api/profile/avatar?user=${encodeURIComponent(application.candidate.userId as any || '')}`) : undefined} />
                          <AvatarFallback>
                            {application.candidate.user.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {application.candidate.user.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {application.candidate.title || 'Должность не указана'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {application.candidate.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(application.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {getStatusText(application.status)}
                          </div>
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Вакансия</p>
                        <p className="text-sm text-gray-600">{application.job.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Дата отклика</p>
                        <p className="text-sm text-gray-600">
                          {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>

                    {application.coverLetter && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 mb-1">Сопроводительное письмо</p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {application.coverLetter}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {application.candidate.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs dark:bg-black dark:text-gray-200 dark:border-gray-700">
                            {skill.skill.name}
                          </Badge>
                        ))}
                        {application.candidate.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs dark:bg-black dark:text-gray-200 dark:border-gray-700">
                            +{application.candidate.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {application.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100/40 dark:hover:bg-white/5"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateApplicationStatus(application.id, 'REVIEWED')
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Просмотрено
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100/40 dark:hover:bg-white/5"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateApplicationStatus(application.id, 'SHORTLISTED')
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              В шорт-лист
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const text = `**Принят**\nЗдравствуйте! Ваша заявка одобрена. Готовы обсудить дальнейшие шаги.`
                                updateApplicationStatus(application.id, 'HIRED', text)
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Принять
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100/40 dark:hover:bg-white/5"
                              onClick={(e) => {
                                e.stopPropagation()
                                const text = `**Отказ**\nЗдравствуйте! Спасибо за интерес к вакансии, но мы приняли другое решение. Удачи в поиске!`
                                updateApplicationStatus(application.id, 'REJECTED', text)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Отклонить
                            </Button>
                          </>
                        )}
                        {(application.status === 'SHORTLISTED' || application.status === 'REVIEWED') && (
                          <>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const text = `**Принят**\nЗдравствуйте! Ваша заявка одобрена. Готовы обсудить дальнейшие шаги.`
                                updateApplicationStatus(application.id, 'HIRED', text)
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Принять
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100/40 dark:hover:bg-white/5"
                              onClick={(e) => {
                                e.stopPropagation()
                                const text = `**Отказ**\nЗдравствуйте! Спасибо за интерес к вакансии, но мы приняли другое решение. Удачи в поиске!`
                                updateApplicationStatus(application.id, 'REJECTED', text)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Отклонить
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white">
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет откликов
                  </h3>
                  <p className="text-gray-600">
                    {filterStatus === 'all' 
                      ? 'На ваши вакансии еще нет откликов'
                      : `Нет откликов со статусом "${getStatusText(filterStatus)}"`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Application Details */}
          <div className="lg:col-span-1">
            {selectedApplication ? (
              <Card className="bg-white sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Детали отклика
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Candidate Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Информация о кандидате</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedApplication.candidate.user.avatar ? (selectedApplication.candidate.user.avatar.startsWith('/api/') ? selectedApplication.candidate.user.avatar : `/api/profile/avatar?user=${encodeURIComponent(selectedApplication.candidate.userId as any || '')}`) : undefined} />
                          <AvatarFallback>
                            {selectedApplication.candidate.user.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.candidate.user.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedApplication.candidate.user.email}
                          </p>
                        </div>
                      </div>
                      
                      {selectedApplication.candidate.title && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Должность</p>
                          <p className="text-sm text-gray-600">{selectedApplication.candidate.title}</p>
                        </div>
                      )}
                      
                      {selectedApplication.candidate.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-600">{selectedApplication.candidate.location}</p>
                        </div>
                      )}
                      
                      {selectedApplication.candidate.experience && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Опыт работы</p>
                          <p className="text-sm text-gray-600">{selectedApplication.candidate.experience} лет</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {selectedApplication.coverLetter && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Сопроводительное письмо</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedApplication.coverLetter}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div>
                      <h4 className="font-medium text-gray-900 mb-2">Навыки</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.candidate.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill.skill.name} ({skill.level}/5)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  {selectedApplication.candidate.workExperience.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Опыт работы</h4>
                      <div className="space-y-2">
                        {selectedApplication.candidate.workExperience.slice(0, 2).map((exp, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium text-gray-900">{exp.title}</p>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-gray-500 text-xs">
                              {new Date(exp.startDate).toLocaleDateString('ru-RU')} - {
                                exp.isCurrent ? 'Настоящее время' : 
                                exp.endDate ? new Date(exp.endDate).toLocaleDateString('ru-RU') : ''
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="inverted"
                      className="flex-1"
                      onClick={openChat}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Написать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100/40 dark:hover:bg-white/5"
                      onClick={downloadResume}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Резюме
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardContent className="text-center py-12">
                  <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Выберите отклик
                  </h3>
                  <p className="text-slate-600">
                    Нажмите на отклик, чтобы посмотреть детали
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}