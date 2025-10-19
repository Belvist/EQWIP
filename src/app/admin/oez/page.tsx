'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, CheckCircle, Briefcase, Users, Building2, GraduationCap, Shield, FileCheck2, ArrowRight, Sparkles, ChevronDown } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalJobs: number
  totalApplications: number
  activeUsers: number
  newUsersToday: number
  newJobsToday: number
  pendingReports: number
  flaggedContent: number
}

export default function OezAdminHome() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/admin')
      return
    }
    if (status === 'authenticated') {
      // @ts-ignore
      if ((session?.user?.role as string) !== 'ADMIN') {
        router.replace('/auth/admin')
        return
      }
      ;(async () => {
        try {
          const res = await fetch('/api/admin/stats?range=7d', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setStats(data)
          } else {
            setStats(null)
          }
        } catch {
          setStats(null)
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [status, session, router])

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-500 animate-pulse" />
          </div>
          <div className="text-gray-700 dark:text-gray-300">Загрузка панели администратора…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8 relative">
          <div className="flex items-center gap-3 relative">
            <Shield className="w-8 h-8 text-gray-600 dark:text-gray-300" />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 group"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Панель администратора ОЭЗ</h1>
              <ChevronDown className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            <Sparkles className="w-7 h-7 text-gray-500" />

            {menuOpen && (
              <div className="absolute left-10 top-12 z-50 w-[340px] bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl">
                <ul className="py-2">
                  <DropdownItem label="Модерация вакансий и стажировок" onClick={() => { setMenuOpen(false); router.push('/admin/moderation/vacancies') }} />
                  <DropdownItem label="Управление резидентами (HR компаний)" onClick={() => { setMenuOpen(false); router.push('/admin/companies') }} />
                  <DropdownItem label="Управление образовательными учреждениями" onClick={() => { setMenuOpen(false); router.push('/admin/universities') }} />
                  <DropdownItem label="Аналитика и отчёты" onClick={() => { setMenuOpen(false); window.location.href = '/admin/analytics' }} />
                  <DropdownItem label="Пользователи и настройки" onClick={() => { setMenuOpen(false); router.push('/admin') }} />
                </ul>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={() => router.refresh()}>Обновить</Button>
        </div>

        {/* Ключевые метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-2xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <Badge variant="secondary">за 7 дней</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.totalUsers ?? 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Пользователей</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <Badge variant="secondary">активные</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.totalJobs ?? 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Вакансий</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg:black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-2xl flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <Badge variant="secondary">новые</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.totalApplications ?? 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Откликов</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <Badge variant="secondary">активность</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.activeUsers ?? 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Активных пользователей</div>
            </CardContent>
          </Card>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            icon={<FileCheck2 className="w-5 h-5" />}
            title="Модерация заявок"
            description="Проверка стажировок/вакансий, смена статусов"
            onClick={() => router.push('/admin')}
          />
          <ActionCard
            icon={<Briefcase className="w-5 h-5" />}
            title="Опубликовать вакансию"
            description="Создать вакансию от лица кластера ОЭЗ"
            onClick={() => router.push('/post-job')}
          />
          <ActionCard
            icon={<BarChart3 className="w-5 h-5" />}
            title="Аналитика"
            description="Вакансии, отклики, источники, конверсия"
            onClick={() => router.push('/admin/analytics')}
          />
          <ActionCard
            icon={<Building2 className="w-5 h-5" />}
            title="Компании"
            description="Список компаний‑резидентов"
            onClick={() => router.push('/companies')}
          />
          <ActionCard
            icon={<GraduationCap className="w-5 h-5" />}
            title="Вузы"
            description="Управление запросами от вузов"
            onClick={() => router.push('/admin')}
          />
          <ActionCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Настройки доступа"
            description="Выдача ролей и доступов администраторам"
            onClick={() => router.push('/admin')}
          />
        </div>
      </main>
    </div>
  )
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center text-gray-700 dark:text-gray-300">
              {icon}
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</div>
          <Button variant="outline" onClick={onClick}>Открыть</Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function DropdownItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
      >
        {label}
      </button>
    </li>
  )
}


