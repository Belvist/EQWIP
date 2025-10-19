'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import ChatComponent from '@/components/chat/ChatComponent'
import { Input } from '@/components/ui/input'

export default function ChatPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const [applicationId, setApplicationId] = useState<string | null>(null)
  type Thread = {
    id: string
    jobId?: string
    jobTitle: string
    company?: string
    status?: string
    closed?: boolean
    otherUser: { id: string; name: string }
    _lastMessage?: { content: string; createdAt: string } | null
    _unreadCount?: number
  }
  const [threads, setThreads] = useState<Thread[]>([])
  const [search, setSearch] = useState('')
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const preselectRef = useRef<string | null>(null)

  useEffect(() => {
    // Read applicationId from URL (do not set state yet to avoid race)
    try {
      const url = new URL(window.location.href)
      preselectRef.current = url.searchParams.get('applicationId')
    } catch {}

    const loadThreads = async () => {
      try {
        const res = await fetch('/api/applications')
        if (!res.ok) return
        const data = await res.json()
        const role = (session?.user as any)?.role
        const items: Thread[] = (data.applications || []).map((a: any) => {
          const isEmployer = role === 'EMPLOYER'
          const otherId = isEmployer ? a?.candidate?.user?.id : a?.job?.employer?.userId
          const otherName = isEmployer ? (a?.candidate?.user?.name || 'Кандидат') : (a?.job?.employer?.companyName || 'Компания')
          const displayTitle = a?.job?.title ? `${a.job.title}` : 'Отклик'
          return {
            id: String(a.id),
            jobId: a.job?.id,
            jobTitle: displayTitle,
            company: a.job?.employer?.companyName,
            status: a.status,
            closed: String(a.status || '').toUpperCase() === 'REJECTED',
            otherUser: { id: otherId || '', name: otherName },
            _lastMessage: a?._lastMessage ? { content: String(a._lastMessage.content || ''), createdAt: new Date(a._lastMessage.createdAt).toISOString() } : null,
            _unreadCount: Number(a?._unreadCount || 0)
          }
        })
        setThreads(items)
        // Preselect from URL if provided, otherwise first item
        if (preselectRef.current) {
          setApplicationId(preselectRef.current)
        } else if (!applicationId && items.length) {
          setApplicationId(items[0].id)
        }
      } catch {}
    }
    if (isLoggedIn) loadThreads()
  }, [isLoggedIn])

  // Загружаем пины из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('chat:pins')
      if (raw) setPinned(new Set(JSON.parse(raw)))
    } catch {}
  }, [])

  const togglePin = (id: string) => {
    setPinned(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try { localStorage.setItem('chat:pins', JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const selectThread = (id: string) => {
    setApplicationId(id)
    // Сбрасываем непрочитанные (UI-оптимизм)
    setThreads(prev => prev.map(t => (t.id === id ? { ...t, _unreadCount: 0 } : t)))
  }

  const filtered = threads.filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.jobTitle.toLowerCase().includes(q) ||
      (t.company || '').toLowerCase().includes(q) ||
      (t.otherUser?.name || '').toLowerCase().includes(q)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    const aPinned = pinned.has(a.id) ? 1 : 0
    const bPinned = pinned.has(b.id) ? 1 : 0
    if (aPinned !== bPinned) return bPinned - aPinned
    const aUnread = a._unreadCount || 0
    const bUnread = b._unreadCount || 0
    if (aUnread !== bUnread) return bUnread - aUnread
    const aTime = a._lastMessage?.createdAt ? Date.parse(a._lastMessage.createdAt) : 0
    const bTime = b._lastMessage?.createdAt ? Date.parse(b._lastMessage.createdAt) : 0
    return bTime - aTime
  })

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="p-0">
            <div className="space-y-4">
              <div className="text-xl font-semibold">Войдите, чтобы открыть чат</div>
              <Button onClick={() => (window.location.href = '/auth/signin')}>Войти</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!applicationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="p-0">
            <div className="space-y-4">
              <div className="text-lg">Выберите собеседование/отклик для чата</div>
              <div className="space-y-2 w-[560px] max-w-full">
                <Label className="text-sm">Отклики</Label>
                <Input placeholder="Поиск по названию вакансии, компании или имени" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-auto">
                  {sorted.map(t => (
                    <Button
                      key={t.id}
                      variant="outline"
                      onClick={() => selectThread(t.id)}
                      className={`w-full justify-between items-center gap-3 py-3 px-4 overflow-hidden text-left rounded-lg border transition-colors shadow-sm min-h-[72px]
                        ${t.id === applicationId
                          ? 'bg-gray-200 text-black border-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600'
                          : 'bg-transparent text-black border-gray-300 hover:bg-gray-50 dark:bg-transparent dark:text-white dark:border-gray-600 dark:hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 py-1">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base font-semibold truncate">
                              {`${t.jobTitle}${t.company || t.otherUser?.name ? ' — ' + (t.company || t.otherUser?.name) : ''}`}
                            </span>
                            {pinned.has(t.id) && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Закреплено</span>}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full">
                            {t._lastMessage?.content ? t._lastMessage.content : 'Нет сообщений'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {t._unreadCount ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-black">{t._unreadCount}</span>
                        ) : null}
                        <Button type="button" size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); togglePin(t.id) }}>
                          {pinned.has(t.id) ? 'Открепить' : 'Закрепить'}
                        </Button>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-12 gap-4 h-[calc(100vh-96px)]">
      <div className="col-span-12 md:col-span-4 h-full overflow-hidden">
        <Card className="h-full">
          <CardContent className="p-4 space-y-2 h-full overflow-y-auto">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Отклики</div>
            <Input placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
            {sorted.map(t => (
              <Button
                key={t.id}
                variant="outline"
                onClick={() => selectThread(t.id)}
                className={`w-full justify-start items-center gap-3 py-3 px-4 overflow-hidden text-left rounded-lg border transition-colors shadow-sm min-h-[72px]
                  ${t.id === applicationId
                    ? 'bg-gray-200 text-black border-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600'
                    : 'bg-transparent text-black border-gray-300 hover:bg-gray-50 dark:bg-transparent dark:text-white dark:border-gray-600 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 min-w-0 py-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {t.otherUser?.id ? (
                      <img src={`/api/profile/avatar?user=${encodeURIComponent(t.otherUser.id)}`} alt={t.otherUser.name} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base font-semibold truncate">
                        {`${t.jobTitle}${t.company || t.otherUser?.name ? ' — ' + (t.company || t.otherUser?.name) : ''}`}
                      </span>
                      {pinned.has(t.id) && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Закреплено</span>}
                      {t._unreadCount ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-black">{t._unreadCount}</span> : null}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full">
                      {t._lastMessage?.content ? t._lastMessage.content : 'Нет сообщений'}
                    </div>
                  </div>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); togglePin(t.id) }}>
                  {pinned.has(t.id) ? 'Открепить' : 'Закрепить'}
                </Button>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="col-span-12 md:col-span-8 h-full overflow-hidden">
        <ChatComponent 
          applicationId={applicationId}
          jobId={threads.find(t => t.id === applicationId)?.jobId}
          otherUser={threads.find(t => t.id === applicationId)?.otherUser || { id: 'unknown', name: 'Собеседник' }}
          closed={!!threads.find(t => t.id === applicationId)?.closed}
        />
      </div>
    </div>
  )
}


