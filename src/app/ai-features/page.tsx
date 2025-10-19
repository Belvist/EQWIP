'use client'

import { motion } from 'framer-motion'
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Zap, 
  Shield,
  Users,
  FileText,
  Search,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Cpu,
  Database,
  Network,
  Eye,
  MessageCircle,
  Star,
  Award,
  Globe,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import aiStyles from '@/styles/ai.module.css'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'

export default function AIFeaturesPage() {
  const aiFeatures = [
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Умный подбор',
      description: 'AI анализирует тысячи параметров для нахождения идеальных соответствий между кандидатами и вакансиями.',
      benefits: ['Точность 94%', 'Учет культурного соответствия', 'Адаптация под предпочтения'],
      color: 'from-gray-600 to-gray-400'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Анализ резюме',
      description: 'Автоматическая обработка и анализ резюме с выделением ключевых навыков и опыта.',
      benefits: ['Распознавание навыков', 'Оценка опыта', 'Выявление потенциала'],
      color: 'from-gray-600 to-gray-400'
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Умный поиск',
      description: 'Семантический поиск, понимающий контекст и синонимы, а не только ключевые слова.',
      benefits: ['Понимание контекста', 'Поиск по смыслу', 'Релевантные результаты'],
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Предиктивная аналитика',
      description: 'Прогнозирование успеха кандидатов и эффективности вакансий на основе исторических данных.',
      benefits: ['Прогнозирование успеха', 'Оптимизация процессов', 'Data-driven решения'],
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'AI-ассистент',
      description: 'Чат-бот для помощи в создании резюме, вакансий и ответах на частые вопросы.',
      benefits: ['24/7 поддержка', 'Помощь в создании', 'Мгновенные ответы'],
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'Компьютерное зрение',
      description: 'Анализ видео-собеседований и оценка невербальной коммуникации кандидатов.',
      benefits: ['Анализ жестов', 'Оценка уверенности', 'Объективная оценка'],
      color: 'from-gray-700 to-gray-500'
    }
  ]

  const technologies = [
    {
      name: 'Машинное обучение',
      description: 'Алгоритмы, которые обучаются на данных и улучшаются со временем',
      icon: <Cpu className="w-6 h-6" />
    },
    {
      name: 'Обработка естественного языка',
      description: 'Понимание и анализ текста на человеческом языке',
      icon: <FileText className="w-6 h-6" />
    },
    {
      name: 'Нейронные сети',
      description: 'Глубокое обучение для распознавания сложных паттернов',
      icon: <Network className="w-6 h-6" />
    },
    {
      name: 'Big Data',
      description: 'Обработка и анализ больших объемов данных в реальном времени',
      icon: <Database className="w-6 h-6" />
    }
  ]

  const stats = [
    { label: 'Точность рекомендаций', value: '94%', icon: <Target className="w-5 h-5" /> },
    { label: 'Скорость обработки', value: '0.3с', icon: <Zap className="w-5 h-5" /> },
    { label: 'Обработанных резюме', value: '1M+', icon: <FileText className="w-5 h-5" /> },
    { label: 'Удовлетворенность пользователей', value: '96%', icon: <Star className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Brain className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              AI-возможности
            </h1>
            <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Откройте для себя передовые искусственный интеллект и машинное обучение, которые делают поиск работы и подбор персонала более эффективными
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
              onClick={() => window.location.href = '/ai-recommendations'}
            >
              Попробовать AI
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => window.location.href = '/jobs'}
            >
              Найти работу
            </Button>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center">
                  <div className="text-gray-700 dark:text-gray-300">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* AI Features */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Наши AI-технологии
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Инновационные решения, которые меняют правила игры
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Card className="h-full bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${feature.color} p-6`}>
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                        <div className="text-white">
                          {feature.icon}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {feature.description}
                      </p>

                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Ключевые преимущества:
                        </h4>
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technologies */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Технологии в основе
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Современные технологии, которые делают наш AI мощным
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center">
                  <div className="text-gray-700 dark:text-gray-300">
                    {tech.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {tech.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {tech.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How AI Works */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Как работает наш AI
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              От данных до рекомендаций — полный цикл работы искусственного интеллекта
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Process line */}
              <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>

              {[
                {
                  step: '1',
                  title: 'Сбор данных',
                  description: 'AI собирает и анализирует данные из резюме, вакансий и поведения пользователей',
                  icon: <Database className="w-6 h-6" />
                },
                {
                  step: '2',
                  title: 'Обработка и анализ',
                  description: 'Система обрабатывает текст, выделяет ключевые навыки и определяет паттерны',
                  icon: <Cpu className="w-6 h-6" />
                },
                {
                  step: '3',
                  title: 'Обучение моделей',
                  description: 'Машинное обучение постоянно улучшает алгоритмы на основе новых данных',
                  icon: <Brain className="w-6 h-6" />
                },
                {
                  step: '4',
                  title: 'Генерация рекомендаций',
                  description: 'AI создает персонализированные рекомендации с высокой точностью',
                  icon: <Target className="w-6 h-6" />
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative flex items-start gap-6 mb-12"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <div className="text-white dark:text-black font-bold text-lg">
                      {step.step}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-gray-700 dark:text-gray-300">
                        {step.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Преимущества AI-подхода
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Почему искусственный интеллект меняет правила игры
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Для соискателей
                  </h3>
                </div>
                <ul className="space-y-2">
                  {[
                    'Персонализированные рекомендации',
                    'Автоматическое улучшение резюме',
                    'Оценка шансов на успех',
                    'Подготовка к собеседованиям'
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-2xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Для работодателей
                  </h3>
                </div>
                <ul className="space-y-2">
                  {[
                    'Быстрый поиск лучших кандидатов',
                    'Снижение затрат на подбор',
                    'Увеличение удержания сотрудников',
                    'Объективная оценка кандидатов'
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 border-0 max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lightbulb className="w-8 h-8 text-white dark:text-black" />
                <h2 className="text-3xl font-bold text-white dark:text-black">
                  Готовы попробовать AI?
                </h2>
              </div>
              <p className="text-xl text-gray-200 dark:text-gray-700 mb-8">
                Откройте для себя будущее поиска работы и подбора персонала
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => window.location.href = '/ai-recommendations'}
                >
                  Попробовать AI-рекомендации
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white dark:border-black text-white dark:text-black hover:bg-white/10 dark:hover:bg-black/10"
                  onClick={() => window.location.href = '/auth/signup'}
                >
                  Создать аккаунт
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}