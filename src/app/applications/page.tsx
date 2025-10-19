'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Briefcase, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Eye,
  MessageCircle,
  Star,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
  Target,
  Users,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/contexts/UserContext'

import Footer from '@/components/Footer'

interface Application {
  id: number
  jobId: number
  jobTitle: string
  company: string
  companyLogo: string
  location: string
  salary: string
  type: string
  appliedAt: string
  status: 'pending' | 'viewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired'
  lastUpdate: string
  matchScore: number
  resumeUsed: string
  coverLetter: string
  notes?: string
  timeline: Array<{
    date: string
    action: string
    description: string
    status: string
  }>
  companyContacts?: {
    name: string
    position: string
    email: string
    phone?: string
  }
}

export default function ApplicationsPage() {
  const { userRole, isLoggedIn } = useUser()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'viewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'match'>('date')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true)
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockApplications: Application[] = [
          {
            id: 1,
            jobId: 1,
            jobTitle: 'Senior React Developer',
            company: 'TechCorp',
            companyLogo: 'T',
            location: 'Moscow, Hybrid',
            salary: '$120k - $180k',
            type: 'Full-time',
            appliedAt: '2024-03-15',
            lastUpdate: '2024-03-18',
            status: 'interview',
            matchScore: 95,
            resumeUsed: 'Senior Full Stack Developer',
            coverLetter: 'Опытный разработчик с экспертизой в React и Node.js...',
            timeline: [
              { date: '2024-03-15', action: 'Applied', description: 'Отклик отправлен', status: 'completed' },
              { date: '2024-03-16', action: 'Viewed', description: 'Резюме просмотрено', status: 'completed' },
              { date: '2024-03-18', action: 'Interview', description: 'Приглашение на собеседование', status: 'pending' }
            ],
            companyContacts: {
              name: 'Анна Петрова',
              position: 'HR Manager',
              email: 'anna.petrova@techcorp.com',
              phone: '+7 (495) 123-45-67'
            }
          },
          {
            id: 2,
            jobId: 2,
            jobTitle: 'Python ML Engineer',
            company: 'DataTech',
            companyLogo: 'D',
            location: 'Saint Petersburg',
            salary: '₽250k - ₽400k',
            type: 'Full-time',
            appliedAt: '2024-03-12',
            lastUpdate: '2024-03-14',
            status: 'shortlisted',
            matchScore: 88,
            resumeUsed: 'Python ML Engineer',
            coverLetter: 'Data Scientist с опытом в машинном обучении...',
            timeline: [
              { date: '2024-03-12', action: 'Applied', description: 'Отклик отправлен', status: 'completed' },
              { date: '2024-03-13', action: 'Viewed', description: 'Резюме просмотрено', status: 'completed' },
              { date: '2024-03-14', action: 'Shortlisted', description: 'Добавлен в шорт-лист', status: 'completed' }
            ],
            companyContacts: {
              name: 'Михаил Соколов',
              position: 'Tech Lead',
              email: 'm.sokolov@datatech.com'
            }
          },
          {
            id: 3,
            jobId: 3,
            jobTitle: 'DevOps Engineer',
            company: 'CloudSys',
            companyLogo: 'C',
            location: 'Kazan, Russia',
            salary: '€80k - €120k',
            type: 'Full-time',
            appliedAt: '2024-03-10',
            lastUpdate: '2024-03-11',
            status: 'viewed',
            matchScore: 92,
            resumeUsed: 'DevOps Engineer',
            coverLetter: 'DevOps инженер с опытом в AWS и Kubernetes...',
            timeline: [
              { date: '2024-03-10', action: 'Applied', description: 'Отклик отправлен', status: 'completed' },
              { date: '2024-03-11', action: 'Viewed', description: 'Резюме просмотрено', status: 'completed' }
            ]
          },
          {
            id: 4,
            jobId: 4,
            jobTitle: 'Frontend Developer',
            company: 'WebStudio',
            companyLogo: 'W',
            location: 'Moscow',
            salary: '₽150k - ₽220k',
            type: 'Full-time',
            appliedAt: '2024-03-08',
            lastUpdate: '2024-03-09',
            status: 'rejected',
            matchScore: 75,
            resumeUsed: 'Frontend Developer',
            coverLetter: 'Frontend разработчик с опытом в Vue.js...',
            timeline: [
              { date: '2024-03-08', action: 'Applied', description: 'Отклик отправлен', status: 'completed' },
              { date: '2024-03-09', action: 'Rejected', description: 'Отклонено', status: 'completed' }
            ],
            notes: 'К сожалению, не соответствует нашим текущим требованиям'
          },
          {
            id: 5,
            jobId: 5,
            jobTitle: 'Full Stack Developer',
            company: 'StartupHub',
            companyLogo: 'S',
            location: 'Remote, Global',
            salary: '$90k - $130k',
            type: 'Full-time',
            appliedAt: '2024-03-05',
            lastUpdate: '2024-03-07',
            status: 'pending',
            matchScore: 82,
            resumeUsed: 'Senior Full Stack Developer',
            coverLetter: 'Full Stack разработчик для динамичного стартапа...',
            timeline: [
              { date: '2024-03-05', action: 'Applied', description: 'Отклик отправлен', status: 'completed' }
            ]
          }
        ]
        
        setApplications(mockApplications)
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchApplications()
  }, [])

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'viewed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'interview':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'hired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'viewed':
        return <Eye className="w-4 h-4" />
      case 'shortlisted':
        return <Star className="w-4 h-4" />
      case 'interview':
        return <Users className="w-4 h-4" />
      case 'hired':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <X className="w-4 h-4" />
      default:
        return <Briefcase className="w-4 h-4" />
    }
  }

  const getStatusText = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return 'Ожидает'
      case 'viewed':
        return 'Просмотрено'
      case 'shortlisted':
        return 'Шорт-лист'
      case 'interview':
        return 'Собеседование'
      case 'hired':
        return 'Принят'
      case 'rejected':
        return 'Отклонено'
      default:
        return status
    }
  }

  const filteredApplications = applications.filter(app => 
    selectedStatus === 'all' || app.status === selectedStatus
  )

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      case 'status':
        return a.status.localeCompare(b.status)
      case 'match':
        return b.matchScore - a.matchScore
      default:
        return 0
    }
  })

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    viewed: applications.filter(a => a.status === 'viewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interview: applications.filter(a => a.status === 'interview').length,
    hired: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    responseRate: applications.length > 0 ? 
      ((applications.filter(a => a.status !== 'pending').length / applications.length) * 100).toFixed(1) : '0'
  }

  if (!isLoggedIn || userRole !== 'jobseeker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <Briefcase className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Отклики
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как соискатель, чтобы отслеживать статус ваших откликов
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/auth/signin'}
          >
            Войти как соискатель
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка откликов...
              </h3>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      {/* Header */}
      <section className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Отклики
                </h1>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                История ваших откликов на вакансии
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Экспорт
              </Button>
              <Button variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Обновить
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Всего</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {stats.pending}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ожидает</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                  {stats.viewed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Просмотрено</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {stats.shortlisted}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Шорт-лист</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stats.interview}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Собеседования</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {stats.hired}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Приняты</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.responseRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ответ</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'viewed', 'shortlisted', 'interview', 'hired', 'rejected'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className="rounded-2xl"
                  >
                    {status === 'all' && 'Все'}
                    {status === 'pending' && 'Ожидает'}
                    {status === 'viewed' && 'Просмотрено'}
                    {status === 'shortlisted' && 'Шорт-лист'}
                    {status === 'interview' && 'Собеседование'}
                    {status === 'hired' && 'Приняты'}
                    {status === 'rejected' && 'Отклонено'}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              >
                <option value="date">По дате</option>
                <option value="status">По статусу</option>
                <option value="match">По совпадению</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {sortedApplications.length === 0 ? (
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-12">
              <CardContent className="text-center">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Откликов не найдено
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {selectedStatus === 'all' 
                    ? 'У вас еще нет откликов. Начните поиск вакансий!' 
                    : 'Нет откликов с выбранным статусом.'
                  }
                </p>
                <Button onClick={() => window.location.href = '/jobs'}>
                  Найти вакансии
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedApplications.map((application) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link href={`/jobs/${application.jobId}`}>
                    <div className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {application.companyLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={application.companyLogo.startsWith('/api/') ? application.companyLogo : `/api/profile/company-logo?f=${encodeURIComponent(application.companyLogo)}`} alt={application.company} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                                {application.company?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {application.jobTitle}
                              </h3>
                              <Badge className={getStatusColor(application.status)}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1">{getStatusText(application.status)}</span>
                              </Badge>
                              {application.matchScore >= 90 && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  <Target className="w-3 h-3 mr-1" />
                                  {application.matchScore}%
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Building className="w-4 h-4" />
                              <span>{application.company}</span>
                              <span>•</span>
                              <MapPin className="w-4 h-4" />
                              <span>{application.location}</span>
                              <span>•</span>
                              <DollarSign className="w-4 h-4" />
                              <span>{application.salary}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Хронология отклика:
                        </h4>
                        <div className="space-y-2">
                          {application.timeline.map((event, index) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                event.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {event.action}
                                  </span>
                                  <span className="text-gray-500">
                                    {new Date(event.date).toLocaleDateString('ru-RU')}
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {event.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Резюме:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{application.resumeUsed}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Сопроводительное:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {application.coverLetter ? 'Отправлено' : 'Не отправлено'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Отклик отправлен:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(application.appliedAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Последнее обновление:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(application.lastUpdate).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {application.notes && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                          <p className="text-sm text-red-800 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            {application.notes}
                          </p>
                        </div>
                      )}

                      {/* Contacts */}
                      {application.companyContacts && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Контакты компании:
                          </h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>{application.companyContacts.name} - {application.companyContacts.position}</div>
                            <div>{application.companyContacts.email}</div>
                            {application.companyContacts.phone && (
                              <div>{application.companyContacts.phone}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col lg:flex-row gap-2 lg:items-start">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 justify-start"
                      >
                        <Eye className="w-4 h-4" />
                        Просмотр вакансии
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 justify-start"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Написать HR
                      </Button>
                      {application.status === 'interview' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 justify-start"
                        >
                          <Calendar className="w-4 h-4" />
                          Календарь
                        </Button>
                      )}
                    </div>
                  </div>
                  </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}