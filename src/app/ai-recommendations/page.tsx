'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Filter,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  Briefcase,
  Heart,
  Eye,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import aiStyles from '@/styles/ai.module.css'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AIRecommendation {
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
  reasons: string[]
  isSaved: boolean
  requirements: string[]
  benefits: string[]
  matchedSkills?: string[]
  candidateLevel?: string
  salaryMatchLabel?: string
}

export default function AIRecommendations() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const userRole = (session?.user as any)?.role === 'CANDIDATE' 
    ? 'jobseeker' 
    : (session?.user as any)?.role === 'EMPLOYER' 
      ? 'employer' 
      : null

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Получить id основного резюме для текущего пользователя
  const getDefaultResumeId = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/resumes', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const list: any[] = data?.resumes || []
        const def = list.find((r) => r?.isDefault)
        if (def?.id) return String(def.id)
        if (list.length > 0 && list[0]?.id) return String(list[0].id)
      }
    } catch {}
    return null
  }

  // Fetch AI-powered job recommendations when user is logged in
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true)
      setError(null)
      try {
        // Simulate user data based on role (server will also use session)
        const userData = userRole === 'jobseeker' ? {
          userId: 'user-123',
          skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS'],
          experience: '5+ years',
          preferences: ['Удаленная работа', 'Гибкий график', 'Развитие'],
          location: 'Moscow, Russia',
          desiredSalary: '$120k - $180k'
        } : {
          userId: 'employer-456',
          company: 'TechCorp',
          industry: 'Technology',
          teamSize: '50-100',
          culture: 'Innovative, Fast-paced',
          requirements: ['Senior developers', 'Team players', 'Problem solvers']
        }

        const resumeId = await getDefaultResumeId()
        const mapFilter = (f: string) => {
          const v = String(f).toLowerCase()
          if (v.includes('удал')) return 'remote'
          return f
        }
        const tokens = [searchQuery.trim(), ...selectedFilters.map(mapFilter)].filter(Boolean)
        const q = tokens.join(' ').trim()
        const params: string[] = []
        if (resumeId) params.push(`resumeId=${encodeURIComponent(resumeId)}`)
        if (q) params.push(`q=${encodeURIComponent(q)}`)
        const url = '/api/ai/recommendations' + (params.length ? `?${params.join('&')}` : '')
        const response = await fetch(url, { method: 'GET', cache: 'no-store' })

        if (!response.ok) {
          let message = `Failed to fetch recommendations (${response.status})`
          try {
            const data = await response.json()
            if (data?.error) message = data.error
          } catch {}
          throw new Error(message)
        }

        const payload = await response.json()
        const recs: any[] = payload?.data || payload?.recommendations || []
        const formatted: AIRecommendation[] = recs.map((r: any) => ({
          id: r.jobId || r.id,
          title: r.title || 'Вакансия',
          company: r.company || 'Компания',
          logo: (r.company?.[0] || 'C'),
          description: r.description || '',
          location: r.location || '',
          salary: r.salary || '',
          type: r.type || 'Full-time',
          experience: r.experience || '',
          remote: false,
          tags: Array.isArray(r.reasons) ? r.reasons.slice(0, 4) : [],
          posted: r.posted || '',
          views: r.views || 0,
          applications: r.applications || 0,
          isFeatured: false,
          matchScore: typeof r.matchPercentage === 'number' ? r.matchPercentage : Math.round(((r.score ?? 0) * 100)),
          reasons: Array.isArray(r.reasons) ? r.reasons : [],
          isSaved: false,
          requirements: [],
          benefits: [],
          matchedSkills: r.matchedSkills || [],
          candidateLevel: r.candidateLevel || '',
          salaryMatchLabel: r.salaryMatchLabel || ''
        }))
        setRecommendations(formatted)
      } catch (err: any) {
        console.error('Error fetching recommendations:', err)
        setError(err?.message || 'Не удалось получить рекомендации')
      } finally {
        setLoading(false)
      }
    }

    if (isLoggedIn) {
      fetchRecommendations()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn, userRole, searchQuery, selectedFilters])

  const handleSave = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, isSaved: !rec.isSaved } : rec
      )
    )
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

  const formatPosted = (iso?: string): string => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'Сегодня'
    if (diffDays === 1) return 'Вчера'
    if (diffDays < 7) return `${diffDays} дн. назад`
    return d.toLocaleDateString('ru-RU')
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <Brain className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Рекомендации
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите в систему, чтобы получить персонализированные рекомендации вакансий или кандидатов
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
              onClick={() => window.location.href = '/auth/signin'}
            >
              Войти как соискатель
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => window.location.href = '/auth/signin'}
            >
              Войти как работодатель
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Не блокируем шапку на время загрузки. Ниже отрисуем скелетоны.

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-xl mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Не удалось получить рекомендации</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-gray-900 dark:bg-white text-white dark:text-black">Повторить</Button>
            <Button variant="outline" onClick={() => (window.location.href = '/profile')}>Открыть профиль</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                AI Рекомендации
              </h1>
              <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {userRole === 'jobseeker' 
                ? 'Персонализированные вакансии, подобранные искусственным интеллектом на основе ваших навыков и предпочтений'
                : 'Идеальные кандидаты, отобранные AI для ваших вакансий'
              }
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-6">
              {/* Внешнее кольцо и мягкое свечение как на главной, но тоньше и менее ярко */}
              <div className={`${aiStyles.roundedPill} ${aiStyles.gradientBorder} ${aiStyles.glowSoft} rounded-3xl`}> 
                <div className={`${aiStyles.surface} ${aiStyles.edge} ${aiStyles.bwUltraThin} ${aiStyles.ringSoft} rounded-3xl`}> 
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={userRole === 'jobseeker' ? "Поиск по навыкам или компаниям..." : "Поиск по навыкам или опыту..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={(e) => { (e.currentTarget.closest(`.${aiStyles.surface}`) as HTMLElement)?.classList.add(aiStyles.ringVisible) }}
                      onBlur={(e) => { (e.currentTarget.closest(`.${aiStyles.surface}`) as HTMLElement)?.classList.remove(aiStyles.ringVisible) }}
                      className="pl-12 pr-4 py-3 bg-transparent border-0 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {['Удаленная работа', 'Full-time', 'Senior', 'Moscow', 'React', 'Python'].map((filter) => (
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
      </div>

      {/* Recommendations */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-gray-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI анализирует ваши данные...</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Создаем персонализированные рекомендации</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Рекомендации пока не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Обновите профиль и навыки, чтобы улучшить результаты
            </p>
          </div>
        ) : (
          <div className="grid gap-6 max-w-4xl mx-auto">
            {recommendations.map((recommendation) => (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {recommendation.logo}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {recommendation.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{recommendation.company}</p>
                      {!!(recommendation.matchedSkills && recommendation.matchedSkills.length) && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {recommendation.matchedSkills.slice(0,3).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${getMatchBg(recommendation.matchScore)} ${getMatchColor(recommendation.matchScore)}`}>
                      {recommendation.matchScore}%
                    </div>
                    {!!recommendation.salaryMatchLabel && (
                      <div className={`px-2 py-1 rounded-lg text-xs ${
                        recommendation.salaryMatchLabel.includes('выше') || recommendation.salaryMatchLabel.includes('в пределах')
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                          : recommendation.salaryMatchLabel.includes('ниже')
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {recommendation.salaryMatchLabel}
                      </div>
                    )}
                    <button
                      onClick={() => handleSave(recommendation.id)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label={recommendation.isSaved ? 'Удалить из сохраненных' : 'Сохранить вакансию'}
                      title={recommendation.isSaved ? 'Удалить из сохраненных' : 'Сохранить вакансию'}
                    >
                      <Heart className={`w-5 h-5 ${recommendation.isSaved ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {recommendation.description}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {recommendation.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-white">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {recommendation.salary}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    {recommendation.type}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    {recommendation.experience}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendation.tags.slice(0, 4).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* AI Reasons */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Почему это подходит вам:
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.reasons.slice(0, 3).map((reason, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{recommendation.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{recommendation.applications}</span>
                    </div>
                    <div className="text-xs text-gray-400">{formatPosted(recommendation.posted)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl text-sm font-medium px-6 py-2"
                      onClick={() => {
                        window.location.href = `/jobs/${recommendation.id}`
                      }}
                    >
                      Подробнее
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="rounded-2xl text-sm font-medium px-6 py-2"
                      onClick={() => {
                        window.location.href = `/jobs/${recommendation.id}?apply=1`
                      }}
                    >
                      {userRole === 'jobseeker' ? 'Откликнуться' : 'Связаться'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}