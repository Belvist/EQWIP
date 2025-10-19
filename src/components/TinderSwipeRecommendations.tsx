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
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface EmployerRecommendation {
  id: number
  company: string
  logo: string
  description: string
  industry: string
  size: string
  location: string
  rating: number
  employees: string
  revenue: string
  founded: string
  benefits: string[]
  culture: string[]
  matchScore: number
  reasons: string[]
  isSaved: boolean
  relatedJobId?: string
}

const TinderSwipeRecommendations = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [recommendations, setRecommendations] = useState<EmployerRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Simulate AI-powered recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true)
      
      try {
        // Simulate user data - in real app this would come from user profile
        const userData = {
          userId: 'user-123',
          skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS'],
          experience: '5+ years',
          preferences: ['Удаленная работа', 'Гибкий график', 'Развитие'],
          location: 'Moscow, Russia'
        }
        
        const response = await fetch('/api/ai/employer-recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }
        
        const data = await response.json()
        // ожидаем, что сервер может вернуть relatedJobId для компании
        setRecommendations(data.recommendations)
      } catch (error) {
        console.error('Error fetching recommendations:', error)
        
        // Fallback to mock data
        const mockRecommendations: EmployerRecommendation[] = [
          {
            id: 1,
            company: 'TechCorp',
            logo: 'T',
            description: 'Ведущая технологическая компания, специализирующаяся на разработке инновационных решений для бизнеса',
            industry: 'Технологии',
            size: '1000-5000',
            location: 'Moscow, Russia',
            rating: 4.8,
            employees: '2500+',
            revenue: '$500M+',
            founded: '2010',
            benefits: ['ДМС', 'Гибкий график', 'Обучение', 'Опционы', 'Офис в центре'],
            culture: ['Инновации', 'Командная работа', 'Развитие', 'Баланс работы и жизни'],
            matchScore: 95,
            reasons: [
              'Соответствие навыков React/Node.js',
              'Опыт работы с крупными проектами',
              'Готовность к релокации',
              'Интерес к корпоративной культуре'
            ],
            isSaved: false
          },
          {
            id: 2,
            company: 'DataTech',
            logo: 'D',
            description: 'Компания в области Data Science и Machine Learning, работающая над прорывными решениями',
            industry: 'Data Science',
            size: '500-1000',
            location: 'Saint Petersburg, Russia',
            rating: 4.6,
            employees: '750+',
            revenue: '$100M+',
            founded: '2018',
            benefits: ['Высокая зарплата', 'Релокационный пакет', 'Конференции', 'Гибкое начало дня'],
            culture: ['Аналитика', 'Инновации', 'Исследования', 'Профессиональный рост'],
            matchScore: 88,
            reasons: [
              'Опыт в Python и ML',
              'Академическое образование',
              'Публикации и исследования',
              'Интерес к data-driven подходам'
            ],
            isSaved: false
          },
          {
            id: 3,
            company: 'StartupHub',
            logo: 'S',
            description: 'Динамичный стартап, создающий революционные продукты для финтеха',
            industry: 'FinTech',
            size: '50-200',
            location: 'Remote, Global',
            rating: 4.4,
            employees: '120+',
            revenue: '$10M+',
            founded: '2021',
            benefits: ['Опционы', 'Удаленная работа', 'Гибкий график', 'Быстрый рост', 'Автономия'],
            culture: ['Предпринимательство', 'Инновации', 'Скорость', 'Адаптивность'],
            matchScore: 82,
            reasons: [
              'Стартап опыт',
              'Готовность к риску',
              'Мультифункциональные навыки',
              'Интерес к финтеху'
            ],
            isSaved: false
          },
          {
            id: 4,
            company: 'CloudSys',
            logo: 'C',
            description: 'Облачная инфраструктурная компания, предоставляющая решения для enterprise-клиентов',
            industry: 'Cloud/DevOps',
            size: '200-500',
            location: 'Kazan, Russia',
            rating: 4.7,
            employees: '350+',
            revenue: '$50M+',
            founded: '2015',
            benefits: ['Релокация', 'ДМС', 'Обучение', 'Оборудование', 'Конференции'],
            culture: ['Стабильность', 'Техническое совершенство', 'Клиентоориентированность', 'Развитие'],
            matchScore: 79,
            reasons: [
              'Опыт в DevOps',
              'Сертификаты AWS',
              'Enterprise опыт',
              'Интерес к облачным технологиям'
            ],
            isSaved: false
          },
          {
            id: 5,
            company: 'DesignStudio',
            logo: 'D',
            description: 'Креативное агентство, специализирующееся на цифровом дизайне и брендинге',
            industry: 'Design',
            size: '20-50',
            location: 'Moscow, Russia',
            rating: 4.5,
            employees: '35+',
            revenue: '$5M+',
            founded: '2019',
            benefits: ['Креативная среда', 'Гибкий график', 'Проектная работа', 'Портфолио', 'Нетворкинг'],
            culture: ['Креативность', 'Свобода', 'Коллаборация', 'Искусство'],
            matchScore: 75,
            reasons: [
              'Дизайн навыки',
              'Портфолио проектов',
              'Интерес к брендингу',
              'Креативный подход'
            ],
            isSaved: false
          }
        ]
        
        setRecommendations(mockRecommendations)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecommendations()
  }, [])

  const applyToRelatedJob = async (rec: EmployerRecommendation) => {
    try {
      if (!rec.relatedJobId) return
      const resp = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: rec.relatedJobId })
      })
      if (resp.ok) {
        toast({ title: 'Отклик отправлен' })
      } else if (resp.status === 401) {
        toast({ title: 'Требуется вход', description: 'Войдите как соискатель, чтобы откликаться', variant: 'destructive' })
        window.location.href = '/auth/signin'
      } else {
        let desc = 'Не удалось отправить отклик'
        try { const e = await resp.json(); desc = e?.error || desc } catch {}
        toast({ title: 'Ошибка', description: desc, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить отклик', variant: 'destructive' })
    }
  }

  const handleSwipe = (dir: 'left' | 'right') => {
    if (currentIndex >= recommendations.length) return
    
    setDirection(dir)
    
    setTimeout(() => {
      // если вправо и есть связанная вакансия — отправляем отклик
      if (dir === 'right') {
        const rec = recommendations[currentIndex]
        if (rec?.relatedJobId) {
          applyToRelatedJob(rec)
        }
      }
      setCurrentIndex(prev => prev + 1)
      setDirection(null)
    }, 300)
  }

  const handleSave = (id: number) => {
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
            AI анализирует ваш профиль...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Подбираем лучшие компании для вас
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
          Отличная работа!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Вы просмотрели все рекомендации AI
        </p>
        <Button 
          onClick={() => setCurrentIndex(0)}
          className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
        >
          Начать заново
        </Button>
      </div>
    )
  }

  const currentRecommendation = recommendations[currentIndex]

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Рекомендации
          </h3>
          <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Компании, которые идеально подходят вам
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs text-gray-500">
            {currentIndex + 1} из {recommendations.length}
          </span>
          <div className="flex gap-1">
            {recommendations.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === currentIndex ? 'bg-gray-600 dark:bg-gray-400' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tinder-like Card Container */}
      <div className="relative h-[520px] sm:h-[600px] mb-6" ref={containerRef}>
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
                <Card className="h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl rounded-3xl overflow-hidden">
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {/* логотип: если URL — показываем картинку, иначе инициал */}
                            {/^https?:\/\//.test(String(currentRecommendation.logo)) || String(currentRecommendation.logo).startsWith('/') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={String(currentRecommendation.logo)} alt={currentRecommendation.company} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                {String(currentRecommendation.logo || currentRecommendation.company?.[0] || 'C')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                              {currentRecommendation.company}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{currentRecommendation.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full flex-shrink-0 ml-2 self-start ${getMatchBg(currentRecommendation.matchScore)}`}>
                          <span className={`text-sm font-semibold ${getMatchColor(currentRecommendation.matchScore)}`}>
                            {currentRecommendation.matchScore}% match
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                        {currentRecommendation.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                          {currentRecommendation.industry}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                          {currentRecommendation.size} сотрудников
                        </span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                          <Star className="w-3 h-3 mr-1" />
                          {currentRecommendation.rating}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                          <Users className="w-4 h-4 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                          <div className="text-xs text-gray-600 dark:text-gray-400">Сотрудники</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {currentRecommendation.employees}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                          <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                          <div className="text-xs text-gray-600 dark:text-gray-400">Доход</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {currentRecommendation.revenue}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasons */}
                    <div className="px-6 pb-4 flex-1">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          Почему подходит вам
                        </h5>
                        <ul className="space-y-2">
                          {currentRecommendation.reasons.slice(0, 3).map((reason, index) => (
                            <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Преимущества
                        </h5>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentRecommendation.benefits.slice(0, 6).map((benefit, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                          >
                            {benefit}
                          </span>
                        ))}
                        {currentRecommendation.benefits.length > 6 && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">
                            +{currentRecommendation.benefits.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 sm:gap-4 mb-6">
        <Button
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" />
        </Button>
        
        <Button
          onClick={() => handleSave(currentRecommendation.id)}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-300 hover:scale-110 shadow-lg flex items-center justify-center ${
            currentRecommendation.isSaved 
              ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <Heart className={`w-6 h-6 sm:w-8 sm:h-8 ${currentRecommendation.isSaved ? 'fill-current' : ''}`} />
        </Button>
        
        <Button
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800/30 border border-gray-200 dark:border-gray-800 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
        </Button>
      </div>

      {/* Jobs Navigation Button */}
      <div className="mb-6">
        <Link href="/jobs">
          <Button
            variant="neutral"
            className="w-full rounded-3xl py-4 font-medium"
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Перейти к поиску вакансий
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        
        <div className="text-xs text-gray-500">
          Свайпайте или используйте кнопки
        </div>
        
        <Button
          variant="ghost"
          onClick={() => handleSwipe('right')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Пропустить
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

export default TinderSwipeRecommendations