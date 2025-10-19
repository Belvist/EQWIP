'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Briefcase,
  Users,
  Star,
  Heart,
  Eye,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle,
  X,
  ArrowRight,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  Award,
  Brain,
  Target,
  Download,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Twitter,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'

import Footer from '@/components/Footer'

interface Candidate {
  id: string
  name: string
  title: string
  avatar?: string
  location: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  experience: number
  skills: string[]
  bio?: string
  matchScore: number
  availability: string
  recentActivity: string
}

export default function CandidatesPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    skills: '',
    location: '',
    experience: '',
    availability: '',
    salary: ''
  })
  const [sortBy, setSortBy] = useState('match')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [savedCandidates, setSavedCandidates] = useState<string[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const locations = ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Remote']
  const experiences = ['1-2 года', '3-5 лет', '5+ лет']
  const availabilities = ['Готов к работе', 'Ищет работу', 'Открыта к предложениям']
  const skills = ['React', 'Node.js', 'Python', 'AWS', 'DevOps', 'Machine Learning', 'Vue.js', 'Data Science']

  useEffect(() => {
    fetchCandidates()
  }, [searchQuery, selectedFilters, sortBy, currentPage, isLoggedIn])

  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        skills: selectedFilters.skills,
        location: selectedFilters.location,
        experience: selectedFilters.experience,
        availability: selectedFilters.availability,
        salary: selectedFilters.salary,
        sortBy: sortBy,
        page: currentPage.toString(),
        limit: '12'
      })

      const response = await fetch(`/api/candidates?${params}`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
        setTotalCandidates(data.total || 0)
      } else if (response.status === 403) {
        setError('Доступ запрещен. Требуется профиль работодателя.')
      } else if (response.status === 401) {
        setError('Требуется вход. Войдите в систему и повторите попытку.')
      } else {
        setError(`Ошибка загрузки (${response.status})`)
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setError('Не удалось загрузить кандидатов')
    } finally {
      setLoading(false)
    }
  }

  const toggleSaveCandidate = (candidateId: string) => {
    setSavedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedFilters({
      skills: '',
      location: '',
      experience: '',
      availability: '',
      salary: ''
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

  const getExperienceLevel = (years: number) => {
    if (years < 2) return 'Junior'
    if (years < 5) return 'Middle'
    return 'Senior'
  }

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {candidate.avatar ? (
              <img src={candidate.avatar.startsWith('/api/') ? candidate.avatar : `/api/profile/avatar?user=${encodeURIComponent(candidate.id)}`} alt={candidate.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                {candidate.name?.charAt(0) || 'A'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-gray-900 dark:text-white text-lg mb-1 truncate cursor-pointer hover:underline"
              onClick={() => (window.location.href = `/candidates/${candidate.id}`)}
              title="Открыть профиль кандидата"
            >
              {candidate.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{candidate.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-xs text-gray-500">
                <Star className="w-3 h-3 mr-1" />
                {candidate.matchScore}%
              </div>
              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {candidate.availability}
              </Badge>
            </div>
          </div>
        </div>
        <button title={savedCandidates.includes(candidate.id) ? 'Убрать из сохранённых' : 'Сохранить кандидата'}
          onClick={() => toggleSaveCandidate(candidate.id)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
        >
          <Heart className={`w-5 h-5 ${savedCandidates.includes(candidate.id) ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
        </button>
      </div>
      
      {/* AI Match Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Совпадение</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{candidate.matchScore}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-gray-600 to-gray-800 h-2 rounded-full transition-all duration-300"
            style={{ width: `${candidate.matchScore}%` }}
          ></div>
        </div>
      </div>
      
      {/* Bio */}
      {candidate.bio && (
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm">
          {candidate.bio}
        </p>
      )}
      
      {/* Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="truncate">{candidate.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <DollarSign className="w-4 h-4 mr-2" />
          <span className="truncate">{formatSalary(candidate.salaryMin, candidate.salaryMax, candidate.currency)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Briefcase className="w-4 h-4 mr-2" />
          <span className="truncate">{getExperienceLevel(candidate.experience)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          <span className="truncate">{candidate.recentActivity}</span>
        </div>
      </div>
      
      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {candidate.skills.slice(0, 4).map((skill, index) => (
          <span key={index} className="inline-block">
            <Badge className="text-xs">{skill}</Badge>
          </span>
        ))}
        {candidate.skills.length > 4 && (
          <span className="inline-block">
            <Badge className="text-xs">+{candidate.skills.length - 4}</Badge>
          </span>
        )}
      </div>
      
      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-2xl text-xs"
              onClick={() => (window.location.href = '/chat')}
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Написать
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-2xl text-xs"
              onClick={() => (window.location.href = `/candidates/${candidate.id}?tab=resume`)}
            >
              <Download className="w-3 h-3 mr-1" />
              Резюме
            </Button>
          </div>
          
          <Button 
            size="sm"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl text-xs"
            onClick={() => (window.location.href = `/candidates/${candidate.id}?action=invite`)}
          >
            Пригласить
          </Button>
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка кандидатов...
              </h3>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // UI-заглушка для неавторизованных: позволяем войти и попробовать снова
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <X className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Требуется вход
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как работодатель, чтобы просматривать кандидатов
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/auth/signin'}
          >
            Войти как работодатель
          </Button>
        </div>
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
              <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Кандидаты
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Найдите идеальных кандидатов с помощью AI-подбора
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск кандидатов, навыков, опыта..."
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
              
              <select title="Сортировка"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              >
                <option value="match">По совпадению</option>
                <option value="experience">По опыту</option>
                <option value="salary">По зарплате</option>
                <option value="recent">По активности</option>
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
              Найдено {totalCandidates} кандидатов
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Навыки
                </label>
                <select title="Фильтр по навыкам"
                  value={selectedFilters.skills}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                >
                  <option value="">Все навыки</option>
                  {skills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Локация
                </label>
                <select title="Фильтр по локации"
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

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Опыт
                </label>
                <select title="Фильтр по опыту"
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

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Доступность
                </label>
                <select title="Фильтр по доступности"
                  value={selectedFilters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                >
                  <option value="">Любая</option>
                  {availabilities.map(availability => (
                    <option key={availability} value={availability}>{availability}</option>
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
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>

          {/* Pagination */}
          {totalCandidates > 12 && (
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
                {Array.from({ length: Math.min(5, Math.ceil(totalCandidates / 12)) }, (_, i) => i + 1).map(page => (
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCandidates / 12), prev + 1))}
                disabled={currentPage === Math.ceil(totalCandidates / 12)}
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