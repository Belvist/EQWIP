'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  DollarSign, 
  Building,
  Users,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  MessageCircle,
  Target,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

interface JobRecommendation {
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
  skills?: string[]
  position?: string
  expectedSalary?: string
  salaryMatchLabel?: string
  candidateLevel?: string
  isMock?: boolean
}

const TinderJobSearch = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const sendFeedback = useCallback(async (jobId: string, reason: string) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, reason })
      })
    } catch {}
  }, [])
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Helpers to store locally rejected jobs (so they won't show again)
  const getRejectedJobs = (): Set<string> => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem('ai_rejected_jobs')
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      return new Set(arr)
    } catch {
      return new Set()
    }
  }
  const addRejectedJob = (jobId: string) => {
    if (typeof window === 'undefined') return
    try {
      const s = getRejectedJobs()
      s.add(jobId)
      localStorage.setItem('ai_rejected_jobs', JSON.stringify(Array.from(s)))
    } catch {}
  }

  // Fetch default resume id for current user (prefer isDefault)
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

  // Fetch already applied job ids for current user
  const fetchAppliedJobIds = async (): Promise<Set<string>> => {
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const ids = new Set<string>()
        const list: any[] = data?.applications || []
        for (const a of list) {
          const id = a?.job?.id || a?.jobId || a?.job_id
          if (id) ids.add(String(id))
        }
        return ids
      }
    } catch {}
    return new Set()
  }

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)

    try {
      const resumeId = await getDefaultResumeId()
      const qs: string[] = []
      if (searchQuery) qs.push(`q=${encodeURIComponent(searchQuery)}`)
      if (resumeId) qs.push(`resumeId=${encodeURIComponent(resumeId)}`)
      const url = '/api/ai/recommendations' + (qs.length ? `?${qs.join('&')}` : '')
      const response = await fetch(url, { method: 'GET', cache: 'no-store' })

      if (!response.ok) {
        throw new Error('Failed to fetch job recommendations')
      }

      const payload = await response.json()
      const appliedIds = await fetchAppliedJobIds()
      const recsRaw: any[] = payload?.data || payload?.recommendations || []
      const mapped: JobRecommendation[] = recsRaw.map((r: any) => ({
        id: String(r.jobId || r.id),
        title: r.title || 'Вакансия',
        company: r.company || 'Компания',
        // Пытаемся взять логотип из возможных полей API, иначе инициал
        logo: r.logoUrl || r.companyLogo || r.logo || (r.company?.[0] || 'C'),
        description: r.description || '',
        location: r.location || '',
        salary: r.salary || '',
        type: r.type || 'Full-time',
        experience: r.experience || '',
        remote: false,
        tags: Array.isArray(r.reasons) && r.reasons.length ? r.reasons.slice(0, 4) : [],
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
        skills: r.skills || [],
        position: r.position || '',
        expectedSalary: r.expectedSalary || '',
        salaryMatchLabel: r.salaryMatchLabel || '',
        candidateLevel: r.candidateLevel || '',
        isMock: false,
      }))
      const rejected = getRejectedJobs()
      const filtered = mapped.filter((r) => !rejected.has(r.id) && !appliedIds.has(r.id))
      setRecommendations(filtered.length > 0 ? filtered : mapped)
    } catch (error) {
      console.error('Error fetching job recommendations:', error)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  // Fetch AI-powered job recommendations on mount and when query changes
  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const applyToJob = async (rec: JobRecommendation) => {
    try {
      if (rec.isMock) {
        toast({ title: 'Демо карточка', description: 'Войдите, чтобы получать реальные вакансии и отправлять отклики' })
        return
      }
      const resumeId = await getDefaultResumeId()
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: rec.id, ...(resumeId ? { resumeId } : {}) })
      })
      if (response.ok) {
        toast({ title: 'Отклик отправлен' })
        // Уберем вакансию из списка, чтобы не показывать повторно
        setRecommendations(prev => prev.filter((j, idx) => j.id !== rec.id || idx !== currentIndex))
      } else if (response.status === 401) {
        toast({ title: 'Требуется вход', description: 'Войдите как соискатель, чтобы откликаться', variant: 'destructive' })
        window.location.href = '/auth/signin'
      } else {
        let desc = 'Не удалось отправить отклик'
        try { const err = await response.json(); desc = err?.error || desc } catch {}
        toast({ title: 'Ошибка', description: desc, variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить отклик', variant: 'destructive' })
    }
  }

  const handleSwipe = async (dir: 'left' | 'right') => {
    if (currentIndex >= recommendations.length) return
    
    const current = recommendations[currentIndex]
    setDirection(dir)

    // Perform action based on swipe direction
    if (dir === 'right') {
      await applyToJob(current)
    } else {
      addRejectedJob(current.id)
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setDirection(null)
    }, 300)
  }

  const handleSave = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, isSaved: !rec.isSaved } : rec
      )
    )
  }

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-gray-700 dark:text-gray-300'
    if (score >= 80) return 'text-gray-600 dark:text-gray-400'
    return 'text-gray-500 dark:text-gray-500'
  }

  const getMatchBg = (score: number) => {
    if (score >= 90) return 'bg-gray-200 dark:bg-gray-800'
    if (score >= 80) return 'bg-gray-100 dark:bg-gray-900'
    return 'bg-gray-50 dark:bg-gray-950'
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            AI подбирает вакансии...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Анализируем ваши навыки и предпочтения
          </p>
        </div>
      </div>
    )
  }

  if (currentIndex >= recommendations.length) {
    return (
      <div className="w-full max-w-md mx-auto p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Подходящих вакансий не найдено
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Сейчас нет вакансий, которые хорошо совпадают с вашим резюме. Попробуйте обновить фильтры или уточнить ключевые навыки.
        </p>
        <Button 
          onClick={() => { setCurrentIndex(0); fetchRecommendations() }}
          style={{ backgroundColor: '#4f46e5', color: 'white' }}
          className="hover:opacity-90"
        >
          Обновить рекомендации
        </Button>
      </div>
    )
  }

  const currentRecommendation = recommendations[currentIndex]

  const getRingColor = (score: number) => {
    if (score >= 80) return 'text-gray-700 dark:text-gray-300'
    if (score >= 60) return 'text-amber-500'
    return 'text-gray-400'
  }

  const sanitizeLine = (text: string): string => {
    if (!text) return ''
    let t = String(text)
    // Удаляем тех. ярлыки и пустые маркеры
    t = t.replace(/\b(Позиция|Навыки|Совпадение по навыкам|Рекомендуем подтянуть|Уровень|Локация|Зарплата)\s*:?\s*/gi, '')
    t = t.replace(/—/g, '').replace(/\s{2,}/g, ' ')
    // Берём первую осмысленную фразу
    const first = t.split(/(?<=[\.!?])\s+/).find((s) => s && s.trim().length > 0) || t
    return first.trim()
  }

  const summarize = (reasons?: string[], desc?: string) => {
    const base = (reasons && reasons.length > 0 ? reasons[0] : (desc || ''))
    let s = sanitizeLine(base)
    if (s.length > 130) s = s.slice(0, 127).trim() + '…'
    return s
  }

  // Derived UI helpers for the redesigned card
  const allSkills: string[] = Array.from(
    new Set([...(currentRecommendation.skills || []), ...(currentRecommendation.matchedSkills || [])])
  ).slice(0, 6)
  const isMatched = (s: string) =>
    (currentRecommendation.matchedSkills || []).some((m) => String(m).toLowerCase() === String(s).toLowerCase())

  const skillsPct: number = (() => {
    const explicit = (currentRecommendation as any)?.skillMatchPct
    if (typeof explicit === 'number' && Number.isFinite(explicit)) return Math.max(0, Math.min(100, Math.round(explicit)))
    const total = Math.max(1, (currentRecommendation.skills || []).length)
    const matched = Math.max(0, (currentRecommendation.matchedSkills || []).length)
    return Math.max(0, Math.min(100, Math.round((matched / total) * 100)))
  })()

  const levelLabel = currentRecommendation.candidateLevel && currentRecommendation.experience
    ? `${String(currentRecommendation.candidateLevel)} → ${String(currentRecommendation.experience)}`
    : (currentRecommendation.candidateLevel || currentRecommendation.experience || '—')

  const matchedTop = (currentRecommendation.matchedSkills || []).slice(0, 2).join(', ')
  const salaryHint = currentRecommendation.salaryMatchLabel
    ? currentRecommendation.salaryMatchLabel
    : (currentRecommendation.salary ? `Предложение: ${currentRecommendation.salary}` : '')
  const probabilityLabel = (() => {
    const score = currentRecommendation.matchScore || 0
    const m = (currentRecommendation.matchedSkills || []).length
    if (score >= 80 && m >= 2) return 'высокая'
    if (score >= 60) return 'средняя'
    return 'умеренная'
  })()

  const employmentType: string = (() => {
    const t = (currentRecommendation.type || '').toLowerCase()
    if (!t) return ''
    if (t.includes('full')) return 'Полная занятость'
    if (t.includes('part')) return 'Частичная занятость'
    if (t.includes('contract')) return 'Контракт'
    if (t.includes('intern')) return 'Стажировка'
    if (t.includes('remote')) return 'Удаленно'
    return currentRecommendation.type
  })()

  // Определяем, является ли строка источником изображения
  const isImageSrc = (v: string | undefined): boolean => {
    if (!v) return false
    const s = String(v)
    return /^(https?:)?\/\//.test(s) || s.startsWith('/') || /\.(png|jpe?g|svg|webp)$/i.test(s)
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

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Поиск вакансий
          </h3>
          <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Свайпайте вакансии, подобранные специально для вас
        </p>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Поиск по навыкам или компаниям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
          />
          <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500">
            {currentIndex + 1} из {recommendations.length}
          </span>
          <div className="flex gap-1">
            {recommendations.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === currentIndex ? '' : 'bg-gray-300 dark:bg-gray-700'
                }`}
                style={index === currentIndex ? { backgroundColor: '#4f46e5' } : {}}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tinder-like Card Container */}
      <div className="relative h-[560px] sm:h-[600px] mb-6" ref={containerRef}>
        <AnimatePresence mode="wait">
          {currentIndex < recommendations.length && (
            <motion.div
              key={recommendations[currentIndex].id}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                rotate: direction ? (direction === 'right' ? 10 : -10) : 0,
                x: direction ? (direction === 'right' ? 200 : -200) : 0
              }}
              exit={{ scale: 0.8, opacity: 0, y: -100 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.3
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipeThreshold = 50
                const swipeConfidenceThreshold = 10000
                const swipePower = Math.abs(offset.x) * velocity.x
                  
                if (swipePower > swipeConfidenceThreshold) {
                  handleSwipe(offset.x > 0 ? 'right' : 'left')
                } else if (Math.abs(offset.x) > swipeThreshold) {
                  handleSwipe(offset.x > 0 ? 'right' : 'left')
                }
              }}
            >
                <Link href={`/jobs/${currentRecommendation.id}`} onClick={(e) => {
                  // Prevent navigation if user is swiping
                  if (direction) {
                    e.preventDefault();
                  }
                }}>
                  <Card className="h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl rounded-3xl overflow-hidden cursor-pointer">
                    <CardContent className="p-0 h-full flex flex-col">
                    {/* Header */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between mb-4">
                        <div className="grid grid-cols-[3.5rem,1fr] gap-x-3 gap-y-0 items-start flex-1">
                          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {isImageSrc(String(currentRecommendation.logo)) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={String(currentRecommendation.logo)} alt={currentRecommendation.company} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                {String(currentRecommendation.logo || currentRecommendation.company?.[0] || 'C')}
                              </span>
                            )}
                          </div>
                          <div className="col-start-2 min-w-0">
                            <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
                              {currentRecommendation.company}
                            </span>
                            {currentRecommendation.location && (
                              <div className="mt-0 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{currentRecommendation.location}</span>
                              </div>
                            )}
                          </div>
                          <h4 className="mt-1 text-xl font-extrabold text-gray-900 dark:text-white line-clamp-2 col-span-2">
                            {currentRecommendation.title}
                          </h4>
                          {!!employmentType && (
                            <div className="col-span-2 mt-2 inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="leading-none truncate">{employmentType}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2 self-start mt-0.5">
                          <div className="relative w-12 h-12">
                            <svg viewBox="0 0 36 36" className="w-12 h-12">
                              <defs>
                                <linearGradient id="gMatch" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#84cc16" />
                                </linearGradient>
                              </defs>
                              <path d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
                              <path d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32" fill="none" stroke="url(#gMatch)" strokeWidth="4" strokeDasharray={`${Math.max(0, Math.min(100, currentRecommendation.matchScore))} 100`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-700 dark:text-gray-300">
                              {currentRecommendation.matchScore}%
                            </div>
                          </div>
                        </div>
                      </div>
                      {allSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {allSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                                isMatched(s)
                                  ? ''
                                  : ''
                              }`}
                              style={{ backgroundColor: isMatched(s) ? '#4f46e5' : '#dc2626' }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="rounded-2xl mb-3 px-4 py-3 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-sm leading-relaxed">
                        {summarize(currentRecommendation.reasons, currentRecommendation.description)}
                      </div>

                      {/* Дополнительные причины — выводим ниже панели совпадения */}
                    </div>

                    {/* Пилюли уровня/локации и небольшая плашка зарплаты — как в макете */}
                    <div className="px-6 pb-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                          <Briefcase className="w-4 h-4" />
                          <span className="truncate">{levelLabel}</span>
                        </span>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-white" style={{ backgroundColor: '#4f46e5' }}>
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{currentRecommendation.location || '—'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="px-6 pb-3">
                      {!!currentRecommendation.salary && (
                        <div className="inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-semibold" style={{ backgroundColor: '#dc2626' }}>
                          <DollarSign className="w-4 h-4 mr-1" />
                          {currentRecommendation.salary}
                        </div>
                      )}
                    </div>

                    {/* Skills match panel */}
                    <div className="px-6 pb-3">
                      <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm leading-relaxed flex items-center justify-between">
                        <div>
                          <div className="font-semibold mb-1">Совпадение по навыкам</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{matchedTop || '—'}</div>
                        </div>
                        <div className="text-right text-lg font-bold text-gray-700 dark:text-gray-300 w-14">{skillsPct}%</div>
                      </div>
                    </div>
                    {/* Дополнительные причины из LLM (без дублирования) */}
                    {!!(currentRecommendation.reasons && currentRecommendation.reasons.length > 0) && (
                      <div className="px-6 pb-3">
                        <div className="space-y-1">
                          {Array.from(new Set(currentRecommendation.reasons as string[])).slice(0,2).map((reason, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">{sanitizeLine(reason)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Match Reasons — скрыто, чтобы не дублировать блок совпадения */}

                    {/* Gaps — скрыто для чистого макета */}

                    {/* Stats */}
                    <div className="px-6 pb-5 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">{currentRecommendation.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{currentRecommendation.applications}</span>
                          </div>
                          <div className="text-xs text-gray-400">{formatPosted(currentRecommendation.posted)}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(currentRecommendation.id)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Heart className={`w-5 h-5 ${currentRecommendation.isSaved ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Link href={`/jobs/${currentRecommendation.id}`}>
                          <Button variant="neutral" className="w-full rounded-2xl" style={{ backgroundColor: '#4f46e5', color: 'white' }}>
                            Подробнее
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            onClick={() => { if (recommendations[currentIndex]) sendFeedback(recommendations[currentIndex].id, 'not_interested'); handleSwipe('left') }}
            className="w-16 h-16 rounded-full text-white shadow-lg"
            style={{ backgroundColor: '#dc2626' }}
          >
            <X className="w-8 h-8" />
          </Button>
          <Button
            onClick={() => { if (recommendations[currentIndex]) sendFeedback(recommendations[currentIndex].id, 'stack_mismatch'); handleSwipe('left') }}
            variant="outline"
            className="h-10 rounded-2xl text-xs px-3 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >Стек</Button>
          <Button
            onClick={() => { if (recommendations[currentIndex]) sendFeedback(recommendations[currentIndex].id, 'salary_low'); handleSwipe('left') }}
            variant="outline"
            className="h-10 rounded-2xl text-xs px-3 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >Зарплата</Button>
          <Button
            onClick={() => { if (recommendations[currentIndex]) sendFeedback(recommendations[currentIndex].id, 'location_issue'); handleSwipe('left') }}
            variant="outline"
            className="h-10 rounded-2xl text-xs px-3 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >Локация</Button>
        </div>

        <Button
          onClick={() => { if (recommendations[currentIndex]) sendFeedback(recommendations[currentIndex].id, 'interested'); handleSwipe('right') }}
          className="w-16 h-16 rounded-full text-white shadow-lg"
          style={{ backgroundColor: '#4f46e5' }}
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>

      {/* Hints */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Свайпайте влево чтобы пропустить, вправо чтобы сохранить
        </p>
      </div>
    </div>
  )
}

export default TinderJobSearch