'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  MapPin,
  Users,
  Building,
  Globe,
  Mail,
  Phone,
  Star,
  Briefcase,
  Calendar,
  CheckCircle,
  X,
  ExternalLink,
  Award,
  TrendingUp,
  Eye,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


interface Company {
  id: string
  name: string
  description: string
  website?: string
  industry: string
  size: string
  location: string
  logo?: string
  founded: string
  revenue?: string
  rating: number
  reviewsCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Job {
  id: string
  title: string
  description: string
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
  expiresAt?: string
  skills: string[]
}

interface CompanyReview {
  id: string
  rating: number
  comment: string
  createdAt: string
  candidate: {
    name: string
    avatar?: string
  }
}

export default function CompanyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const isLoggedIn = !!session
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'jobs' | 'reviews'>('about')
  const [isFollowing, setIsFollowing] = useState(false)

  const companyId = params.id as string

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        // Fetch company details
        const companyResponse = await fetch(`/api/companies/${companyId}`)
        if (companyResponse.ok) {
          const companyData = await companyResponse.json()
          setCompany(companyData)
        }

        // Fetch company jobs
        const jobsResponse = await fetch(`/api/companies/${companyId}/jobs`)
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json()
          setJobs(jobsData.jobs || [])
        }

        // Fetch company reviews
        const reviewsResponse = await fetch(`/api/companies/${companyId}/reviews`)
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          setReviews(reviewsData.reviews || [])
        }

        // Check if user is following company
        if (isLoggedIn) {
          const followResponse = await fetch(`/api/companies/${companyId}/follow/check`)
          if (followResponse.ok) {
            const followData = await followResponse.json()
            setIsFollowing(followData.isFollowing)
          }
        }
      } catch (error) {
        console.error('Error fetching company details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyDetails()
    }
  }, [companyId, isLoggedIn])

  const handleFollow = async () => {
    if (!isLoggedIn) {
      router.push('/auth/signin')
      return
    }

    try {
      const response = await fetch(`/api/companies/${companyId}/follow`, {
        method: 'POST',
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        alert(isFollowing ? 'Вы отписались от компании' : 'Вы подписались на компанию')
      }
    } catch (error) {
      console.error('Error following company:', error)
      alert('Ошибка при подписке')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = company?.name || 'Компания'

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(url)
      alert('Ссылка скопирована')
      return
    } catch {}

    try {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('Ссылка скопирована')
      return
    } catch {}

    window.prompt('Скопируйте ссылку:', url)
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {Number(rating || 0).toFixed(1)}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
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

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Компания не найдена
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Возможно, эта компания была удалена или недоступна
            </p>
            <Button onClick={() => router.push('/companies')}>
              Вернуться к компаниям
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const activeJobs = jobs.filter(job => job.isActive)

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

          {/* Company Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 mb-8">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-6 flex-1">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={company.logo ? (company.logo.startsWith('/api/') ? company.logo : `/api/profile/company-logo?f=${encodeURIComponent(company.logo)}`) : undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 text-2xl">
                        {company.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {company.name}
                      </h1>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                        {company.industry}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{company.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{company.size}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Основана в {company.founded}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {renderStars(company.rating)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({company.reviewsCount} отзывов)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFollow}
                      className="gap-2"
                    >
                      <Heart className={`w-4 h-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                      {isFollowing ? 'Отписаться' : 'Подписаться'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                    <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeJobs.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Активных вакансий
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {jobs.reduce((sum, job) => sum + job.viewsCount, 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Просмотров вакансий
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                    <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {jobs.reduce((sum, job) => sum + job.applicationsCount, 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Всего откликов
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                    <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {company.rating}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Рейтинг компании
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {company.description}
                  </p>
                </div>

                {/* Contact Info */}
                {company.website && (
                  <div className="mt-6 flex items-center gap-4">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(company.website, '_blank')}
                    >
                      <Globe className="w-4 h-4" />
                      Сайт компании
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl mb-8">
              {[
                { key: 'about', label: 'О компании' },
                { key: 'jobs', label: `Вакансии (${activeJobs.length})` },
                { key: 'reviews', label: `Отзывы (${reviews.length})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      О компании {company.name}
                    </h2>
                    
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                        {company.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Ключевая информация
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Building className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Отрасль</div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {company.industry}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Размер компании</div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {company.size}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Год основания</div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {company.founded}
                                </div>
                              </div>
                            </div>
                            {company.revenue && (
                              <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-gray-500" />
                                <div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Доход</div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {company.revenue}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Контакты
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Локация</div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {company.location}
                                </div>
                              </div>
                            </div>
                            {company.website && (
                              <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-gray-500" />
                                <div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Веб-сайт</div>
                                  <a 
                                    href={company.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-medium text-gray-600 dark:text-gray-400 hover:underline"
                                  >
                                    {company.website}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'jobs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-4">
                  {activeJobs.length > 0 ? (
                    activeJobs.map((job) => (
                      <Card 
                        key={job.id} 
                        className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {job.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  <span>{job.employmentType}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(job.createdAt)}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="secondary" className="text-xs">
                                  {job.experienceLevel}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {job.workFormat}
                                </Badge>
                                {job.isRemote && (
                                  <Badge variant="outline" className="text-xs">
                                    Удаленная работа
                                  </Badge>
                                )}
                                {job.isPromoted && (
                                  <Badge className="bg-gray-800 text-white text-xs">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                {job.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{job.viewsCount}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{job.applicationsCount}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                      <CardContent className="p-12 text-center">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Нет активных вакансий
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          В настоящее время у компании нет открытых вакансий
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <Card key={review.id} className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={review.candidate?.avatar ? (review.candidate.avatar.startsWith('/api/') ? review.candidate.avatar : `/api/profile/avatar?user=${encodeURIComponent((review as any).candidateId || '')}`) : undefined} />
                              <AvatarFallback>
                                {review.candidate.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {review.candidate.name}
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatDate(review.createdAt)}
                                  </div>
                                </div>
                                {renderStars(review.rating)}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {review.comment}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                      <CardContent className="p-12 text-center">
                        <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Нет отзывов
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Будьте первым, кто оставит отзыв о этой компании
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}