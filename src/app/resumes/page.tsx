"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Footer from '@/components/Footer'
// Replaced Badge with inline styled spans to avoid dependency/type issues in this page
import { FileText, Plus, Sparkles, Trash2, Star, Loader2, RefreshCw, Wand2, Download, Share2 } from 'lucide-react'

interface ResumeListItem {
  id: string
  title: string
  updatedAt: string
  isDefault: boolean
  data?: any
}

export default function ResumesPage() {
  const { status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ResumeListItem[]>([])
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiBlock, setAiBlock] = useState<any | null>(null)
  const hasItems = useMemo(() => items.length > 0, [items])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/resumes')
      if (res.ok) {
        const data = await res.json()
        setItems(data.resumes || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) load()
  }, [isLoggedIn])

  const setDefault = async (id: string) => {
    const prev = items
    setItems((list) => list.map((i) => ({ ...i, isDefault: i.id === id })))
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
      if (!res.ok) throw new Error('Failed to set default')
    } catch {
      setItems(prev)
    }
  }

  const removeResume = async (id: string) => {
    const prev = items
    setItems((list) => list.filter((i) => i.id !== id))
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    } catch {
      setItems(prev)
    }
  }

  const optimizeResume = async (id: string) => {
    try {
      setAiLoading(id)
      setAiBlock(null)
      const res = await fetch(`/api/resumes/${id}`)
      if (!res.ok) return
      const resume = await res.json()
      const role = (resume?.data?.targetJob?.title || '') as string

      // 1) Поиск по интернету до вызова AI
      const fetchText = async (url: string): Promise<string> => {
        try {
          const proxied = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`
          const r = await fetch(proxied, { cache: 'no-store' })
          if (!r.ok) return ''
          return (await r.text()).slice(0, 4000)
        } catch {
          return ''
        }
      }
      const searchSources = async (query: string): Promise<Array<{ url: string; excerpt: string }>> => {
        try {
          const searchUrl = `https://r.jina.ai/http://www.bing.com/search?q=${encodeURIComponent(query)}`
          const r = await fetch(searchUrl, { cache: 'no-store' })
          if (!r.ok) return []
          const t = await r.text()
          const urls = Array.from(new Set((t.match(/https?:\/\/[^\s)]+/g) || [])
            .filter(u => !/bing\.com|microsoft\.com|r\.jina\.ai/.test(u))))
            .slice(0, 5)
          const out: Array<{ url: string; excerpt: string }> = []
          for (const u of urls) {
            const excerpt = await fetchText(u)
            if (excerpt) out.push({ url: u, excerpt })
            if (out.length >= 5) break
          }
          return out
        } catch {
          return []
        }
      }

      const guessRole = role || String(resume?.data?.experience?.[0]?.title || '').trim()
      const query = guessRole ? `ключевые метрики и KPI для роли ${guessRole}` : ''
      const sources: Array<{ url: string; excerpt: string }> = query ? await searchSources(query) : []

      // Подмешать результаты поиска к запросу AI (если есть)
      const sourcesText = sources
        .slice(0, 5)
        .map((s, i) => `${i + 1}. ${s.url}\n${s.excerpt.slice(0, 1000)}`)
        .join('\n\n')

      // 2) Запуск асинхронной оптимизации (Cloudflare-safe)
      const startRes = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-async': '1' },
        body: JSON.stringify({
          action: 'optimize',
          resumeText: JSON.stringify(resume?.data || {}),
          targetRole: role || guessRole || undefined,
          jobDescription: `Target Role: ${guessRole || role}`,
          webResults: sourcesText,
          async: true,
        })
      })

      // Если сервер вернул 202 — получаем jobId и начинаем polling
      if (startRes.status === 202) {
        let startPayload: any = {}
        try { startPayload = await startRes.json() } catch {}
        const jobId = String(startPayload?.jobId || '')
        if (!jobId) {
          setAiBlock({ error: 'AI: jobId missing' })
          return
        }
        const startedAt = Date.now()
        const timeoutMs = 90000
        const intervalMs = 1500
        while (Date.now() - startedAt < timeoutMs) {
          await new Promise((r) => setTimeout(r, intervalMs))
          const st = await fetch(`/api/ai/resume?jobId=${encodeURIComponent(jobId)}`, { cache: 'no-store' })
          if (!st.ok) continue
          let p: any = {}
          try { p = await st.json() } catch { continue }
          if (p?.status === 'done' && p?.result?.optimization) {
            setAiBlock(p.result.optimization)
            return
          }
          if (p?.status === 'error') {
            setAiBlock({ error: p?.error || 'AI error' })
            return
          }
        }
        setAiBlock({ error: 'AI timeout' })
        return
      }

      // Иначе — возможен прямой ответ (без async). Обрабатываем как раньше
      if (!startRes.ok) {
        let errPayload: any = null
        try { errPayload = await startRes.json() } catch {}
        setAiBlock(errPayload || { error: `AI error ${startRes.status}` })
        return
      }
      const direct = await startRes.json()
      setAiBlock(direct.optimization || direct)
    } finally {
      setAiLoading(null)
    }
  }

  const analyzeForJob = async (id: string) => {
    const jobDescription = window.prompt('Вставьте описание вакансии для анализа соответствия (RU/EN):')
    if (!jobDescription) return
    try {
      setAiLoading(id)
      setAiBlock(null)
      const res = await fetch(`/api/resumes/${id}`)
      if (!res.ok) return
      const resume = await res.json()
      const aiRes = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', resumeText: JSON.stringify(resume?.data || {}), jobDescription })
      })
      if (!aiRes.ok) return
      const data = await aiRes.json()
      setAiBlock(data.analysis || data)
    } finally {
      setAiLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-gray-600 dark:text-gray-300" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Мои резюме</h1>
              <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-zinc-900">Beta</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={load} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Обновить
              </Button>
              <Button onClick={() => (window.location.href = '/resumes/create')} className="gap-2">
                <Plus className="w-4 h-4" /> Создать резюме
              </Button>
            </div>
          </div>

          {/* AI block */}
          {aiBlock && (
            <Card className="mb-8 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI‑результаты</h3>
                  </div>
                  {aiBlock.overallScore && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">Score {aiBlock.overallScore}</span>
                      {aiBlock.atsScore && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">ATS {aiBlock.atsScore}</span>}
                      {aiBlock.contentScore && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Content {aiBlock.contentScore}</span>}
                    </div>
                  )}
                </div>

                {aiBlock.warning && (
                  <div className="text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30 rounded-lg p-3 text-sm">
                    {aiBlock.warning}
                  </div>
                )}

                {Array.isArray(aiBlock.suggestions) && aiBlock.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">Предложения</h4>
                    <ul className="space-y-2">
                      {aiBlock.suggestions.map((s: any, i: number) => (
                        <li key={i} className="border rounded-lg p-3 flex gap-3 items-start">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0">{s.section || s.type}</span>
                          <div className="text-sm">
                            <div className="font-medium">{s.suggested || s.recommendation || 'Уточнение'}</div>
                            {s.reason && <div className="text-gray-500 mt-1">{s.reason}</div>}
                          </div>
                          {s.priority && (
                            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${s.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : s.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{s.priority}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(aiBlock.keywordOptimizations) && aiBlock.keywordOptimizations.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">Ключевые слова</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiBlock.keywordOptimizations[0]?.suggestedKeywords?.map((k: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(aiBlock.targetedMetrics) && aiBlock.targetedMetrics.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">Метрики под вакансию</h4>
                    <ul className="space-y-2">
                      {aiBlock.targetedMetrics.map((m: any, idx: number) => (
                        <li key={idx} className="border rounded-lg p-3">
                          <div className="text-sm"><span className="font-medium">{m.area}:</span> {m.metric}</div>
                          {m.why && <div className="text-xs text-gray-500 mt-1">Почему: {m.why}</div>}
                          {m.exampleLine && <div className="text-xs text-gray-500 mt-1">Пример: {m.exampleLine}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(aiBlock.roleMetricsFromWeb) && aiBlock.roleMetricsFromWeb.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">Ключевые метрики из источников</h4>
                    <ul className="space-y-2">
                      {aiBlock.roleMetricsFromWeb.map((m: any, idx: number) => (
                        <li key={idx} className="border rounded-lg p-3">
                          <div className="text-sm font-medium">{m.metric}</div>
                          {m.why && <div className="text-xs text-gray-500 mt-1">Почему: {m.why}</div>}
                          {m.example && <div className="text-xs text-gray-500 mt-1">Пример: {m.example}</div>}
                          {m.sourceUrl && <a className="text-xs text-gray-600 underline" href={m.sourceUrl} target="_blank" rel="noreferrer">Источник</a>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(aiBlock.roleMetricsByRole) && aiBlock.roleMetricsByRole.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">Ключевые метрики по ролям</h4>
                    <div className="space-y-4">
                      {aiBlock.roleMetricsByRole.map((r: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="font-medium mb-2">{r.role}</div>
                          <ul className="space-y-2">
                            {(r.metrics || []).map((m: any, j: number) => (
                              <li key={j} className="text-sm">
                                <div className="font-medium">{m.metric}</div>
                                {m.why && <div className="text-xs text-gray-500">Почему: {m.why}</div>}
                                {m.example && <div className="text-xs text-gray-500">Пример: {m.example}</div>}
                                {m.sourceUrl && <a className="text-xs text-gray-600 underline" href={m.sourceUrl} target="_blank" rel="noreferrer">Источник</a>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!aiBlock.suggestions && !aiBlock.keywordOptimizations && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">Детали AI скрыты из соображений безопасности.</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !hasItems && (
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8 text-center">
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <Wand2 className="w-10 h-10 text-gray-500" />
                  <p className="text-gray-600 dark:text-gray-400">У вас пока нет резюме. Создайте первое с помощью AI.</p>
                  <Button onClick={() => (window.location.href = '/resumes/create')} className="gap-2">
                    <Plus className="w-4 h-4" /> Создать резюме
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List */}
          <div className="grid gap-4">
            {items.map((r) => {
              const displayTitle = (r as any)?.data?.targetJob?.title || r.title
              return (
              <Card
                key={r.id}
                className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                onClick={() => (window.location.href = `/resumes/${r.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{displayTitle}</h3>
                        {r.isDefault && (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-zinc-900">
                            По умолчанию
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Обновлено: {new Date(r.updatedAt).toLocaleString('ru-RU')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => { e.stopPropagation(); setDefault(r.id) }}
                        disabled={r.isDefault}
                      >
                        <Star className="w-4 h-4" /> Сделать основным
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => { e.stopPropagation(); (window.location.href = `/resumes/${r.id}/edit`) }}
                      >
                        Редактировать
                      </Button>
                      {/* PDF button removed per request */}
                      {/* Share button remains */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => { e.stopPropagation(); optimizeResume(r.id) }}
                        disabled={aiLoading === r.id}
                      >
                        {aiLoading === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI-оптимизация
                      </Button>
                      {/* Анализ под вакансию убран по запросу */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => { e.stopPropagation(); removeResume(r.id) }}
                      >
                        <Trash2 className="w-4 h-4" /> Удалить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка...
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}