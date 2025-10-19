'use client'

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase,
  Building,
  Users,
  Star,
  Heart,
  Eye,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  ArrowRight,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Brain
} from 'lucide-react'
import { SITE_CATEGORY_META } from '@/lib/siteCategories'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import Footer from '@/components/Footer'
import TinderJobSearch from '@/components/TinderJobSearch'
import aiStyles from '@/styles/ai.module.css'

interface Job {
  id: string
  title: string
  description: string
  requirements: string
  responsibilities?: string
  benefits?: string
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
  matchPercentage?: number
  reasons?: string[]
}

interface ResumeItem {
  id: string
  title: string
  updatedAt: string
  isDefault?: boolean
}

const JobSearchPage = () => {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const userRole = (session?.user as any)?.role === 'CANDIDATE' ? 'jobseeker' : (session?.user as any)?.role === 'EMPLOYER' ? 'employer' : null
  const [searchMode, setSearchMode] = useState<'traditional' | 'ai'>('traditional')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    salaryMin: '',
    salaryMax: '',
    type: '',
    experience: '',
    relocation: false,
    remote: false,
    company: '',
    category: ''
  })
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [totalJobs, setTotalJobs] = useState(0)
  const [showAiFab, setShowAiFab] = useState(false)
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false)

  // Apply modal state
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyJobId, setApplyJobId] = useState<string | null>(null)
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [applyStep, setApplyStep] = useState<'resume' | 'form'>('resume')
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [applying, setApplying] = useState(false)
  const [generatingCover, setGeneratingCover] = useState(false)
  const [showStyleDialog, setShowStyleDialog] = useState(false)
  const [coverTone, setCoverTone] = useState<'neutral' | 'formal' | 'confident' | 'friendly'>('neutral')
  const [coverLength, setCoverLength] = useState<'short' | 'medium' | 'long'>('short')

  const locations = ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Remote']
  const types = ['Full-time', 'Part-time', 'Contract', 'Internship']
  const experiences = ['Junior', 'Middle', 'Senior', 'Lead']
  // Категории сайта (ключ-лейбл) из единого источника
  const siteCategories = Object.entries(SITE_CATEGORY_META).map(([key, meta]) => ({ key, label: meta.label }))

  useEffect(() => {
    fetchJobs()
  }, [searchQuery, selectedFilters, sortBy, currentPage])

  // Показывать плавающую кнопку AI на мобильном при прокрутке (без дёрганий)
  useEffect(() => {
    let rafId: number | null = null
    let lastVisible = false
    const onScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        try {
          const y = window.scrollY || document.documentElement.scrollTop || 0
          const shouldShow = y > 160
          if (shouldShow !== lastVisible) {
            lastVisible = shouldShow
            setShowAiFab(shouldShow)
          }
        } finally {
          rafId = null
        }
      })
    }
    // инициализация
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll as any)
    }
  }, [])

  // Поддержка ссылок вида /jobs?q=react&category=IT
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const cat = url.searchParams.get('category') || ''
      const q = url.searchParams.get('q') || ''
      if (cat) {
        setSelectedFilters(prev => ({ ...prev, category: cat }))
      }
      if (q) {
        setSearchQuery(q)
      }
    } catch {}
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        experience: selectedFilters.experience,
        employmentType: selectedFilters.type,
        workFormat: selectedFilters.remote ? 'REMOTE' : '',
        location: selectedFilters.location,
        category: selectedFilters.category,
        salaryMin: selectedFilters.salaryMin,
        salaryMax: selectedFilters.salaryMax,
        page: currentPage.toString(),
        limit: '12'
      })

      const response = await fetch(`/api/jobs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
        setTotalJobs(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSaveJob = async (jobId: string) => {
    try {
      // Проверяем реальное состояние на сервере
      let isSavedServer = savedJobs.includes(jobId)
      try {
        const check = await fetch(`/api/saved-jobs?jobId=${jobId}`)
        if (check.ok) {
          const data = await check.json()
          isSavedServer = !!data?.isSaved
        }
      } catch {}

      if (!isSavedServer) {
        const res = await fetch('/api/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        })
        if (res.ok) {
          setSavedJobs(prev => [...prev, jobId])
        } else {
          // fallback toggle
          const del = await fetch(`/api/saved-jobs?jobId=${jobId}`, { method: 'DELETE' })
          if (del.ok) setSavedJobs(prev => prev.filter(id => id !== jobId))
        }
      } else {
        const del = await fetch(`/api/saved-jobs?jobId=${jobId}`, { method: 'DELETE' })
        if (del.ok) {
          setSavedJobs(prev => prev.filter(id => id !== jobId))
        } else {
          const res = await fetch('/api/saved-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
          })
          if (res.ok) setSavedJobs(prev => [...prev, jobId])
        }
      }
    } catch (e) {
      console.error('toggleSaveJob error', e)
    }
  }

  const handleFilterChange = (key: string, value: string | boolean) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedFilters({
      location: '',
      salaryMin: '',
      salaryMax: '',
      type: '',
      experience: '',
      relocation: false,
      remote: false,
      company: '',
      category: ''
    })
    setCurrentPage(1)
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
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Сегодня'
    if (diffDays === 2) return 'Вчера'
    if (diffDays <= 7) return `${diffDays} дней назад`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} недель назад`
    return `${Math.floor(diffDays / 30)} месяцев назад`
  }

  const openApply = async (jobId: string) => {
    if (!isLoggedIn) {
      window.location.href = '/auth/signin'
      return
    }
    if (userRole !== 'jobseeker') {
      alert('Только соискатели могут откликаться на вакансии')
      return
    }
    setApplyJobId(jobId)
    setShowApplyModal(true)
    setApplyStep('resume')
    setLoadingResumes(true)
    try {
      const res = await fetch('/api/resumes')
      if (res.ok) {
        const data = await res.json()
        setResumes(data.resumes || [])
        setSelectedResumeId((data.resumes || [])[0]?.id || null)
      } else {
        setResumes([])
      }
    } catch {
      setResumes([])
    } finally {
      setLoadingResumes(false)
    }
  }

  const handleApply = async () => {
    if (!applyJobId || !selectedResumeId) return
    setApplying(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: applyJobId, resumeId: selectedResumeId, coverLetter })
      })
      if (response.ok) {
        alert('Отклик успешно отправлен!')
        setShowApplyModal(false)
        setCoverLetter('')
      } else {
        alert('Ошибка при отправке отклика')
      }
    } catch (e) {
      alert('Ошибка при отправке отклика')
    } finally {
      setApplying(false)
    }
  }

  const generateCoverLetter = async () => {
    if (!applyJobId || !selectedResumeId) return
    setShowStyleDialog(true)
  }

  const confirmGenerateCover = async () => {
    if (!applyJobId || !selectedResumeId) return
    setGeneratingCover(true)
    try {
      const res = await fetch(`/api/resumes/${selectedResumeId}`)
      let resumeData: any = null
      if (res.ok) {
        const j = await res.json()
        resumeData = j?.data || null
      }
      const aiRes = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cover', jobId: applyJobId, resumeText: JSON.stringify(resumeData || {}), tone: coverTone, length: coverLength })
      })
      if (aiRes.ok) {
        const j = await aiRes.json()
        const text = (j?.coverLetter || '').trim()
        if (text) setCoverLetter(text)
      }
    } catch (e) {
      console.error('generateCoverLetter error', e)
    } finally {
      setGeneratingCover(false)
      setShowStyleDialog(false)
    }
  }

  type JobCardProps = { job: Job; isSaved: boolean; onToggle: (id: string) => void }

  const JobCard = memo(function JobCard({ job, isSaved, onToggle }: JobCardProps) {
    return (
      <Link href={`/jobs/${job.id}`}>
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-full flex flex-col bg-white dark:bg-black rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
      {job.isPromoted && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full border border-gray-800 bg-gray-800 text-white px-2.5 py-0.5 text-xs font-semibold">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
            {job.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.companyLogo?.startsWith('/api/') ? job.companyLogo : `/api/profile/company-logo?f=${encodeURIComponent(job.companyLogo || '')}`} alt={job.companyName || 'Логотип компании'} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                {job.companyName?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
              {job.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{job.companyName || 'Неизвестная компания'}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(job.id) }}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Middle content stretches to make cards equal height */}
      <div className="flex-1 flex flex-col">
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {job.description}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            {job.location}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <DollarSign className="w-4 h-4 mr-2" />
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            {job.employmentType}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Briefcase className="w-4 h-4 mr-2" />
            {job.experienceLevel}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills?.slice(0, 4).map((skill, index) => (
            <span key={index} className="inline-flex items-center rounded-full border border-transparent bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-0.5 text-xs font-semibold">
              {skill}
            </span>
          ))}
          {job.skills && job.skills.length > 4 && (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
              +{job.skills.length - 4}
            </span>
          )}
        </div>

        {Array.isArray(job.reasons) && job.reasons.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {job.reasons.slice(0, 2).join(' • ')}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {typeof job.matchPercentage === 'number' && (
            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
              <Star className="w-4 h-4" />
              {job.matchPercentage}%
            </div>
          )}
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {job.applicationsCount}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {job.savedCount}
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(job.createdAt)}
          </div>
        </div>
        
        <Button 
          size="sm"
          className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openApply(job.id) }}
        >
          Откликнуться
        </Button>
      </div>
        </motion.div>
      </Link>
    )
  }, (prev, next) => prev.job.id === next.job.id && prev.isSaved === next.isSaved)

  const Toolbar = () => (
    <section className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-14 md:top-16 z-40">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск вакансий, компаний, навыков..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 text-sm md:text-base"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            <div className={`${aiStyles.gradientBorder} ${aiStyles.roundedPill} ${aiStyles.edge} ${aiStyles.bwThick} ${aiStyles.ringVibrant} relative`} style={{ borderRadius: 9999 }}>
              <Button
                variant="default"
                onClick={() => { setSearchMode(searchMode === 'ai' ? 'traditional' : 'ai'); try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {} }}
                className="rounded-3xl px-6 md:px-7 py-2 h-11 md:h-12 text-sm md:text-base bg-white text-black hover:bg-gray-50 dark:bg-white dark:text-black shadow-lg"
              >
                <Brain className="w-5 h-5 mr-2" />
                {searchMode === 'ai' ? 'Вакансии' : 'AI Поиск'}
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-gray-300 dark:border-gray-700 rounded-3xl px-3 py-2 h-9 text-sm"
            >
              <Filter className="w-5 h-5 mr-2 sm:mr-2" />
              <span className="hidden sm:inline">Фильтры</span>
            </Button>

            <select
              value={selectedFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 h-9 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 text-sm max-w-[52vw] md:max-w-[240px]"
            >
              <option value="">Категория</option>
              {siteCategories.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 h-9 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 text-sm max-w-[48vw] sm:max-w-none"
            >
              <option value="relevance">По релевантности</option>
              <option value="date">По дате</option>
              <option value="salary">По зарплате</option>
            </select>
            
            <div className="flex bg-gray-100 dark:bg-gray-900 rounded-3xl p-1 shrink-0 h-9">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-2xl h-7 w-7 p-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-2xl h-7 w-7 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              aria-label="Скрыть панель"
              onClick={() => setToolbarCollapsed(true)}
              className="rounded-full h-8 w-8 p-0 ml-1 md:ml-2"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      {/* Search Header */}
      {!toolbarCollapsed && (<Toolbar />)}

      {/* Tiny sticky reveal button shown only when toolbar is collapsed */}
      {toolbarCollapsed && (
        <div className="sticky top-[4.5rem] md:top-[5rem] z-40 flex justify-end px-3 md:px-4">
          <Button
            variant="outline"
            size="sm"
            aria-label="Показать панель"
            onClick={() => setToolbarCollapsed(false)}
            className="rounded-full h-8 w-8 p-0 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* AI Search Mode */}
      {(searchMode === 'ai') && (
        <section className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-8">
            {userRole === 'jobseeker' ? (
              <TinderJobSearch />
            ) : (
              <div className="text-center py-10">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI‑поиск доступен только соискателям</h3>
                <p className="text-gray-600 dark:text-gray-400">Войдите как кандидат, чтобы воспользоваться AI‑поиском. Для работодателей доступен раздел «Кандидаты».</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800"
          >
            <div className="container mx-auto px-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Локация
                  </label>
                  <select
                    value={selectedFilters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                  >
                    <option value="">Все локации</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Зарплата
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="От"
                      value={selectedFilters.salaryMin}
                      onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                    />
                    <Input
                      type="number"
                      placeholder="До"
                      value={selectedFilters.salaryMax}
                      onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                    />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тип занятости
                  </label>
                  <select
                    value={selectedFilters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                  >
                    <option value="">Все типы</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Опыт
                  </label>
                  <select
                    value={selectedFilters.experience}
                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                  >
                    <option value="">Любой опыт</option>
                    {experiences.map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Категория
                  </label>
                  <select
                    value={selectedFilters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                  >
                    <option value="">Все категории</option>
                    {siteCategories.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Remote Work */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Формат работы
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFilters.remote}
                        onChange={(e) => handleFilterChange('remote', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Удаленная работа</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-3xl px-6 py-3"
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results - Only show in traditional mode */}
      {searchMode === 'traditional' && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Поиск вакансий
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Найдено {totalJobs} вакансий
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} items-stretch will-change-auto`}>
                  {jobs.map((job) => (
                    <div key={job.id}>
                      <JobCard job={job} isSaved={savedJobs.includes(job.id)} onToggle={toggleSaveJob} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalJobs > 12 && (
                  <div className="flex items-center justify-center mt-12 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-2 border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(totalJobs / 12)) }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(page)}
                          className={`border-2 rounded-2xl px-4 py-2 ${currentPage === page ? 'bg-gray-900 text-white' : 'border-gray-300 dark:border-gray-700'}`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalJobs / 12), prev + 1))}
                      disabled={currentPage === Math.ceil(totalJobs / 12)}
                      className="border-2 border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Плавающая кнопка AI для мобильных */}
      <div className="fixed bottom-4 right-4 md:hidden z-40" style={{ pointerEvents: showAiFab ? 'auto' : 'none', opacity: showAiFab ? 1 : 0, transition: 'opacity .2s ease' }}>
        <div className={`${aiStyles.gradientBorder} ${aiStyles.roundedPill} ${aiStyles.edge} ${aiStyles.bwThick} ${aiStyles.ringVibrant}`} style={{ borderRadius: 9999 }}>
          <Button
            onClick={() => { setSearchMode(searchMode === 'ai' ? 'traditional' : 'ai'); try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {} }}
            className="rounded-full w-16 h-16 p-0 bg-white text-black dark:bg-white dark:text-black shadow-xl"
            aria-label={searchMode === 'ai' ? 'Вернуться к вакансиям' : 'AI Поиск'}
          >
            {searchMode === 'ai' ? <Grid className="w-7 h-7" /> : <Brain className="w-7 h-7" />}
          </Button>
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowApplyModal(false)}
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Отклик на вакансию</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowApplyModal(false)}>✕</Button>
                </div>

                {applyStep === 'resume' ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Выберите резюме</h3>
                    {loadingResumes ? (
                      <div className="text-gray-500">Загрузка...</div>
                    ) : resumes.length === 0 ? (
                      <div className="text-gray-600 dark:text-gray-400">У вас пока нет резюме. Создайте его на странице «Создать резюме».</div>
                    ) : (
                      <div className="space-y-2">
                        {resumes.map(r => (
                          <label key={r.id} className="flex items-center gap-3 p-3 border rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                            <input type="radio" name="resume" checked={selectedResumeId === r.id} onChange={() => setSelectedResumeId(r.id)} />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{r.title}</div>
                              <div className="text-xs text-gray-500">Обновлено {new Date(r.updatedAt).toLocaleDateString('ru-RU')}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowApplyModal(false)}>Отмена</Button>
                      <Button className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black" onClick={() => setApplyStep('form')} disabled={!selectedResumeId}>Далее</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">Сопроводительное письмо (необязательно)</label>
                    <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={6} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white" placeholder="Коротко расскажите, почему вы подходите..." />
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setApplyStep('resume')}>Назад</Button>
                      <Button variant="outline" onClick={generateCoverLetter} disabled={generatingCover} className="rounded-2xl">
                        {generatingCover ? 'Генерация...' : 'Сгенерировать письмо'}
                      </Button>
                      <Button className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black" onClick={handleApply} disabled={applying}>{applying ? 'Отправка...' : 'Отправить отклик'}</Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style Dialog */}
      <Dialog open={showStyleDialog} onOpenChange={(o) => { if (!o) setShowStyleDialog(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Параметры письма</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Стиль</span>
              <Select value={coverTone} onValueChange={(v: any) => setCoverTone(v)}>
                <SelectTrigger className="min-w-[180px]"><SelectValue placeholder="Стиль" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Нейтральный</SelectItem>
                  <SelectItem value="formal">Формальный</SelectItem>
                  <SelectItem value="confident">Уверенный</SelectItem>
                  <SelectItem value="friendly">Дружелюбный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Размер</span>
              <Select value={coverLength} onValueChange={(v: any) => setCoverLength(v)}>
                <SelectTrigger className="min-w-[180px]"><SelectValue placeholder="Размер" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Короткое</SelectItem>
                  <SelectItem value="medium">Среднее</SelectItem>
                  <SelectItem value="long">Длинное</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowStyleDialog(false)}>Отмена</Button>
              <Button onClick={confirmGenerateCover} disabled={generatingCover} className="bg-gray-900 dark:bg-white text-white dark:text-black">
                {generatingCover ? 'Генерация...' : 'Сгенерировать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default JobSearchPage