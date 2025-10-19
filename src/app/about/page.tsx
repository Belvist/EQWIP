'use client'

import { motion } from 'framer-motion'
import { 
  Building, 
  Users, 
  Brain, 
  Target, 
  TrendingUp, 
  Award,
  Globe,
  Shield,
  Zap,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Rocket,
  Handshake
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'

export default function AboutPage() {
  const stats = [
    { label: 'Активных пользователей', value: '50,000+', icon: <Users className="w-6 h-6" /> },
    { label: 'Компаний-партнеров', value: '2,000+', icon: <Building className="w-6 h-6" /> },
    { label: 'Успешных наймов', value: '15,000+', icon: <Target className="w-6 h-6" /> },
    { label: 'Точность AI', value: '94%', icon: <Brain className="w-6 h-6" /> }
  ]

  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Точность',
      description: 'Наш AI анализирует тысячи параметров, чтобы находить идеальные соответствия между кандидатами и вакансиями.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Безопасность',
      description: 'Мы защищаем данные пользователей и гарантируем конфиденциальность всей информации на платформе.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Скорость',
      description: 'Процесс поиска работы и кандидатов ускоряется в разы благодаря автоматизации и умным алгоритмам.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Люди в первую очередь',
      description: 'Мы создаем платформу для людей, помогая строить карьеру и находить талантливых сотрудников.'
    }
  ]

  const timeline = [
    {
      year: '2025',
      title: 'Основание EQWIP',
      description: 'Начало создания и запуска продукта с фокусом на AI-технологиях для подбора персонала.'
    },
    {
      year: '2025',
      title: 'Первый AI-алгоритм',
      description: 'Разработка и внедрение первой системы рекомендаций на основе машинного обучения.'
    },
    {
      year: '2025',
      title: 'Запуск платформы',
      description: 'Официальный запуск и начало работы с первыми пользователями и компаниями.'
    },
    {
      year: '2025',
      title: 'Развитие продукта',
      description: 'Постоянное улучшение платформы и добавление новых функций на основе обратной связи.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              О EQWIP
            </h1>
            <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Мы революционизируем рынок труда с помощью искусственного интеллекта, соединяя талантливых профессионалов с лучшими компаниями
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
              onClick={() => window.location.href = '/jobs'}
            >
              Найти работу
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => window.location.href = '/post-job'}
            >
              Разместить вакансию
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
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center">
                  <div className="text-gray-700 dark:text-gray-300">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Lightbulb className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Наша миссия
              </h2>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Мы верим, что каждый человек заслуживает работу мечты, а каждая компания — лучших сотрудников. 
              EQWIP использует передовые AI-технологии, чтобы сделать процесс поиска работы и подбора персонала 
              более эффективным, прозрачным и гуманным.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Наши ценности
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Принципы, которые лежат в основе нашей работы
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-6"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mb-4">
                  <div className="text-gray-700 dark:text-gray-300">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Как это работает
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Технологии, которые стоят за нашим успехом
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 rounded-3xl flex items-center justify-center">
                <Brain className="w-10 h-10 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                AI-анализ
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Наши алгоритмы анализируют резюме, вакансии и поведение пользователей для точных рекомендаций
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-3xl flex items-center justify-center">
                <Target className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Умное matching
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Система учитывает навыки, опыт, предпочтения и культурное соответствие
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-3xl flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Постоянное обучение
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Наш AI постоянно улучшается на основе новых данных и обратной связи
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Наш путь
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Ключевые моменты в истории EQWIP
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>

              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className={`relative flex items-center mb-12 ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className="w-1/2 px-8">
                    <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
                      <CardContent className="p-0">
                        <Badge className="mb-3 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          {item.year}
                        </Badge>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-900 dark:bg-white rounded-full border-4 border-white dark:border-black"></div>
                  
                  <div className="w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Наша команда
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Эксперты, которые создают будущее подбора персонала
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { name: 'Каримов Артур Русланович', role: 'CEO & Founder' },
              { name: 'Тихонов Даниил Сергеевич', role: 'CEO & Founder' }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="bg-gray-50 dark:bg-neutral-900 border-2 border-gray-200 dark:border-gray-800 max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Rocket className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Присоединяйтесь к нам
                </h2>
              </div>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                Станьте частью сообщества, которое меняет мир труда к лучшему
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                  onClick={() => window.location.href = '/auth/signup'}
                >
                  Начать сейчас
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => window.location.href = '/contacts'}
                >
                  Связаться с нами
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