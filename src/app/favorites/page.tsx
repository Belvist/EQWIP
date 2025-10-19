'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Heart, 
  Briefcase, 
  Building, 
  MapPin, 
  DollarSign, 
  Clock,
  Eye,
  Users,
  Star,
  X,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  ExternalLink,
  Calendar,
  Tag,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useUser } from '@/contexts/UserContext'

import Footer from '@/components/Footer'

interface SavedJob {
  id: string
  title: string
  company: string
  logo: string
  description: string
  location: string
  salary: string
  type: string
  experience: string
  remote: boolean
  tags: string[]
  posted: string
  views: number
  applications: number
  isFeatured: boolean
  matchScore: number
  savedAt: string
  requirements: string[]
  benefits: string[]
}

interface SavedCompany {
  id: number
  name: string
  logo: string
  description: string
  industry: string
  size: string
  location: string
  website: string
  jobsCount: number
  rating: number
  savedAt: string
}

export default function FavoritesPage() {
  const { userRole, isLoggedIn } = useUser()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'jobs' | 'companies'>('jobs')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'savedAt' | 'matchScore' | 'salary'>('savedAt')
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>([])
  const [applyingIds, setApplyingIds] = useState<string[]>([])
  const [appliedIds, setAppliedIds] = useState<string[]>([])

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true)
      try {
        // 1) реальные сохранённые вакансии
        const resJobs = await fetch('/api/saved-jobs', { credentials: 'include' })
        if (resJobs.ok) {
          const data = await resJobs.json()
          const jobs: SavedJob[] = (data.savedJobs || []).map((item: any) => ({
            id: String(item.job?.id || item.jobId),
            title: item.job?.title || 'Вакансия',
            company: item.job?.employer?.companyName || 'Компания',
            logo: item.job?.employer?.logo || (item.job?.employer?.companyName?.[0] || '•'),
            description: item.job?.description || '',
            location: item.job?.location || '',
            salary: item.job?.salaryMin || item.job?.salaryMax ? `${item.job?.salaryMin ?? ''} - ${item.job?.salaryMax ?? ''} ${item.job?.currency ?? ''}` : '',
            type: 'Full-time',
            experience: item.job?.experienceLevel || '',
            remote: item.job?.isRemote || false,
            tags: [],
            posted: new Date(item.job?.createdAt || item.createdAt).toLocaleDateString('ru-RU'),
            views: item.job?.viewsCount || 0,
            applications: item.job?.applicationsCount || 0,
            isFeatured: item.job?.isPromoted || false,
            matchScore: 0,
            savedAt: new Date(item.createdAt).toLocaleDateString('ru-RU'),
            requirements: [],
            benefits: []
          }))
          setSavedJobs(jobs)
        }

        // Получим список уже оставленных откликов текущего кандидата
        const resApps = await fetch('/api/applications', { credentials: 'include' })
        if (resApps.ok) {
          const d = await resApps.json()
          const ids: string[] = (d.applications || []).map((a: any) => String(a.jobId || a.job?.id)).filter(Boolean)
          setAppliedIds(ids)
        }

        // 2) временно: список компаний из сохранённого — соберём из вакансий
        const companiesMap = new Map<string, SavedCompany>()
        const now = new Date().toLocaleDateString('ru-RU')
        setSavedCompanies(prev => prev) // заглушка, если понадобятся отдельные сохранённые компании — сделаем отдельный API
        setSavedCompanies((jobs => {
          const arr: SavedCompany[] = []
          for (const j of (savedJobs.length ? savedJobs : jobs)) {
            const key = j.company
            if (key && !companiesMap.has(key)) {
              const rec: SavedCompany = {
                id: Math.random(),
                name: key,
                logo: (j.logo as any) || key[0],
                description: '',
                industry: '',
                size: '',
                location: j.location,
                website: '#',
                jobsCount: 1,
                rating: 0,
                savedAt: now,
              }
              companiesMap.set(key, rec)
              arr.push(rec)
            }
          }
          return arr
        })([]))
      } catch (error) {
        console.error('Error fetching favorites:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFavorites()
  }, [])

  const removeSavedJob = async (id: string) => {
    try {
    setSavedJobs(prev => prev.filter(job => job.id !== id))
      await fetch(`/api/saved-jobs?jobId=${id}`, { method: 'DELETE', credentials: 'include' })
    } catch {}
  }

  const applyToJob = async (jobId: string) => {
    try {
      if (applyingIds.includes(jobId) || appliedIds.includes(jobId)) return
      setApplyingIds(prev => [...prev, jobId])
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jobId }),
      })
      if (res.ok) {
        setAppliedIds(prev => [...prev, jobId])
      } else if (res.status === 401) {
        window.location.href = '/auth/signin'
      } else if (res.status === 400) {
        // уже есть отклик — помечаем как отправленный
        setAppliedIds(prev => [...prev, jobId])
      }
    } catch (e) {
      console.error('apply error', e)
    } finally {
      setApplyingIds(prev => prev.filter(id => id !== jobId))
    }
  }

  const removeSavedCompany = (id: number) => {
    setSavedCompanies(prev => prev.filter(company => company.id !== id))
  }

  const filteredJobs = savedJobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCompanies = savedCompanies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'savedAt':
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      case 'matchScore':
        return b.matchScore - a.matchScore
      case 'salary':
        return parseInt(b.salary.replace(/[^0-9]/g, '')) - parseInt(a.salary.replace(/[^0-9]/g, ''))
      default:
        return 0
    }
  })

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка избранного...
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
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Избранное
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Ваши сохраненные вакансии и компании
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                {savedJobs.length} вакансий
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                {savedCompanies.length} компаний
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === 'jobs' ? 'default' : 'outline'}
              onClick={() => setActiveTab('jobs')}
              className="gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Вакансии ({savedJobs.length})
            </Button>
            <Button
              variant={activeTab === 'companies' ? 'default' : 'outline'}
              onClick={() => setActiveTab('companies')}
              className="gap-2"
            >
              <Building className="w-4 h-4" />
              Компании ({savedCompanies.length})
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Поиск в избранном..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              {activeTab === 'jobs' && (
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                  {(['savedAt', 'matchScore', 'salary'] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        sortBy === sort
                          ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {sort === 'savedAt' && 'По дате'}
                      {sort === 'matchScore' && 'По совпадению'}
                      {sort === 'salary' && 'По зарплате'}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'jobs' ? (
            <div>
              {sortedJobs.length === 0 ? (
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
                  <CardContent className="text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Нет избранных вакансий
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery ? 'Ничего не найдено по вашему запросу' : 'Сохраняйте интересные вакансии, чтобы они появились здесь'}
                    </p>
                    <Button onClick={() => window.location.href = '/jobs'}>
                      Найти вакансии
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {sortedJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link href={`/jobs/${job.id}`}>
                        <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                                {job.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={job.logo.startsWith('/api/') ? job.logo : `/api/profile/company-logo?f=${encodeURIComponent(job.logo)}`} alt={job.company} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                    {job.company?.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                  {job.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {job.company}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeSavedJob(job.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {job.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.location}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {job.salary}
                            </Badge>
                            {job.matchScore && (
                              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                {job.matchScore}% совпадение
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-4">
                            {job.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {job.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {job.views}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {job.applications}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {job.posted}
                              </div>
                            </div>
                            <span>Сохранено {job.savedAt}</span>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              className="flex-1"
                              disabled={applyingIds.includes(job.id) || appliedIds.includes(job.id)}
                              onClick={(e) => {
                                e.preventDefault()
                                applyToJob(job.id)
                              }}
                            >
                              {appliedIds.includes(job.id) ? 'Отклик отправлен' : (applyingIds.includes(job.id) ? 'Отправка…' : 'Откликнуться')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {sortedCompanies.length === 0 ? (
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
                  <CardContent className="text-center">
                    <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Нет избранных компаний
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery ? 'Ничего не найдено по вашему запросу' : 'Сохраняйте интересные компании, чтобы они появились здесь'}
                    </p>
                    <Button onClick={() => window.location.href = '/companies'}>
                      Найти компании
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {sortedCompanies.map((company) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                                {company.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={company.logo.startsWith('/api/') ? company.logo : `/api/profile/company-logo?f=${encodeURIComponent(company.logo)}`} alt={company.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                    {company.name?.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                  {company.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {company.industry}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeSavedCompany(company.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {company.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {company.location}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {company.size}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {company.jobsCount} вакансий
                            </Badge>
                            <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <Star className="w-3 h-3 mr-1" />
                              {company.rating}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <span>Сохранено {company.savedAt}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1">
                              Смотреть вакансии
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={company.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}