'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Building,
  Users,
  Briefcase,
  CheckCircle,
  X,
  Share2,
  Heart,
  Send,
  AlertCircle,
  Star,
  Eye,
  MessageCircle,
  FileText,
  Link as LinkIcon,
  Globe,
  Mail,
  Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'


interface Job {
  id: string
  title: string
  description: string
  requirements: string
  responsibilities: string
  benefits: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  experienceLevel: string
  employmentType: string
  workFormat: string
  location: string
  isRemote: boolean
  isActive: boolean
  isPromoted: boolean
  viewsCount: number
  applicationsCount: number
  createdAt: string
  updatedAt: string
  expiresAt?: string
  skills: string[]
  company: {
    id: string
    name: string
    description: string
    logo?: string
    website?: string
    industry: string
    size: string
    location: string
  }
}

interface Application {
  id: string
  status: string
  coverLetter?: string
  createdAt: string
  candidate: {
    name: string
    avatar?: string
  }
}

interface ResumeItem {
  id: string
  title: string
  updatedAt: string
}

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const userRole = (session?.user as any)?.role === 'CANDIDATE'
    ? 'jobseeker'
    : (session?.user as any)?.role === 'EMPLOYER'
      ? 'employer'
      : null
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [applyStep, setApplyStep] = useState<'resume' | 'form'>('resume')
  const [loadingResumes, setLoadingResumes] = useState(false)

  const jobId = params.id as string

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        if (response.ok) {
          const jobData = await response.json()
          setJob(jobData)
          
          // Check if user has already applied
          if (isLoggedIn) {
            const applicationsResponse = await fetch(`/api/applications?jobId=${jobId}`)
            if (applicationsResponse.ok) {
              const applicationsData = await applicationsResponse.json()
              setHasApplied(applicationsData.applications?.length > 0)
              setApplications(applicationsData.applications || [])
            }
            
            // Check if job is saved
            const savedResponse = await fetch(`/api/saved-jobs?jobId=${jobId}`)
            if (savedResponse.ok) {
              const savedData = await savedResponse.json()
              setIsSaved(!!savedData?.isSaved)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId, isLoggedIn])

  const handleApply = async () => {
    if (!isLoggedIn) {
      router.push('/auth/signin')
      return
    }

    if (userRole !== 'jobseeker') {
      alert('Только соискатели могут откликаться на вакансии')
      return
    }

    setApplying(true)
    try {
      const selectedResumeTitle = resumes.find(r => r.id === selectedResumeId)?.title || ''
      const finalCoverLetter = coverLetter || ''
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          coverLetter: finalCoverLetter,
          resumeId: selectedResumeId,
        }),
      })

      if (response.ok) {
        setHasApplied(true)
        setShowApplicationForm(false)
        setCoverLetter('')
        alert('Отклик успешно отправлен!')
      } else {
        alert('Ошибка при отправке отклика')
      }
    } catch (error) {
      console.error('Error applying:', error)
      alert('Ошибка при отправке отклика')
    } finally {
      setApplying(false)
    }
  }

  const handleSaveJob = async () => {
    if (!isLoggedIn) {
      router.push('/auth/signin')
      return
    }

    try {
      // Сверяем состояние на сервере, чтобы избежать рассинхрона
      let serverSaved = isSaved
      try {
        const check = await fetch(`/api/saved-jobs?jobId=${jobId}`)
        if (check.ok) {
          const data = await check.json()
          serverSaved = !!data?.isSaved
        }
      } catch {}

      if (!serverSaved) {
        const res = await fetch('/api/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        })
        if (res.ok) {
          setIsSaved(true)
          alert('Вакансия сохранена!')
        } else {
          // Если запись уже существует — пробуем удалить (toggle)
          const del = await fetch(`/api/saved-jobs?jobId=${jobId}`, { method: 'DELETE' })
          if (del.ok) {
            setIsSaved(false)
            alert('Вакансия удалена из сохраненных')
          } else {
            throw new Error('toggle_failed')
          }
        }
      } else {
        const del = await fetch(`/api/saved-jobs?jobId=${jobId}`, { method: 'DELETE' })
        if (del.ok) {
          setIsSaved(false)
          alert('Вакансия удалена из сохраненных')
        } else {
          // Если почему‑то удалить не вышло — пробуем создать заново, чтобы не оставить UI висеть
          const res = await fetch('/api/saved-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId }),
          })
          if (res.ok) {
            setIsSaved(true)
            alert('Вакансия сохранена!')
          } else {
            throw new Error('toggle_failed')
          }
        }
      }
    } catch (error) {
      console.error('Error toggling saved job:', error)
      alert('Не удалось изменить состояние избранного')
    }
  }

  // Copy link with robust fallbacks (HTTPS clipboard → execCommand → prompt)
  const copyLink = async (url: string) => {
    try {
      // 1) Native share if доступно (мобилки)
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ url })
        return
      }
      // 2) Современный Clipboard API в безопасном контексте
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована в буфер обмена')
        return
      }
      // 3) Старый способ через скрытый textarea (работает в HTTP)
      const el = document.createElement('textarea')
      el.value = url
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.top = '0'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      if (ok) {
        alert('Ссылка скопирована в буфер обмена')
        return
      }
      // 4) Последний фолбэк — показать окно с ссылкой
      const manual = window.prompt('Скопируйте ссылку', url)
      if (manual !== null) return
      alert('Не удалось скопировать ссылку')
    } catch (e) {
      const manual = window.prompt('Скопируйте ссылку', url)
      if (manual === null) alert('Не удалось скопировать ссылку')
    }
  }

  const openApplyModal = async () => {
    setShowApplicationForm(true)
    setApplyStep('resume')
    setLoadingResumes(true)
    try {
      const res = await fetch('/api/resumes')
      if (res.ok) {
        const data = await res.json()
        setResumes(data.resumes || [])
        if ((data.resumes || []).length > 0) {
          setSelectedResumeId((data.resumes || [])[0].id)
        }
      } else {
        setResumes([])
      }
    } catch {
      setResumes([])
    } finally {
      setLoadingResumes(false)
    }
  }

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return 'Зарплата не указана'
    
    const currencySymbols = {
      'RUB': '₽',
      'USD': '$',
      'EUR': '€'
    }
    
    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || currency
    
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`
    } else if (min) {
      return `от ${symbol}${min.toLocaleString()}`
    } else if (max) {
      return `до ${symbol}${max.toLocaleString()}`
    }
    
    return 'Зарплата не указана'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'REVIEWED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'SHORTLISTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'HIRED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Вакансия не найдена
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Возможно, эта вакансия была удалена или недоступна
            </p>
            <Button onClick={() => router.push('/jobs')}>
              Вернуться к вакансиям
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {job.title}
                          </h1>
                          {job.isPromoted && (
                            <Badge className="bg-gray-800 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{job.company.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Опубликовано {formatDate(job.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Badge variant="secondary" className="gap-2">
                            <Briefcase className="w-3 h-3" />
                            {job.employmentType}
                          </Badge>
                          <Badge variant="outline" className="gap-2">
                            <Clock className="w-3 h-3" />
                            {job.experienceLevel}
                          </Badge>
                          <Badge variant="outline" className="gap-2">
                            <Users className="w-3 h-3" />
                            {job.workFormat}
                          </Badge>
                          {job.isRemote && (
                            <Badge variant="outline" className="gap-2">
                              <Globe className="w-3 h-3" />
                              Удаленная работа
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveJob}
                          className="gap-2"
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => copyLink(window.location.href)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Salary */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Зарплата
                            </div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                            </div>
                          </div>
                        </div>
                        
                        {!hasApplied && isLoggedIn && userRole === 'jobseeker' && (
                          <Button
                            onClick={openApplyModal}
                            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                          >
                            Откликнуться
                          </Button>
                        )}
                        
                        {hasApplied && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Уже откликнулись
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                        <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {job.viewsCount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Просмотров
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                        <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {job.applicationsCount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Откликов
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {job.expiresAt ? formatDate(job.expiresAt) : 'Активно'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Срок действия
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Job Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      О вакансии
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Описание
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {job.description}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Обязанности
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {job.responsibilities}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Требования
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {job.requirements}
                        </div>
                      </div>

                      {job.benefits && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Условия и бонусы
                          </h3>
                          <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                            {job.benefits}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Skills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Требуемые навыки
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {job.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Applications (for employers) */}
              {isLoggedIn && userRole === 'employer' && applications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                    <CardContent className="p-8">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Отклики ({applications.length})
                      </h2>
                      <div className="space-y-4">
                        {applications.map((application) => (
                          <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={application.candidate.avatar} />
                                <AvatarFallback>
                                  {application.candidate.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {application.candidate.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(application.createdAt)}
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(application.status)}>
                              {getStatusText(application.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      О компании
                    </h3>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={job.company.logo ? (job.company.logo.startsWith('/api/') ? job.company.logo : `/api/profile/company-logo?f=${encodeURIComponent(job.company.logo)}`) : undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
                          {job.company.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {job.company.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {job.company.industry}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                      {job.company.description}
                    </p>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {job.company.size} сотрудников
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {job.company.location}
                        </span>
                      </div>
                      {job.company.website && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-gray-500" />
                          <a 
                            href={job.company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 dark:text-gray-400 hover:underline"
                          >
                            Сайт компании
                          </a>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => router.push(`/companies/${job.company.id}`)}
                    >
                      Подробнее о компании
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Быстрые действия
                    </h3>
                    
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={handleSaveJob}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        {isSaved ? 'Удалить из сохраненных' : 'Сохранить вакансию'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => copyLink(window.location.href)}
                      >
                        <Share2 className="w-4 h-4" />
                        Поделиться вакансией
                      </Button>
                      
                      {/* PDF действие убрано по требованию */}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Application Form Modal */}
      <AnimatePresence>
        {showApplicationForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowApplicationForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-black rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Откликнуться на вакансию
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApplicationForm(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {applyStep === 'resume' ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Выберите резюме
                      </h3>
                      {loadingResumes ? (
                        <div className="text-gray-500">Загрузка...</div>
                      ) : resumes.length === 0 ? (
                        <div className="text-gray-600 dark:text-gray-400">
                          У вас пока нет резюме. Создайте его на странице «Создать резюме».
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {resumes.map((r) => (
                            <label key={r.id} className="flex items-center gap-3 p-3 border rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                              <input
                                type="radio"
                                name="resume"
                                checked={selectedResumeId === r.id}
                                onChange={() => setSelectedResumeId(r.id)}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">{r.title}</div>
                                <div className="text-xs text-gray-500">Обновлено {new Date(r.updatedAt).toLocaleDateString('ru-RU')}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowApplicationForm(false)}
                        className="flex-1"
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={() => setApplyStep('form')}
                        disabled={!selectedResumeId}
                        className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                      >
                        Далее
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {job.company.name} • {job.location}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Сопроводительное письмо (необязательно)
                      </label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 resize-none"
                        placeholder="Расскажите, почему вы подходите для этой позиции..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setApplyStep('resume')}
                        className="flex-1"
                      >
                        Назад
                      </Button>
                      <Button
                        onClick={handleApply}
                        disabled={applying}
                        className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                      >
                        {applying ? 'Отправка...' : 'Отправить отклик'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}