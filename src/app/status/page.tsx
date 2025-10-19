'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Activity,
  Server,
  Database,
  Zap,
  Wifi,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  description: string
  lastUpdated: string
  uptime: number
  icon: any
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  responseTime: number
  activeUsers: number
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Веб-платформа',
      status: 'operational',
      description: 'Основной веб-сайт и пользовательский интерфейс',
      lastUpdated: '2025-01-15T10:30:00Z',
      uptime: 99.9,
      icon: Activity
    },
    {
      name: 'API сервисы',
      status: 'operational',
      description: 'REST API и GraphQL эндпоинты',
      lastUpdated: '2025-01-15T10:30:00Z',
      uptime: 99.8,
      icon: Server
    },
    {
      name: 'База данных',
      status: 'operational',
      description: 'PostgreSQL база данных и кэширование',
      lastUpdated: '2025-01-15T10:30:00Z',
      uptime: 99.95,
      icon: Database
    },
    {
      name: 'AI сервисы',
      status: 'degraded',
      description: 'Машинное обучение и рекомендации',
      lastUpdated: '2025-01-15T10:25:00Z',
      uptime: 98.5,
      icon: Zap
    },
    {
      name: 'CDN и сеть',
      status: 'operational',
      description: 'Content Delivery Network и сетевая инфраструктура',
      lastUpdated: '2025-01-15T10:30:00Z',
      uptime: 99.99,
      icon: Wifi
    }
  ])

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    disk: 78,
    responseTime: 145,
    activeUsers: 1247
  })

  const [lastUpdated, setLastUpdated] = useState(new Date())

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'outage':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'maintenance':
        return <Clock className="w-5 h-5 text-gray-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  const getStatusText = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'Работает'
      case 'degraded':
        return 'Нарушения'
      case 'outage':
        return 'Недоступно'
      case 'maintenance':
        return 'Обслуживание'
      default:
        return 'Неизвестно'
    }
  }

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Только что'
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ч. назад`
    return `${Math.floor(diffMinutes / 1440)} д. назад`
  }

  const refreshData = () => {
    // Simulate data refresh
    setLastUpdated(new Date())
    
    // Simulate some random changes in metrics
    setMetrics(prev => ({
      cpu: Math.max(20, Math.min(80, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(40, Math.min(85, prev.memory + (Math.random() - 0.5) * 8)),
      disk: Math.max(70, Math.min(90, prev.disk + (Math.random() - 0.5) * 2)),
      responseTime: Math.max(100, Math.min(300, prev.responseTime + (Math.random() - 0.5) * 20)),
      activeUsers: Math.max(1000, Math.min(2000, prev.activeUsers + Math.floor((Math.random() - 0.5) * 100)))
    }))
  }

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  const overallStatus = services.every(s => s.status === 'operational') ? 'operational' : 
                         services.some(s => s.status === 'outage') ? 'outage' : 'degraded'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Activity className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Статус системы
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Мониторинг работоспособности всех сервисов EQWIP в реальном времени
            </p>
          </motion.div>

          {/* Overall Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className={`bg-white dark:bg-black border-2 ${
              overallStatus === 'operational' ? 'border-green-200 dark:border-green-800' :
              overallStatus === 'degraded' ? 'border-yellow-200 dark:border-yellow-800' :
              'border-red-200 dark:border-red-800'
            }`}>
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      overallStatus === 'operational' ? 'bg-green-100 dark:bg-green-900/20' :
                      overallStatus === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                      'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {getStatusIcon(overallStatus)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        Общий статус системы
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {getStatusText(overallStatus)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-2">
                      Последнее обновление: {lastUpdated.toLocaleTimeString('ru-RU')}
                    </div>
                    <Button
                      onClick={refreshData}
                      variant="outline"
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Обновить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Services Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center">
                            <service.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {service.name}
                            </h3>
                            <Badge className={getStatusColor(service.status)}>
                              {getStatusText(service.status)}
                            </Badge>
                          </div>
                        </div>
                        {getStatusIcon(service.status)}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {service.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Uptime:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatUptime(service.uptime)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Обновлено:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatLastUpdated(service.lastUpdated)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Системные метрики
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 rounded-2xl flex items-center justify-center">
                      <Activity className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {metrics.cpu}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">CPU</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl flex items-center justify-center">
                      <Database className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {metrics.memory}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Память</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl flex items-center justify-center">
                      <Server className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {metrics.disk}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Диск</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl flex items-center justify-center">
                      <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {metrics.responseTime}мс
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ответ</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl flex items-center justify-center">
                      <Wifi className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {metrics.activeUsers}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Пользователи</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Последние инциденты
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Нарушения в работе AI сервисов
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        Наблюдаются задержки в работе системы рекомендаций и анализа резюме
                      </p>
                      <div className="text-xs text-gray-500">
                        15 января 2025, 10:25 • Решается
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Плановое обслуживание завершено
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        Обновление базы данных и оптимизация производительности успешно завершены
                      </p>
                      <div className="text-xs text-gray-500">
                        14 января 2025, 02:00 • Решено
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}