'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  Users, 
  Briefcase, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Building,
  TrendingUp,
  Shield,
  Headphones,
  BarChart3,
  Database,
  MessageSquare,
  Target,
  Award,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/contexts/UserContext'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

interface PricingPlan {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
  popular: boolean
  highlighted: boolean
  cta: string
  icon: React.ReactNode
  color: string
  limits: {
    jobs: number
    candidates: number
    teamMembers: number
    support: string
  }
}

export default function EmployerPricing() {
  const { userRole, isLoggedIn } = useUser()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const pricingPlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: '₽9,999',
      period: '/месяц',
      description: 'Идеально для небольших компаний и стартапов',
      features: [
        '5 активных вакансий',
        'Доступ к базе резюме',
        'Базовая аналитика',
        'Email-поддержка',
        'Брендирование компании',
        'Базовые AI-рекомендации'
      ],
      popular: false,
      highlighted: false,
      cta: 'Начать бесплатно',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-gray-100 dark:bg-gray-800',
      limits: {
        jobs: 5,
        candidates: 50,
        teamMembers: 2,
        support: 'Email'
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '₽24,999',
      period: '/месяц',
      description: 'Для растущих компаний с активным наймом',
      features: [
        '20 активных вакансий',
        'Полный доступ к базе резюме',
        'Продвинутая аналитика',
        'Приоритетная поддержка',
        'AI-сопоставление кандидатов',
        'Интеграция с ATS',
        'Кастомные отчеты',
        'API доступ'
      ],
      popular: true,
      highlighted: true,
      cta: 'Популярный выбор',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-gray-200 dark:bg-gray-700',
      limits: {
        jobs: 20,
        candidates: 200,
        teamMembers: 5,
        support: 'Priority'
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₽49,999',
      period: '/месяц',
      description: 'Для крупных компаний с большими потребностями в найме',
      features: [
        'Безлимитные вакансии',
        'Полный доступ ко всем функциям',
        'Персональный менеджер',
        'Кастомные интеграции',
        'Dedicated support',
        'AI-оптимизация найма',
        'White-label решение',
        'SLA гарантии',
        'Обучение команды'
      ],
      popular: false,
      highlighted: false,
      cta: 'Связаться с нами',
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-gray-300 dark:bg-gray-600',
      limits: {
        jobs: -1,
        candidates: -1,
        teamMembers: -1,
        support: 'Dedicated'
      }
    }
  ]

  const features = [
    {
      icon: <Database className="w-8 h-8" />,
      title: 'База резюме',
      description: 'Доступ к тысячам проверенных кандидатов с подробными профилями и навыками'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'AI-сопоставление',
      description: 'Умные алгоритмы подбирают идеальных кандидатов для ваших вакансий'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Аналитика и отчеты',
      description: 'Подробная аналитика по эффективности найма и ROI'
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Коммуникации',
      description: 'Встроенная система коммуникаций с кандидатами'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Безопасность',
      description: 'Защита данных и соответствие требованиям GDPR'
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: 'Поддержка 24/7',
      description: 'Круглосуточная поддержка и обучение вашей команды'
    }
  ]

  const getYearlyPrice = (monthlyPrice: string) => {
    const price = parseInt(monthlyPrice.replace(/[^\d]/g, ''))
    const yearly = Math.floor(price * 10) // 2 months free
    return `₽${yearly.toLocaleString()}`
  }

  const isEmployer = ((session as any)?.user?.role === 'EMPLOYER') || (userRole === 'employer')

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.plan) setCurrentPlan(data.plan)
        }
      } catch {}
    }
    if (isEmployer) fetchSubscription()
  }, [isEmployer])

  if (!isEmployer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <Star className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Тарифы для работодателей
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как работодатель, чтобы выбрать подходящий тариф и начать поиск кандидатов
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

  const mapPlanIdToEnum = (id: string): 'BASIC' | 'PREMIUM' | 'ENTERPRISE' => {
    if (id === 'starter') return 'BASIC'
    if (id === 'professional') return 'PREMIUM'
    return 'ENTERPRISE'
  }

  const selectPlan = async (planId: string) => {
    const planEnum = mapPlanIdToEnum(planId)
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planEnum, period: billingPeriod, returnUrl: '/employer/pricing/return' })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.confirmationUrl) {
          window.location.href = data.confirmationUrl
          return
        }
      }
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Ошибка оплаты', description: err.message || 'Не удалось создать платёж', variant: 'destructive' })
    } catch (e) {
      toast({ title: 'Ошибка сети', description: 'Повторите попытку позже', variant: 'destructive' })
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Тарифные планы
              </h1>
              <Crown className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Выберите идеальный план для вашего бизнеса. Все тарифы включают доступ к AI-рекомендациям и базе кандидатов
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Ежемесячно
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Переключить период оплаты"
              title="Переключить период оплаты"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Ежегодно
              <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Сэкономьте 20%
              </Badge>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${plan.highlighted ? 'lg:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2">
                      <Star className="w-4 h-4 mr-1" />
                      Популярный выбор
                    </Badge>
                  </div>
                )}

                <Card className={`h-full ${plan.highlighted ? 'ring-2 ring-gray-400 dark:ring-gray-600 bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-black'} border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden`}>
                  <CardContent className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className={`w-16 h-16 ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <div className="text-gray-700 dark:text-gray-300">
                          {plan.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {plan.description}
                      </p>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {billingPeriod === 'yearly' ? getYearlyPrice(plan.price) : plan.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {billingPeriod === 'yearly' ? '/год' : plan.period}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button 
                      size="lg"
                      className={`w-full rounded-2xl py-4 text-lg font-semibold ${
                        plan.highlighted 
                          ? 'btn-glass-dark text-white'
                          : 'bg-white/10 dark:bg-white/10 text-white border border-white/15 hover:bg-white/20'
                      }`}
                      disabled={currentPlan === mapPlanIdToEnum(plan.id) || loadingPlan === plan.id}
                      onClick={() => selectPlan(plan.id)}
                    >
                      {currentPlan === mapPlanIdToEnum(plan.id) ? 'Текущий план' : plan.cta}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Все тарифы включают
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-600 dark:text-gray-400">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-black rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
              Сравнение тарифов
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">
                      Функция
                    </th>
                    {pricingPlans.map((plan) => (
                      <th key={plan.id} className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      Активные вакансии
                    </td>
                    {pricingPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-4 px-4 text-gray-700 dark:text-gray-300">
                        {plan.limits.jobs === -1 ? 'Безлимит' : plan.limits.jobs}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      Доступ к кандидатам
                    </td>
                    {pricingPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-4 px-4 text-gray-700 dark:text-gray-300">
                        {plan.limits.candidates === -1 ? 'Безлимит' : plan.limits.candidates}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      Члены команды
                    </td>
                    {pricingPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-4 px-4 text-gray-700 dark:text-gray-300">
                        {plan.limits.teamMembers === -1 ? 'Безлимит' : plan.limits.teamMembers}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      Поддержка
                    </td>
                    {pricingPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-4 px-4 text-gray-700 dark:text-gray-300">
                        {plan.limits.support}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      AI-рекомендации
                    </td>
                    {pricingPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Готовы начать находить лучших кандидатов?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Присоединяйтесь к тысячам компаний, которые уже используют EQWIP
            </p>
            <Button 
              size="lg"
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 px-12 py-4 text-lg font-semibold rounded-3xl"
            >
              Начать сейчас
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}