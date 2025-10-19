'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cookie, 
  X, 
  Check, 
  Shield,
  Settings,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CookieConsentProps {
  onAccept?: () => void
  onDecline?: () => void
}

export default function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setIsVisible(false)
    onAccept?.()
  }

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined')
    setIsVisible(false)
    onDecline?.()
  }

  const handleAcceptEssential = () => {
    localStorage.setItem('cookieConsent', 'essential')
    setIsVisible(false)
  onAccept?.()
  }

  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Cookie Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Мы используем файлы cookie
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        EQWIP использует cookie для улучшения вашего опыта работы с платформой, персонализации контента
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsVisible(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Details */}
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl -y-3"
                    >
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Необходимые cookie
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Обеспечивают базовую функциональность сайта. Без них платформа не может работать правильно.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Settings className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Функциональные cookie
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Запоминают ваши настройки и предпочтения для персонализации опыта.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Аналитические cookie
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Помогают нам понимать, как вы используете платформу, чтобы улучшать её функциональность.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleAccept}
                      className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Принять все
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleAcceptEssential}
                    >
                      Только необходимые
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {showDetails ? 'Скрыть детали' : 'Подробнее'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={handleDecline}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-auto"
                    >
                      Отклонить
                    </Button>
                  </div>

                  {/* Links */}
                  <div className="flex gap-4 mt-3 text-xs">
                    <a
                      href="/privacy"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                    >
                      Политика конфиденциальности
                    </a>
                    <a
                      href="/cookies"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                    >
                      Политика cookie
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}