'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  Phone,
  ChevronRight,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Settings,
  Shield,
  CreditCard,
  Briefcase,
  User,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'

interface FAQItem {
  question: string
  answer: string
  category: string
  icon: React.ReactNode
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const faqItems: FAQItem[] = [
    {
      question: 'Как создать аккаунт на EQWIP?',
      answer: 'Чтобы создать аккаунт, нажмите кнопку "Войти" в правом верхнем углу, затем выберите "Регистрация". Заполните необходимую информацию: email, пароль, выберите роль (соискатель или работодатель) и подтвердите email.',
      category: 'account',
      icon: <User className="w-5 h-5" />
    },
    {
      question: 'Как разместить вакансию?',
      answer: 'Для размещения вакансии войдите как работодатель, перейдите в раздел "Разместить вакансию" в меню или на главной странице. Заполните форму с информацией о вакансии, требованиях, условиях работы и нажмите "Разместить вакансию".',
      category: 'employer',
      icon: <Briefcase className="w-5 h-5" />
    },
    {
      question: 'Как создать резюме?',
      answer: 'Перейдите в раздел "Мои резюме" в личном кабинете и нажмите "Создать резюме". Заполните информацию о себе: контактные данные, опыт работы, образование, навыки. Вы можете создать несколько резюме для разных специальностей.',
      category: 'jobseeker',
      icon: <FileText className="w-5 h-5" />
    },
    {
      question: 'Как работают AI-рекомендации?',
      answer: 'Наш AI анализирует ваш профиль, навыки, опыт и предпочтения, чтобы предложить наиболее подходящие вакансии или кандидатов. Система постоянно обучается на основе ваших действий и обратной связи.',
      category: 'ai',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      question: 'Как оплатить тарифный план?',
      answer: 'Перейдите в раздел "Тарифы", выберите подходящий план и нажмите "Подписаться". Вы сможете оплатить банковской картой, электронными платежами или по счету для юридических лиц.',
      category: 'billing',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      question: 'Как изменить настройки профиля?',
      answer: 'В личном кабинете перейдите в раздел "Настройки профиля". Здесь вы можете изменить личную информацию, настройки уведомлений, конфиденциальность и другие параметры.',
      category: 'account',
      icon: <Settings className="w-5 h-5" />
    },
    {
      question: 'Как удалить аккаунт?',
      answer: 'Для удаления аккаунта обратитесь в нашу службу поддержки через форму обратной связи. Удаление аккаунта необратимо, все ваши данные будут удалены в течение 30 дней.',
      category: 'account',
      icon: <Shield className="w-5 h-5" />
    },
    {
      question: 'Как связаться с поддержкой?',
      answer: 'Вы можете связаться с нами через форму обратной связи на этой странице или по email support@eqwip.ru. Мы ответим в течение 24 часов.',
      category: 'support',
      icon: <MessageCircle className="w-5 h-5" />
    }
  ]

  const categories = [
    { id: 'all', name: 'Все категории', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'account', name: 'Аккаунт', icon: <User className="w-4 h-4" /> },
    { id: 'jobseeker', name: 'Соискатели', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'employer', name: 'Работодатели', icon: <Users className="w-4 h-4" /> },
    { id: 'ai', name: 'AI-функции', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'billing', name: 'Оплата', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'support', name: 'Поддержка', icon: <MessageCircle className="w-4 h-4" /> }
  ]

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const quickActions = [
    { title: 'Создать резюме', href: '/resumes/create', icon: <FileText className="w-5 h-5" /> },
    { title: 'Разместить вакансию', href: '/post-job', icon: <Briefcase className="w-5 h-5" /> },
    { title: 'AI-рекомендации', href: '/ai-recommendations', icon: <Sparkles className="w-5 h-5" /> },
    { title: 'Тарифные планы', href: '/pricing', icon: <CreditCard className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Помощь
            </h1>
            <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Найдите ответы на частые вопросы или обратитесь в нашу службу поддержки
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                      <div className="text-gray-700 dark:text-gray-300">
                        {action.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Быстрый доступ
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск по вопросам и ответам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-3xl"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Категории
              </h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Частые вопросы
              </h2>
              
              {filteredFAQs.length === 0 ? (
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8 text-center">
                  <CardContent className="p-0">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Ничего не найдено
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Попробуйте изменить поисковый запрос или выбрать другую категорию
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredFAQs.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
                      <CardContent className="p-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <div className="text-gray-700 dark:text-gray-300">
                              {item.icon}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {item.question}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6 sticky top-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Связаться с поддержкой
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Контакты
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          support@eqwip.ru
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          +7 (495) 123-45-67
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Время работы
                    </h3>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Пн-Пт: 9:00 - 18:00 (МСК)
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Среднее время ответа
                    </h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        24 часа
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                    onClick={() => window.location.href = '/contacts'}
                  >
                    Написать в поддержку
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}