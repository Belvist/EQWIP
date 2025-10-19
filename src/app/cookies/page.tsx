'use client'

import { motion } from 'framer-motion'
import { 
  Cookie, 
  Shield, 
  Eye, 
  Settings,
  CheckCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Footer from '@/components/Footer'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Cookie className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Политика использования файлов cookie
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Информация о том, как EQWIP использует файлы cookie для улучшения вашего опыта работы с платформой
            </p>
          </motion.div>

          {/* Content */}
          <div className="space-y-8">
            {/* What are cookies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Cookie className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Что такое файлы cookie?
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении веб-сайтов. 
                        Они помогают нам запоминать ваши предпочтения, анализировать использование платформы и предоставлять персонализированный опыт.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Types of cookies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Какие типы файлов cookie мы используем?
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Необходимые cookie
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Обеспечивают базовую функциональность сайта. Без них платформа не может работать правильно.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Eye className="w-5 h-5 text-gray-500" />
                            Аналитические cookie
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Помогают нам понимать, как вы используете платформу, чтобы улучшать её функциональность.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-500" />
                            Функциональные cookie
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Запоминают ваши настройки и предпочтения для персонализации опыта.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Info className="w-5 h-5 text-orange-500" />
                            Рекламные cookie
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Используются для показа релевантной рекламы на основе ваших интересов.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* How we use cookies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Как мы используем файлы cookie?
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 dark:text-gray-400 font-bold">1</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Аутентификация и безопасность
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Для обеспечения безопасности вашего аккаунта и предотвращения несанкционированного доступа.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Персонализация
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Для адаптации контента и рекомендаций под ваши потребности и предпочтения.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Аналитика и улучшение
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Для анализа использования платформы и постоянного улучшения её функциональности.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 dark:text-orange-400 font-bold">4</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Маркетинг
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Для показа релевантной информации о вакансиях и возможностях карьерного роста.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Managing cookies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Как управлять файлами cookie?
                  </h2>
                  
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Вы можете управлять настройками файлов cookie в вашем браузере. Большинство браузеров позволяют:
                    </p>
                    
                    <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Просматривать и удалять существующие файлы cookie</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Блокировать файлы cookie от определённых сайтов</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Настроить оповещения при получении файлов cookie</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Разрешать или запрещать сторонние cookie</span>
                      </li>
                    </ul>
                    
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Важно:</strong> Отключение необходимых файлов cookie может повлиять на функциональность платформы 
                        и ограничить доступ к некоторым функциям.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 border-0">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-bold text-white dark:text-black mb-4">
                    Остались вопросы?
                  </h2>
                  <p className="text-gray-200 dark:text-gray-700 mb-6">
                    Если у вас есть вопросы о нашей политике использования файлов cookie, пожалуйста, свяжитесь с нами.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="outline"
                      className="border-white dark:border-black text-white dark:text-black hover:bg-white/10 dark:hover:bg-black/10"
                      onClick={() => window.location.href = '/contacts'}
                    >
                      Связаться с нами
                    </Button>
                    <Button
                      className="bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => window.location.href = '/help'}
                    >
                      Помощь
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}