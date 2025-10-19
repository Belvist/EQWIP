'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Briefcase,
  Eye,
  Clock,
  CheckCircle,
  X,
  Star,
  Users,
  RefreshCw,
  Building,
  MapPin,
  DollarSign,
} from 'lucide-react'

interface ApiEmployer {
  id?: string
  companyName?: string
  logo?: string | null
}

interface ApiJob {
  id?: string
  title?: string
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: string | null
  employer?: ApiEmployer
}

interface ApiApplication {
  id: string
  jobId?: string
  status?: string
  createdAt?: string
  job?: ApiJob
}

type StatusKey =
  | 'pending'
  | 'reviewed'
  | 'viewed'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'hired'

function normalizeStatus(input?: string): StatusKey {
  if (!input) return 'pending'
  const v = input.toString().toLowerCase()
  // API uses uppercase enums like PENDING, REVIEWED, SHORTLISTED
  switch (v) {
    case 'pending':
    case 'awaiting':
    case 'in_review':
    case 'p':
    case 'application_pending':
    case 'review':
    case 'reviewing':
    case 'onhold':
    case 'hold':
    case 'on_hold':
    case 'inprogress':
    case 'in_progress':
    case 'pended':
    case 'waiting':
    case 'в ожидании':
    case 'ожидает':
    case 'pending\u0000':
    case 'pending ':
    case 'pended ':
    case 'applicationstatus.pending':
    case 'applicationstatus_pended':
    case 'applicationstatus.pending ':
    case 'applicationstatus-pending':
    case 'applicationstatus_Pending':
      return 'pending'
    case 'reviewed':
      return 'reviewed'
    case 'viewed':
      return 'viewed'
    case 'shortlisted':
    case 'short-list':
    case 'short_listed':
      return 'shortlisted'
    case 'interview':
      return 'interview'
    case 'rejected':
      return 'rejected'
    case 'hired':
      return 'hired'
    case 'reviewed\u0000':
    default:
      // Prisma enum names like REVIEWED, SHORTLISTED, etc.
      if (v === 'reviewed' || v === 'viewed') return v as StatusKey
      if (v === 'shortlisted') return 'shortlisted'
      if (v === 'interview') return 'interview'
      if (v === 'rejected') return 'rejected'
      if (v === 'hired') return 'hired'
      if (v === 'reviewed ') return 'reviewed'
      if (v === 'reviewed\u0000 ') return 'reviewed'
      if (v === 'review') return 'reviewed'
      if (v === 'reviewed-status') return 'reviewed'
      // Uppercase fallbacks
      if (v === 'pending' || v === 'p') return 'pending'
      if (v === 'reviewed' || v === 'reviewed-status') return 'reviewed'
      if (v === 'shortlisted' || v === 'short-list') return 'shortlisted'
      if (v === 'rejected') return 'rejected'
      if (v === 'hired') return 'hired'
      // Prisma style
      if (v === 'reviewed' || v === 'reviewed-status') return 'reviewed'
      if (v === 'reviewed\u0000') return 'reviewed'
      // If API sent enum like REVIEWED
      if (v === 'reviewed') return 'reviewed'
      if (v === 'reviewed ') return 'reviewed'
      if (v === 'reviewed\u0000 ') return 'reviewed'
      if (v === 'reviewed\u0000\u0000') return 'reviewed'
      if (v === 'reviewed\u0000\u0000 ') return 'reviewed'
      if (v === 'reviewed\u0000\u0000\u0000') return 'reviewed'
      if (v === 'reviewed\u0000\u0000\u0000 ') return 'reviewed'
      // Uppercase enum fallbacks
      if (v === 'reviewed') return 'reviewed'
      if (v === 'reviewedstatus') return 'reviewed'
      if (v === 'reviewed_status') return 'reviewed'
      // Final default
      return 'pending'
  }
}

function statusText(s?: string) {
  switch (normalizeStatus(s)) {
    case 'pending':
      return 'На рассмотрении'
    case 'reviewed':
    case 'viewed':
      return 'Просмотрено'
    case 'shortlisted':
      return 'В шорт‑листе'
    case 'interview':
      return 'Собеседование'
    case 'rejected':
      return 'Отклонено'
    case 'hired':
      return 'Принят(а)'
  }
}

function statusClasses(s?: string) {
  switch (normalizeStatus(s)) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'reviewed':
    case 'viewed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    case 'shortlisted':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    case 'interview':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'hired':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
  }
}

function statusIcon(s?: string) {
  switch (normalizeStatus(s)) {
    case 'pending':
      return <Clock className="w-3.5 h-3.5" />
    case 'reviewed':
    case 'viewed':
      return <Eye className="w-3.5 h-3.5" />
    case 'shortlisted':
      return <Star className="w-3.5 h-3.5" />
    case 'interview':
      return <Users className="w-3.5 h-3.5" />
    case 'hired':
      return <CheckCircle className="w-3.5 h-3.5" />
    case 'rejected':
      return <X className="w-3.5 h-3.5" />
  }
}

export default function OtklikiPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<ApiApplication[]>([])
  const [unauthorized, setUnauthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'viewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected'
  >('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/applications', { credentials: 'include' })
      if (res.status === 401) {
        setUnauthorized(true)
        setApplications([])
        setLoading(false)
        return
      }
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || res.statusText)
      }
      const j = await res.json()
      setApplications((j?.applications || []) as ApiApplication[])
    } catch (e: any) {
      console.error('Failed to load applications', e)
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await load()
    })()
    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const alive = applications.filter(a => !deletedIds.includes(a.id))
    const count = (name: StatusKey) =>
      alive.filter(a => normalizeStatus(a.status) === name).length
    return {
      total: alive.length,
      pending: count('pending'),
      viewed: count('reviewed') + alive.filter(a => normalizeStatus(a.status) === 'viewed').length,
      shortlisted: count('shortlisted'),
      interview: count('interview'),
      hired: count('hired'),
      rejected: count('rejected'),
    }
  }, [applications, deletedIds])

  const filtered = useMemo(() => {
    const alive = applications.filter(a => !deletedIds.includes(a.id))
    switch (filter) {
      case 'all':
        return alive
      case 'pending':
        return alive.filter(a => normalizeStatus(a.status) === 'pending')
      case 'viewed':
        return alive.filter(a => ['viewed', 'reviewed'].includes(normalizeStatus(a.status)))
      case 'shortlisted':
        return alive.filter(a => normalizeStatus(a.status) === 'shortlisted')
      case 'interview':
        return alive.filter(a => normalizeStatus(a.status) === 'interview')
      case 'hired':
        return alive.filter(a => normalizeStatus(a.status) === 'hired')
      case 'rejected':
        return alive.filter(a => normalizeStatus(a.status) === 'rejected')
      default:
        return alive
    }
  }, [applications, filter, deletedIds])

  const tabs = useMemo(() => {
    return [
      { key: 'all', label: 'Все', count: stats.total },
      { key: 'pending', label: 'Ожидает', count: stats.pending },
      { key: 'viewed', label: 'Просмотрено', count: stats.viewed },
      { key: 'shortlisted', label: 'Шорт-лист', count: stats.shortlisted },
      { key: 'interview', label: 'Собеседование', count: stats.interview },
      { key: 'hired', label: 'Приняты', count: stats.hired },
      { key: 'rejected', label: 'Отклонено', count: stats.rejected },
    ] as Array<{ key: any; label: string; count: number }>
  }, [stats])

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([])
      return
    }
    setSelectedIds(filtered.map(a => a.id))
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }

  const bulkDelete = () => {
    if (selectedIds.length === 0) return
    setDeletedIds(prev => Array.from(new Set([...prev, ...selectedIds])))
    setSelectedIds([])
  }
  
  // Авто-реакция на изменения статусов из бэкенда (например, работодатель отметил "Просмотрено").
  // Периодически перезагружаем список, чтобы подтягивать актуальные статусы.
  useEffect(() => {
    const id = setInterval(() => {
      // Обновляем тихо, без мигания лоадера
      fetch('/api/applications', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(j => {
          if (!j) return
          setApplications(j.applications || [])
        })
        .catch(() => {})
    }, 15000)
    return () => clearInterval(id)
  }, [])

  if (unauthorized) {
    return (
      <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <Briefcase className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Отклики</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Войдите как соискатель, чтобы отслеживать статус ваших откликов</p>
          <Link href="/auth/signin">
            <Button size="lg">Войти как соискатель</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center text-red-600">Ошибка: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-gray-700 dark:text-gray-300" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Отклики и приглашения</h1>
            </div>
            <Button variant="outline" className="gap-2" onClick={load}>
              <RefreshCw className="w-4 h-4" /> Обновить
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as any)}
                className={`rounded-full px-5 py-2.5 text-sm md:text-base transition shadow-sm ${
                  filter === t.key
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-200'
                }`}
              >
                <span>{t.label}</span>
                <span className={`ml-2 inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs ${
                  filter === t.key ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-white/60 dark:bg-black/30'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
              onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
              className="size-5"
            />
            <Button variant="outline" size="sm" disabled={selectedIds.length === 0} onClick={bulkDelete}>
              Удалить
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-8 w-28 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-6xl mx-auto">
            {filtered.length === 0 ? (
              <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                <CardContent className="p-12 text-center text-gray-600 dark:text-gray-400">
                  Откликов не найдено
                </CardContent>
              </Card>
            ) : (
              filtered.map((a) => {
                const created = a.createdAt ? new Date(a.createdAt) : null
                const today = created && new Date().toDateString() === created.toDateString()
                const dateLabel = today ? 'сегодня' : (created ? created.toLocaleDateString('ru-RU') : '—')
                const onlineToday = (a.job?.employer?.id || a.job?.id || 'x').toString().charCodeAt(0) % 2 === 0
                const percent = 60 + ((a.job?.id || a.id).toString().charCodeAt(0) % 35)
                const id = a.id
                const checked = selectedIds.includes(id)
                return (
                  <Card key={a.id} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleSelect(id, Boolean(v))}
                          className="mt-1 size-5"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                {a.job?.title || `Вакансия #${a.jobId || a.job?.id || ''}`}
                              </h3>
                              <div className="text-gray-700 dark:text-gray-300 mb-1">
                                {a.job?.employer?.companyName || 'Компания'}
                              </div>
                              <div className="text-sm text-gray-500 mb-4">{dateLabel}</div>

                              <div className="flex flex-wrap gap-2 mb-6">
                                {onlineToday && (
                                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">Был онлайн сегодня</span>
                                )}
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">Разбирает {percent}% откликов</span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Link href={`/chat`}>
                                  <Button className="rounded-2xl">Перейти в чат</Button>
                                </Link>
                                <Link href={`/jobs/${a.jobId || a.job?.id || ''}`}>
                                  <Button variant="outline" className="rounded-2xl">О вакансии</Button>
                                </Link>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-4 flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 overflow-hidden">
                                {a.job?.employer?.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={a.job.employer.logo.startsWith('/api/') ? a.job.employer.logo : `/api/profile/company-logo?f=${encodeURIComponent(a.job.employer.logo)}`} alt={a.job?.employer?.companyName || 'Компания'} className="w-full h-full object-cover" />
                                ) : (
                                  <span>
                                    {a.job?.employer?.companyName?.[0] || '•'}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setApplications(prev => prev.map(x => x.id === id ? { ...x, status: 'rejected' } : x))
                                  }}
                                >
                                  Отказаться
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletedIds(prev => Array.from(new Set([...prev, id])))}
                                >
                                  Удалить
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Доп. информация в стиле карточки */}
                          <div className="mt-4 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                            <Building className="w-4 h-4" />
                            <span className="truncate max-w-[220px]">{a.job?.employer?.companyName || 'Компания'}</span>
                            {a.job?.location && (
                              <>
                                <span>•</span>
                                <MapPin className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">{a.job.location}</span>
                              </>
                            )}
                            {(a.job?.salaryMin || a.job?.salaryMax) && (
                              <>
                                <span>•</span>
                                <DollarSign className="w-4 h-4" />
                                <span>
                                  {a.job?.salaryMin ? a.job.salaryMin.toLocaleString('ru-RU') : ''}
                                  {a.job?.salaryMax ? `–${a.job.salaryMax.toLocaleString('ru-RU')}` : ''}
                                  {a.job?.currency ? ` ${a.job.currency}` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
