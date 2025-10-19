'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Building, 
  Star,
  Heart,
  Eye,
  Briefcase,
  DollarSign,
  ArrowRight,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import Footer from '@/components/Footer'

interface Company {
  id: string
  companyName: string
  logo?: string
  description?: string
  industry?: string
  size?: string
  location?: string
  website?: string
  jobsCount: number
  isFeatured: boolean
  isSaved: boolean
  skills: string[]
  recentJobs: Array<{
    id: string
    title: string
    employmentType: string
    salaryMin?: number
    salaryMax?: number
    currency: string
    createdAt: string
  }>
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const [selectedFilters, setSelectedFilters] = useState({
    industry: '',
    size: '',
    location: '',
    rating: ''
  })
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [savedCompanies, setSavedCompanies] = useState<string[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCompanies, setTotalCompanies] = useState(0)

  const industries = ['Технологии', 'Data Science', 'Облачные технологии', 'Веб-разработка', 'FinTech', 'Analytics']
  const sizes = ['1-10 сотрудников', '10-50 сотрудников', '50-200 сотрудников', '200-500 сотрудников', '500-1000 сотрудников', '1000+ сотрудников']
  const locations = ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Remote']

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchCompanies()
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchQuery, selectedFilters, sortBy, currentPage])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        industry: selectedFilters.industry,
        size: selectedFilters.size,
        location: selectedFilters.location,
        rating: selectedFilters.rating,
        sortBy: sortBy,
        page: currentPage.toString(),
        limit: '12'
      })

      const response = await fetch(`/api/companies?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
        setTotalCompanies(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSaveCompany = (companyId: string) => {
    setSavedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedFilters({
      industry: '',
      size: '',
      location: '',
      rating: ''
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

  const CompanyCard = ({ company }: { company: Company }) => (
    <Link href={`/companies/${company.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer"
      >
      {company.isFeatured && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-gray-800 text-white">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {company.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo.startsWith('/api/') ? company.logo : `/api/profile/company-logo?f=${encodeURIComponent(company.logo)}`} alt={company.companyName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {company.companyName.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 truncate">
              {company.companyName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Building className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{company.industry || 'Не указано'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => toggleSaveCompany(company.id)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
        >
          <Heart className={`w-5 h-5 ${savedCompanies.includes(company.id) ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
        </button>
      </div>
      
      {/* Description */}
      {company.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm">
          {company.description}
        </p>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4 mr-2" />
          <span className="truncate">{company.size || 'Не указано'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="truncate">{company.location || 'Не указано'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Briefcase className="w-4 h-4 mr-2" />
          <span className="truncate">{company.jobsCount} вакансий</span>
        </div>
      </div>
      
      {/* Skills */}
      {company.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {company.skills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {company.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{company.skills.length - 3}
            </Badge>
          )}
        </div>
      )}
      
      {/* Recent Jobs */}
      {company.recentJobs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Последние вакансии:
          </h4>
          <div className="space-y-1">
            {company.recentJobs.slice(0, 2).map((job, index) => (
              <div key={job.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span className="truncate">{job.title}</span>
                <span className="flex-shrink-0 ml-2">
                  {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="text-xs text-gray-400">
              {company.jobsCount} активных вакансий
            </div>
          </div>
          
          <div className="flex gap-2">
            {company.website && (
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-2xl text-xs"
                onClick={() => window.open(company.website, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Сайт
              </Button>
            )}
            <Button 
              size="sm"
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl text-xs"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/companies/${company.id}`;
              }}
            >
              Смотреть вакансии
            </Button>
          </div>
        </div>
      </div>
      </motion.div>
    </Link>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Building className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка компаний...
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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Компании
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Найдите идеальную компанию для работы среди лучших работодателей
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск компаний, отраслей, технологий..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-2 border-gray-300 dark:border-gray-700 rounded-3xl px-6 py-2"
              >
                <Filter className="w-4 h-4 mr-2" />
                Фильтры
              </Button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              >
                <option value="relevance">По релевантности</option>
                <option value="name">По названию</option>
                <option value="jobs">По количеству вакансий</option>
              </select>
              
              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-3xl p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-2xl"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-2xl"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Найдено {totalCompanies} компаний
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Отрасль
                </label>
                <select
                  value={selectedFilters.industry}
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                >
                  <option value="">Все отрасли</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Размер компании
                </label>
                <select
                  value={selectedFilters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                >
                  <option value="">Любой размер</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

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
        </div>
      )}

      {/* Results */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>

          {/* Pagination */}
          {totalCompanies > 12 && (
            <div className="flex items-center justify-center mt-12 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-2 border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalCompanies / 12)) }, (_, i) => i + 1).map(page => (
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCompanies / 12), prev + 1))}
                disabled={currentPage === Math.ceil(totalCompanies / 12)}
                className="border-2 border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-2"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}