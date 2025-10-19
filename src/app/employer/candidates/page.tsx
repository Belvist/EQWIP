'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  DollarSign,
  Calendar,
  MessageSquare,
  Heart,
  Eye,
  Star,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Target,
  ArrowRight,
  Download,
  RefreshCw,
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'

interface Candidate {
  id: number
  name: string
  title: string
  location: string
  salary: string
  experience: string
  experienceYears?: number
  skills: string[]
  avatar: string
  matchScore: number
  lastActive: string
  views: number
  saved: boolean
  availability: 'available' | 'busy' | 'not-looking'
  education: string
  bio: string
  languages: string[]
  portfolio: string
}

interface EmployerJob {
  id: string
  title: string
}

export default function EmployerCandidates() {
  const { data: session, status } = useSession()
  const userRole = (session?.user as any)?.role === 'EMPLOYER' ? 'employer' : (session?.user as any)?.role === 'CANDIDATE' ? 'jobseeker' : null
  const isLoggedIn = status === 'authenticated'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'match' | 'experience' | 'recent'>('match')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<EmployerJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [filterSkills, setFilterSkills] = useState<string>('')
  const [filterLocation, setFilterLocation] = useState<string>('')
  const [filterExperience, setFilterExperience] = useState<'any' | '0-1' | '1-3' | '3-5' | '5+'>('any')

  // Загрузка вакансий работодателя
  useEffect(() => {
    const loadJobs = async () => {
      if (!(isLoggedIn && userRole === 'employer')) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/profile/employer', { cache: 'no-store' })
        if (!res.ok) throw new Error('EMPLOYER_PROFILE_HTTP_' + res.status)
        const data = await res.json()
        const js = Array.isArray(data?.jobs) ? data.jobs : []
        const mapped: EmployerJob[] = js.map((j: any) => ({ id: j.id, title: j.title }))
        setJobs(mapped)
        if (mapped.length > 0) setSelectedJobId(mapped[0].id)
      } catch (e) {
        console.error('Employer jobs load error:', e)
        setJobs([])
        setError('Не удалось загрузить ваши вакансии')
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [isLoggedIn, userRole])

  const loadRecommendations = async (jobId: string) => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/employer-recommendations-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, limit: 20 })
      })
      if (!res.ok) throw new Error('RECS_HTTP_' + res.status)
      const data = await res.json()
      console.log('AI recommendations response:', data)
      const recs: any[] = Array.isArray(data?.recommendations) ? data.recommendations : []
      console.log('Parsed recommendations:', recs)
      const list: Candidate[] = recs.map((r: any, idx: number) => {
        const c = r.candidate || {}
        const user = c.user || {}
        const name: string = user.name || user.email?.split('@')[0] || 'Кандидат'
        const salaryMin = c.salaryMin ?? null
        const salaryMax = c.salaryMax ?? null
        const currency = c.currency || ''
        const salary = (salaryMin != null || salaryMax != null)
          ? `${salaryMin ?? ''}${salaryMin ? '–' : ''}${salaryMax ?? ''} ${currency}`.trim()
          : '—'
        const expYearsNum: number | undefined = typeof c.experience === 'number'
          ? c.experience
          : (() => { const m = String(c.experience || '').match(/\d+/); return m ? Number(m[0]) : undefined })()
        const expStr = typeof expYearsNum === 'number' ? `${expYearsNum} лет` : (c.experience || '')
        const skills: string[] = Array.isArray(c.skills) ? (c.skills.map((s: any) => s?.skill?.name).filter(Boolean)) : []
        const matchScore: number = typeof r.matchPercentage === 'number' ? r.matchPercentage : Math.round((r.score || 0) * 100)
        const educArr: string[] = Array.isArray(c.education)
          ? c.education.map((e: any) => [e?.institution, e?.degree, e?.field].filter(Boolean).join(', ')).filter(Boolean)
          : []
        const langsArr: string[] = Array.isArray(c.languages)
          ? c.languages.map((l: any) => [l?.name, l?.level].filter(Boolean).join(' ')).filter(Boolean)
          : []
        return {
          id: idx + 1,
          name,
          title: c.title || 'Разработчик',
          location: c.location || '—',
          salary,
          experience: expStr || '—',
          experienceYears: expYearsNum,
          skills,
          avatar: (name || 'U').split(' ').map((p: string) => p[0]).join('').slice(0,2).toUpperCase(),
          matchScore: Number.isFinite(matchScore) ? matchScore : 0,
          lastActive: user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleDateString('ru-RU') : 'Активен недавно',
          views: 0,
          saved: false,
          availability: 'available',
          education: educArr[0] || '—',
          bio: c.bio || '',
          languages: langsArr.length ? langsArr : ['Русский'],
          portfolio: c.resumeUrl || ''
        }
      })
      setCandidates(list)
    } catch (e) {
      console.error('Recommendations load error:', e)
      setCandidates([])
      setError('Не удалось получить AI‑рекомендации')
    } finally {
      setLoading(false)
    }
  }

  // Запрашиваем рекомендации при выборе вакансии
  useEffect(() => {
    if (selectedJobId) {
      loadRecommendations(selectedJobId)
    }
  }, [selectedJobId])

  const visibleCandidates = useMemo(() => {
    const skillsWanted = filterSkills
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    const bySkills = (cand: Candidate) => {
      if (skillsWanted.length === 0) return true
      const have = cand.skills.map(s => s.toLowerCase())
      return skillsWanted.every(w => have.some(h => h.includes(w)))
    }
    const byLocation = (cand: Candidate) => {
      if (!filterLocation.trim()) return true
      return String(cand.location || '').toLowerCase().includes(filterLocation.trim().toLowerCase())
    }
    const byExperience = (cand: Candidate) => {
      if (filterExperience === 'any') return true
      const y = typeof cand.experienceYears === 'number' ? cand.experienceYears : (() => {
        const m = String(cand.experience || '').match(/\d+/)
        return m ? Number(m[0]) : 0
      })()
      switch (filterExperience) {
        case '0-1': return y >= 0 && y < 1
        case '1-3': return y >= 1 && y < 3
        case '3-5': return y >= 3 && y < 5
        case '5+': return y >= 5
        default: return true
      }
    }
    let arr = candidates.filter(c => bySkills(c) && byLocation(c) && byExperience(c))
    if (sortBy === 'match') arr = arr.sort((a, b) => (b.matchScore - a.matchScore))
    else if (sortBy === 'experience') arr = arr.sort((a, b) => ((b.experienceYears || 0) - (a.experienceYears || 0)))
    else if (sortBy === 'recent') arr = arr // можно расширить при появлении реального поля
    return arr
  }, [candidates, filterSkills, filterLocation, filterExperience, sortBy])

  const handleSave = (id: number) => {
    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === id ? { ...candidate, saved: !candidate.saved } : candidate
      )
    )
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'busy': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'not-looking': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Открыт к предложениям'
      case 'busy': return 'Занят, но рассматривает'
      case 'not-looking': return 'Не ищет работу'
      default: return 'Неизвестно'
    }
  }

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-gray-600 dark:text-gray-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getMatchBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 80) return 'bg-gray-100 dark:bg-gray-900/20'
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-gray-100 dark:bg-gray-900/20'
  }

  if (!isLoggedIn || userRole !== 'employer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Поиск кандидатов
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как работодатель, чтобы получить доступ к базе кандидатов и AI-рекомендациям
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => (window.location.href = '/auth/signin')}
          >
            Войти как работодатель
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            AI подбирает кандидатов...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Анализируем ваши требования и ищем идеальных кандидатов
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Кандидаты
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Найдите идеальных кандидатов для ваших вакансий с помощью AI
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Экспорт
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2" onClick={() => selectedJobId && loadRecommendations(selectedJobId)}>
                <RefreshCw className="w-4 h-4" />
                Обновить
              </Button>
            </div>
          </div>

          {/* Job selector */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Вакансия:</span>
            {jobs.length > 0 ? (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Нет активных вакансий. <a href="/employer/jobs/create" className="underline">Создайте вакансию</a>
              </div>
            )}
            {jobs.length > 0 && (
              <Button size="sm" className="gap-2" onClick={() => selectedJobId && loadRecommendations(selectedJobId)}>
                Запустить AI‑подбор
                <Zap className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Search and Filters (опционально) */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск по навыкам, должности, локации..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              >
                <option value="match">По совпадению</option>
                <option value="experience">По опыту</option>
                <option value="recent">По дате</option>
              </select>
            </div>
          </div>

          {/* Inline filters: skills, location, experience */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Input
              type="text"
              placeholder="Скиллы (через запятую): react, node, sql"
              value={filterSkills}
              onChange={(e) => setFilterSkills(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500"
            />
            <Input
              type="text"
              placeholder="Локация: Moscow, Remote"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500"
            />
            <select
              value={filterExperience}
              onChange={(e) => setFilterExperience(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
            >
              <option value="any">Опыт: любой</option>
              <option value="0-1">0–1 год</option>
              <option value="1-3">1–3 года</option>
              <option value="3-5">3–5 лет</option>
              <option value="5+">5+ лет</option>
            </select>
            </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['React', 'TypeScript', 'Remote', 'Senior', 'Moscow'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilters(prev => 
                  prev.includes(filter) 
                    ? prev.filter(f => f !== filter)
                    : [...prev, filter]
                )}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilters.includes(filter)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {visibleCandidates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Кандидаты скоро появятся
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Наш AI анализирует ваши требования и скоро предложит лучших кандидатов. Попробуйте изменить фильтры.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {visibleCandidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                          {candidate.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {candidate.name}
                          </h3>
                          <Badge className={getAvailabilityColor(candidate.availability)}>
                            {getAvailabilityText(candidate.availability)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {candidate.title}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {candidate.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {candidate.salary}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {candidate.experience}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`text-right ${getMatchColor(candidate.matchScore)}`}>
                        <div className="text-2xl font-bold">
                          {candidate.matchScore}%
                        </div>
                        <div className="text-xs">
                          совпадение
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleSave(candidate.id)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Heart className={`w-5 h-5 ${candidate.saved ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Match Score Bar */}
                  <div className={`mb-4 p-3 rounded-2xl ${getMatchBg(candidate.matchScore)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className={`w-4 h-4 ${getMatchColor(candidate.matchScore)}`} />
                      <span className={`text-sm font-semibold ${getMatchColor(candidate.matchScore)}`}>
                        Совпадение {candidate.matchScore}% с вашими требованиями
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          candidate.matchScore >= 90 ? 'bg-green-500' :
                          candidate.matchScore >= 80 ? 'bg-gray-500' :
                          candidate.matchScore >= 70 ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${candidate.matchScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {candidate.bio}
                  </p>

                  {/* Skills */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Ключевые навыки:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 6).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.skills.length - 6}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Образование
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {candidate.education}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Языки
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {candidate.languages.join(', ')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Активность
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {candidate.lastActive}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{candidate.views}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {candidate.lastActive}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Написать
                      </Button>
                      
                      <Button 
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl text-sm font-medium px-6 py-2 gap-2"
                      >
                        Пригласить
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}