'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  Briefcase,
  Users,
  Building,
  ArrowRight,
  Star,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Heart,
  Eye,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'
import TinderJobSearch from '@/components/TinderJobSearch'
import { useUser } from '@/contexts/UserContext'

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
  isPromoted: boolean
  companyName: string
  companyLogo?: string
  createdAt: string
  skills: string[]
  applicationsCount: number
  savedCount: number
}

interface Category {
  name: string
  count: number
  icon: any
}

const JobCard = ({ job }: { job: Job }) => {
  const [isSaved, setIsSaved] = useState(false)

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
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Сегодня'
    if (diffDays === 2) return 'Вчера'
    if (diffDays <= 7) return `${diffDays} дней назад`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} недель назад`
    return `${Math.floor(diffDays / 30)} месяцев назад`
  }

  return (
    <Link href={`/jobs/${job.id}`}>
      <motion.div
        className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 cursor-pointer relative overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300"
        whileHover={{ y: -5 }}
      >
        {job.isPromoted && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-gray-800 text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
              {job.companyLogo ? (
                <img 
                  src={job.companyLogo} 
                  alt={job.companyName} 
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-avatar.jpg'
                  }}
                />
              ) : (
                <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {job.companyName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 truncate">
                {job.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{job.companyName}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault()
              setIsSaved(!isSaved)
            }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            {job.location}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            {job.employmentType}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(job.createdAt)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 3).map((tag, i) => (
            <Badge key={`${tag}-${i}`} variant="neutral" className="text-xs">
              {tag}
            </Badge>
          ))}
          {job.skills.length > 3 && (
            <Badge variant="neutral" className="text-xs">
              +{job.skills.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">{job.applicationsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{job.savedCount}</span>
            </div>
          </div>
          
          <Button 
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-sm font-medium px-4 py-2 shadow-md"
          >
            Откликнуться
          </Button>
        </div>
      </motion.div>
    </Link>
  )
}

const CategoryCard = ({ category }: { category: Category }) => {
  return (
    <Link href={`/jobs?category=${encodeURIComponent(category.name)}`}>
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 cursor-pointer hover:shadow-xl transition-all duration-300 h-full"
      >
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <category.icon className="w-6 h-6 text-gray-700 dark:text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{category.count} вакансий</p>
      </motion.div>
    </Link>
  )
}

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { userRole, isLoggedIn } = useUser()
  
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCompanies: 0,
    totalCandidates: 0
  })
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured jobs
        const jobsResponse = await fetch('/api/jobs/featured?limit=3&popular=true', { cache: 'no-store' })
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json()
          setFeaturedJobs(jobsData.jobs || [])
        }

        // Set categories
        setCategories([
          { name: 'Информационные технологии', count: 0, icon: Briefcase },
          { name: 'Инженерия и робототехника', count: 0, icon: Building },
          { name: 'Электроника и микроэлектроника', count: 0, icon: Briefcase },
          { name: 'Биотехнологии', count: 0, icon: Briefcase },
          { name: 'Кибербезопасность', count: 0, icon: Briefcase },
          { name: 'Энергетика и экология', count: 0, icon: Briefcase },
          { name: 'Материаловедение и нанотехнологии', count: 0, icon: Briefcase },
          { name: 'Стажёр', count: 0, icon: Users },
          { name: 'Junior', count: 0, icon: Users },
          { name: 'Middle', count: 0, icon: Users },
          { name: 'Senior', count: 0, icon: Users },
          { name: 'Другое', count: 0, icon: Briefcase }
        ])

        // Fetch stats
        const statsResponse = await fetch('/api/stats', { cache: 'no-store' })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats({
            totalJobs: statsData.totalJobs || 0,
            totalCompanies: statsData.totalCompanies || 0,
            totalCandidates: statsData.totalCandidates || 0
          })
        }

        // Fetch popular tags
        const tagsResponse = await fetch('/api/jobs/popular-tags')
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          setPopularTags(tagsData.tags || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setFeaturedJobs([])
        setCategories([])
        setPopularTags([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Загрузка...
          </h3>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-full mb-8"
            >
              <span className="text-sm font-semibold">AI-powered job search platform</span>
            </motion.div>

            {/* Main title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight">
                <span className="text-foreground">Найдите работу</span>
                <br />
                <span className="text-foreground">мечты</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
                EQWIP использует искусственный интеллект, чтобы помочь вам найти идеальную вакансию среди тысяч предложений от лучших компаний
              </p>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto mb-12"
            >
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-3 shadow-2xl transition-all duration-300 w-full">
                  <div className="flex items-center gap-4 pl-4 pr-4">
                    <Search className="w-7 h-7 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Поиск вакансий, навыков, компаний..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="flex-1 min-w-0 border-0 bg-transparent focus-visible:ring-0 text-lg text-foreground placeholder-gray-500 py-3"
                    />
                    <Button 
                      type="submit" 
                      size="sm"
                      className="rounded-3xl font-semibold text-lg whitespace-nowrap bg-gray-900 hover:bg-gray-800 text-white shadow-md px-6 py-3"
                    >
                      <span className="flex items-center gap-2">
                        Найти работу
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </Button>
                  </div>
                </div>
              </form>

              {/* Popular tags */}
              <div className="flex flex-wrap gap-3 justify-center mt-8">
                {popularTags.slice(0, 6).map((tag, index) => (
                  <motion.button
                    key={tag}
                    onClick={() => router.push(`/jobs?search=${encodeURIComponent(tag)}`)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 rounded-full shadow-sm hover:shadow-md"
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {[
                { value: stats.totalJobs, label: 'Активных вакансий', icon: Briefcase },
                { value: stats.totalCompanies, label: 'Компаний', icon: Building },
                { value: stats.totalCandidates, label: 'Профессионалов', icon: Users }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Популярные вакансии
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Самые интересные предложения от лучших компаний
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="h-full"
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-8"
          >
            <Button 
              size="lg"
              onClick={() => router.push('/jobs')}
              className="px-8 py-4 rounded-3xl font-bold text-lg bg-gray-900 hover:bg-gray-800 text-white shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center gap-2">
                Смотреть все вакансии
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-14 px-4 bg-white dark:from-black dark:to-gray-900">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Категории
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Найдите работу по своей специальности
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="h-full"
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommendations Section */}
      <section className="py-14 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">AI Рекомендации</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Наш ИИ подберет для вас идеальные вакансии. Свайп вправо — отклик, влево — пропуск.</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <TinderJobSearch />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}