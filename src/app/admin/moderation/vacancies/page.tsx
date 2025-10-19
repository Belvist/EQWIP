'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  CheckCircle2, 
  Trash2, 
  Brain, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Clock
} from 'lucide-react'

type VacancyStatus = 'pending' | 'approved' | 'published'

interface Vacancy {
  id: string
  companyName: string
  title: string
  submittedAt: string
  status: VacancyStatus
  description: string
  aiAnalysis?: {
    overallScore: number
    recommendation: 'approve' | 'reject' | 'needs_revision' | 'error'
    issues: Array<{
      type: 'content_quality' | 'salary' | 'requirements' | 'company' | 'other'
      severity: 'low' | 'medium' | 'high'
      message: string
      suggestion: string
    }>
    strengths: string[]
    qualityMetrics: {
      contentCompleteness: number
      salaryTransparency: number
      requirementsClarity: number
      companyCredibility: number
    }
    aiSummary: string
    analyzedAt: string
  }
}

export default function VacanciesModerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Security: only ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/admin')
    if (status === 'authenticated') {
      // @ts-ignore
      if ((session?.user?.role as string) !== 'ADMIN') router.replace('/auth/admin')
    }
  }, [status, session, router])

  const [items, setItems] = useState<Vacancy[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [companyQuery, setCompanyQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'published' | 'all'>('pending')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // AI Analysis & Batch Actions
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [analyzing, setAnalyzing] = useState(false)
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | 'delete' | null>(null)
  const [showAnalysis, setShowAnalysis] = useState<string | null>(null)
  const [autoAnalyzing, setAutoAnalyzing] = useState(false)
  const [autoApprove, setAutoApprove] = useState(false)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '10',
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (companyQuery) params.set('company', companyQuery)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      // Админ API (готово к замене на FastAPI /moderation/vacancies)
      const res = await fetch(`/api/admin/moderation/jobs?${params.toString()}`)
      if (res.ok) {
        const j = await res.json()
        setItems(j.items || [])
        setPage(j.page || 1)
        setTotalPages(j.totalPages || 1)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onApplyFilters = () => load(1)

  // AI Analysis
  const analyzeJobs = async (jobIds: string[]) => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/admin/moderation/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds })
      })
      
      if (res.ok) {
        const { analyses } = await res.json()
        setItems(prev => prev.map(item => {
          const analysis = analyses.find((a: any) => a.jobId === item.id)
          return analysis ? { ...item, aiAnalysis: analysis.analysis } : item
        }))
        toast({ title: 'Анализ завершен', description: `Проанализировано ${analyses.length} вакансий` })
      } else {
        toast({ title: 'Ошибка анализа', description: 'Не удалось проанализировать вакансии', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка анализа', description: 'Не удалось проанализировать вакансии', variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  // Batch Actions
  const performBatchAction = async (action: 'approve' | 'reject' | 'delete', reason?: string) => {
    if (selectedItems.size === 0) return

    try {
      const res = await fetch('/api/admin/moderation/jobs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobIds: Array.from(selectedItems), 
          action,
          reason 
        })
      })
      
      if (res.ok) {
        const { affected } = await res.json()
        setItems(prev => prev.filter(item => !selectedItems.has(item.id)))
        setSelectedItems(new Set())
        setBatchAction(null)
        
        const actionText = action === 'approve' ? 'одобрено' : action === 'reject' ? 'отклонено' : 'удалено'
        toast({ title: 'Действие выполнено', description: `${affected} вакансий ${actionText}` })
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось выполнить действие', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить действие', variant: 'destructive' })
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedItems(new Set(items.map(item => item.id)))
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  // Автоматический анализ и одобрение
  const autoAnalyzeAndApprove = async () => {
    setAutoAnalyzing(true)
    try {
      // Анализируем все pending вакансии
      const pendingJobs = items.filter(item => item.status === 'pending')
      if (pendingJobs.length === 0) {
        toast({ title: 'Нет вакансий для анализа', description: 'Все вакансии уже обработаны' })
        return
      }

      const jobIds = pendingJobs.map(job => job.id)
      const res = await fetch('/api/admin/moderation/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds })
      })
      
      if (res.ok) {
        const { analyses } = await res.json()
        
        // Обновляем данные с анализом
        setItems(prev => prev.map(item => {
          const analysis = analyses.find((a: any) => a.jobId === item.id)
          return analysis ? { ...item, aiAnalysis: analysis.analysis } : item
        }))

        if (autoApprove) {
          // Автоматически одобряем вакансии с высоким рейтингом
          const toApprove = analyses
            .filter((a: any) => a.analysis.overallScore >= 70 && a.analysis.recommendation === 'approve')
            .map((a: any) => a.jobId)
          
          if (toApprove.length > 0) {
            await performBatchAction('approve', 'Автоматическое одобрение на основе AI-анализа')
            toast({ 
              title: 'Автоматическое одобрение', 
              description: `Одобрено ${toApprove.length} вакансий с высоким рейтингом` 
            })
          }
        }

        const highQuality = analyses.filter((a: any) => a.analysis.overallScore >= 70).length
        const needsReview = analyses.filter((a: any) => a.analysis.overallScore < 70).length
        
        toast({ 
          title: 'Анализ завершен', 
          description: `Проанализировано ${analyses.length} вакансий. Высокое качество: ${highQuality}, требует проверки: ${needsReview}` 
        })
      } else {
        toast({ title: 'Ошибка анализа', description: 'Не удалось проанализировать вакансии', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка анализа', description: 'Не удалось проанализировать вакансии', variant: 'destructive' })
    } finally {
      setAutoAnalyzing(false)
    }
  }

  // no modal; go to full job page instead

  const statusBadge = (s: VacancyStatus) => {
    const map: Record<VacancyStatus, string> = {
      pending: 'bg-gray-200 text-gray-800',
      approved: 'bg-indigo-200 text-indigo-800',
      published: 'bg-green-200 text-green-800',
    }
    return <span className={`px-2 py-1 rounded-2xl text-xs font-semibold ${map[s]}`}>{s}</span>
  }

  const getRecommendationBadge = (recommendation: string) => {
    const map = {
      approve: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Одобрить' },
      reject: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Отклонить' },
      needs_revision: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, text: 'Доработать' },
      error: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, text: 'Ошибка' }
    }
    const config = map[recommendation as keyof typeof map] || map.error
    const Icon = config.icon
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    const map = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-red-600 bg-red-50'
    }
    return map[severity as keyof typeof map] || map.low
  }

  const approveVacancy = async (v: Vacancy) => {
    try {
      // Публикуем вакансию (approve => publish)
      const resp = await fetch(`/api/admin/moderation/jobs/${v.id}/approve`, { method: 'POST' })
      if (resp.ok) {
        // После публикации скрываем из pending и уведомляем
        setItems(prev => prev.filter(it => it.id !== v.id))
        toast({ title: 'Опубликовано', description: `${v.title} — статус: published` })
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось одобрить вакансию', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось одобрить вакансию', variant: 'destructive' })
    }
  }

  const pagination = (
    <div className="flex items-center gap-2 justify-end mt-4">
      <Button variant="outline" size="sm" onClick={() => load(Math.max(1, page - 1))} disabled={page <= 1}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <div className="text-sm text-gray-600 dark:text-gray-400">Стр. {page} из {totalPages}</div>
      <Button variant="outline" size="sm" onClick={() => load(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Умная модерация вакансий</h1>
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                AI-анализ
              </Badge>
            </div>
            
            {/* Статистика */}
            {items.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    Высокое качество: {items.filter(item => item.aiAnalysis && item.aiAnalysis.overallScore >= 70).length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">
                    Требует проверки: {items.filter(item => item.aiAnalysis && item.aiAnalysis.overallScore < 70 && item.aiAnalysis.overallScore > 0).length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">
                    Не проанализировано: {items.filter(item => !item.aiAnalysis).length}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Автоматизация */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <Button 
                size="sm" 
                onClick={autoAnalyzeAndApprove}
                disabled={autoAnalyzing || items.filter(item => item.status === 'pending').length === 0}
                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                <Brain className="w-4 h-4" />
                {autoAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Анализ...
                  </>
                ) : (
                  'Умная модерация'
                )}
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Checkbox 
                  id="auto-approve"
                  checked={autoApprove}
                  onCheckedChange={(checked) => setAutoApprove(checked as boolean)}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <label htmlFor="auto-approve" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Авто-одобрение
                </label>
              </div>
            </div>

            {selectedItems.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Выбрано: {selectedItems.size}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelection}
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  Очистить
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => analyzeJobs(Array.from(selectedItems))}
                  disabled={analyzing}
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Brain className="w-4 h-4" />
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Анализ...
                    </>
                  ) : (
                    'AI-анализ'
                  )}
                </Button>
                <Select value={batchAction || ''} onValueChange={(value: any) => setBatchAction(value)}>
                  <SelectTrigger className="w-36 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Действие" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve" className="text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2 inline" />
                      Одобрить
                    </SelectItem>
                    <SelectItem value="reject" className="text-yellow-600">
                      <XCircle className="w-4 h-4 mr-2 inline" />
                      Отклонить
                    </SelectItem>
                    <SelectItem value="delete" className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2 inline" />
                      Удалить
                    </SelectItem>
                  </SelectContent>
                </Select>
                {batchAction && (
                  <Button 
                    size="sm" 
                    variant={batchAction === 'delete' ? 'destructive' : 'default'}
                    onClick={() => performBatchAction(batchAction)}
                    className={`gap-2 shadow-md hover:shadow-lg transition-all duration-200 ${
                      batchAction === 'approve' 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : batchAction === 'reject'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : ''
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    {batchAction === 'approve' ? 'Одобрить' : batchAction === 'reject' ? 'Отклонить' : 'Удалить'}
                  </Button>
                )}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={() => load(page)}
              className="gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Обновить
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} placeholder="Компания" className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="bg-white dark:bg-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="published">published</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="От" />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="До" />
            </div>
            <div className="flex items-center justify-end mt-3">
              <Button onClick={onApplyFilters} className="gap-2"><Filter className="w-4 h-4" /> Применить</Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <div className="col-span-1">
              <Checkbox 
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={(checked) => checked ? selectAll() : clearSelection()}
              />
            </div>
            <div className="col-span-2">Компания</div>
            <div className="col-span-3">Название вакансии</div>
            <div className="col-span-2">Дата подачи</div>
            <div className="col-span-1">Статус</div>
            <div className="col-span-1">AI-анализ</div>
            <div className="col-span-2 text-right">Действия</div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Нет заявок на модерацию</div>
          ) : (
            items.map(v => (
              <div key={v.id} className="grid grid-cols-12 px-4 py-3 border-b border-gray-100 dark:border-gray-900 items-center hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="col-span-1">
                  <Checkbox 
                    checked={selectedItems.has(v.id)}
                    onCheckedChange={() => toggleSelection(v.id)}
                  />
                </div>
                <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{v.companyName}</div>
                <div className="col-span-3 text-sm text-gray-900 dark:text-gray-100 truncate">{v.title}</div>
                <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">{new Date(v.submittedAt).toLocaleDateString('ru-RU')}</div>
                <div className="col-span-1">{statusBadge(v.status)}</div>
                <div className="col-span-1">
                  {v.aiAnalysis ? (
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${getScoreColor(v.aiAnalysis.overallScore)}`}>
                        {v.aiAnalysis.overallScore}
                      </span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Brain className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Brain className="w-5 h-5" />
                              AI-анализ вакансии
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Общая оценка</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`text-2xl font-bold ${getScoreColor(v.aiAnalysis.overallScore)}`}>
                                    {v.aiAnalysis.overallScore}
                                  </span>
                                  <Progress value={v.aiAnalysis.overallScore} className="flex-1" />
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Рекомендация</h4>
                                {getRecommendationBadge(v.aiAnalysis.recommendation)}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Метрики качества</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Полнота контента</span>
                                  <span className="text-sm font-medium">{v.aiAnalysis.qualityMetrics.contentCompleteness}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Прозрачность зарплаты</span>
                                  <span className="text-sm font-medium">{v.aiAnalysis.qualityMetrics.salaryTransparency}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Ясность требований</span>
                                  <span className="text-sm font-medium">{v.aiAnalysis.qualityMetrics.requirementsClarity}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Доверие к компании</span>
                                  <span className="text-sm font-medium">{v.aiAnalysis.qualityMetrics.companyCredibility}%</span>
                                </div>
                              </div>
                            </div>

                            {v.aiAnalysis.strengths.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  Сильные стороны
                                </h4>
                                <ul className="space-y-1">
                                  {v.aiAnalysis.strengths.map((strength, idx) => (
                                    <li key={idx} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {v.aiAnalysis.issues.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-1">
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                  Проблемы
                                </h4>
                                <ul className="space-y-2">
                                  {v.aiAnalysis.issues.map((issue, idx) => (
                                    <li key={idx} className={`p-2 rounded ${getSeverityColor(issue.severity)}`}>
                                      <div className="font-medium">{issue.message}</div>
                                      <div className="text-sm mt-1">{issue.suggestion}</div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div>
                              <h4 className="font-medium mb-2">Резюме</h4>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                {v.aiAnalysis.aiSummary}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => analyzeJobs([v.id])}
                      disabled={analyzing}
                      className="h-6 w-6 p-0"
                    >
                      <Brain className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/jobs/${v.id}`)}
                    className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    Подробнее
                  </Button>
                  {v.status === 'pending' && (
                    <Button 
                      size="sm" 
                      className="gap-2 bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={() => approveVacancy(v)}
                    >
                      <CheckCircle2 className="w-4 h-4" /> 
                      Одобрить
                    </Button>
                  )}
                  {v.status === 'published' && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={async () => {
                        try {
                          const resp = await fetch(`/api/admin/moderation/jobs/${v.id}`, { method: 'DELETE' })
                          if (resp.ok) {
                            setItems(prev => prev.filter(it => it.id !== v.id))
                            toast({ title: 'Удалено', description: `${v.title} — удалена` })
                          } else {
                            toast({ title: 'Ошибка', description: 'Не удалось удалить вакансию', variant: 'destructive' })
                          }
                        } catch {
                          toast({ title: 'Ошибка', description: 'Не удалось удалить вакансию', variant: 'destructive' })
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> 
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {pagination}
      </main>
    </div>
  )
}


