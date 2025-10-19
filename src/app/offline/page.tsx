'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { WifiOff, RefreshCw, Home, Search, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OfflinePage() {
  useEffect(() => {
    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration)
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    // Проверка статуса подключения
    const handleOnline = () => {
      window.location.reload()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center"
        >
          <WifiOff className="w-12 h-12 text-gray-600 dark:text-gray-300" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Офлайн режим
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400 mb-8"
        >
          Вы сейчас не подключены к интернету. Некоторые функции могут быть недоступны, но вы можете продолжать использовать базовые функции приложения.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Button
            onClick={handleRefresh}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl py-3"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Проверить подключение
          </Button>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full flex flex-col items-center py-4 rounded-2xl"
              >
                <Home className="w-6 h-6 mb-2" />
                <span className="text-xs">Главная</span>
              </Button>
            </Link>

            <Link href="/jobs">
              <Button
                variant="outline"
                className="w-full flex flex-col items-center py-4 rounded-2xl"
              >
                <Search className="w-6 h-6 mb-2" />
                <span className="text-xs">Поиск</span>
              </Button>
            </Link>

            <Link href="/applications">
              <Button
                variant="outline"
                className="w-full flex flex-col items-center py-4 rounded-2xl"
              >
                <Briefcase className="w-6 h-6 mb-2" />
                <span className="text-xs">Отклики</span>
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Доступно офлайн:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
            <li>• Просмотр сохраненных вакансий</li>
            <li>• Редактирование профиля</li>
            <li>• Поиск по кэшированным данным</li>
            <li>• Черновики откликов</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}