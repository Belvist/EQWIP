'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send,
  MoreVertical,
  Info,
  Trash2,
  Check,
  CheckCheck,
  Paperclip,
  ExternalLink
} from 'lucide-react'

interface Message {
  id: string
  content: string
  attachments?: { url: string; name: string }[]
  sender: {
    id: string
    name: string
    avatar?: string
  }
  receiver: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  isRead: boolean
}

interface ChatComponentProps {
  applicationId: string
  jobId?: string
  otherUser: {
    id: string
    name: string
    avatar?: string
    title?: string
    companyName?: string
  }
  messages?: Message[]
  onMessageSent?: (message: Message) => void
  closed?: boolean
}

export default function ChatComponent({ 
  applicationId, 
  jobId,
  otherUser, 
  messages: initialMessages = [],
  onMessageSent,
  closed = false,
}: ChatComponentProps) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = (session?.user as any)?.id as string | undefined
  const currentUserEmail = session?.user?.email ?? undefined
  const currentUserImage = (session?.user as any)?.image as string | undefined
  const currentUserName = session?.user?.name ?? 'You'
  const [otherUserOnline, setOtherUserOnline] = useState<boolean>(false)
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<number | null>(null)
  const [windowFocused, setWindowFocused] = useState<boolean>(true)
  const [pageVisible, setPageVisible] = useState<boolean>(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)
  const joinedRoomRef = useRef<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  // Шаблоны удалены по запросу — чистый чат без быстрых вставок

  // Сброс онлайна/последнего входа при переключении чатов/собеседника
  useEffect(() => {
    setOtherUserOnline(false)
    setOtherUserLastSeen(null)
    joinedRoomRef.current = false
    pendingUnreadRef.current = []
  }, [applicationId, otherUser?.id])

  // Локальная санитизация отображаемого текста: полностью удаляем base64/данные data:URI
  const sanitizeContent = (value: string): string => {
    if (!value) return ''
    let text = String(value)
    // Удалить data: URI с base64
    text = text.replace(/data:[^;\s]+;base64,[A-Za-z0-9+/=]+/gi, '')
    // Удалить длинные base64-подобные последовательности
    try {
      text = text.replace(/(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9+/=])/g, '')
    } catch {
      // Фолбэк для окружений без поддержи lookbehind
      text = text.replace(/[A-Za-z0-9+/]{48,}={0,2}/g, '')
    }
    text = text.trim()
    if (!text.length) return '[пусто]'
    return text
  }

  const escapeHtml = (s: string): string =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const renderMessageHtml = (raw: string): { __html: string } => {
    const safe = sanitizeContent(raw)
    const escaped = escapeHtml(safe)
    // markdown-lite: **bold**, linkify, new lines
    const withBold = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    const linkified = withBold.replace(/(https?:\/\/[^\s<]+)/g, (m) =>
      `<a href="${m}" target="_blank" rel="noopener noreferrer" class="underline text-gray-900 dark:text-white hover:opacity-80">${m}</a>`
    )
    const withBreaks = linkified.replace(/\n/g, '<br/>')
    return { __html: withBreaks }
  }

  const extractAttachments = (message: Message): Array<{ url: string; name: string }> => {
    const list: Array<{ url: string; name: string }> = []
    // structured
    if (Array.isArray(message.attachments)) {
      for (const a of message.attachments) {
        if (a?.url) list.push({ url: a.url, name: a.name || 'Файл' })
      }
    }
    // from text lines: "Вложение: NAME — URL"
    if (message.content) {
      const lines = String(message.content).split(/\n+/)
      for (const ln of lines) {
        const m = ln.match(/^\s*Вложение:\s*(.+?)\s*—\s*(https?:\/\/\S+)/i)
        if (m) list.push({ name: m[1].trim(), url: m[2].trim() })
      }
    }
    // dedupe by url
    const seen = new Set<string>()
    return list.filter((a) => (a.url && !seen.has(a.url) && seen.add(a.url)))
  }

  const dedupeAndSortByCreatedAt = (list: Message[]): Message[] => {
    const byId = new Map<string, Message>()
    for (const m of list) {
      byId.set(m.id, m)
    }
    return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  // Timers to correctly toggle typing indicators
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const otherTypingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUnreadRef = useRef<string[]>([])
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const isNearBottomRef = useRef<boolean>(true)
  const isLoadingHistoryRef = useRef<boolean>(false)
  const historyCursorRef = useRef<string | null>(null)
  const hasMoreHistoryRef = useRef<boolean>(true)

  const updateNearBottomFlag = () => {
    const el = scrollViewportRef.current
    if (!el) {
      isNearBottomRef.current = true
      return
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottomRef.current = distance < 120
  }

  // Подгрузка более старых сообщений при скролле к верху
  const maybeLoadOlder = async () => {
    if (isLoadingHistoryRef.current) return
    if (!hasMoreHistoryRef.current) return
    const el = scrollViewportRef.current
    if (!el) return
    if (el.scrollTop > 120) return

    isLoadingHistoryRef.current = true
    const prevHeight = el.scrollHeight
    const qs = new URLSearchParams()
    qs.set('applicationId', applicationId)
    qs.set('limit', '30')
    if (historyCursorRef.current) qs.set('before', historyCursorRef.current)
    try {
      const res = await fetch(`/api/messages?${qs.toString()}`)
      if (!res.ok) return
      const payload = await res.json()
      const list = (payload?.data || []) as Message[]
      const page = payload?.page || {}
      const earliest = list[0]?.createdAt
      if (list.length) {
        setMessages(prev => dedupeAndSortByCreatedAt([...list, ...prev]))
      }
      historyCursorRef.current = page?.nextBefore || earliest || historyCursorRef.current
      hasMoreHistoryRef.current = !!page?.hasMore && list.length > 0
      // Восстановить позицию скролла после prepend
      setTimeout(() => {
        const newHeight = el.scrollHeight
        const delta = newHeight - prevHeight
        el.scrollTop = el.scrollTop + delta
      }, 0)
    } finally {
      isLoadingHistoryRef.current = false
    }
  }

  // Клиентская расшифровка и повторные попытки отключены — сервер отдаёт сразу открытый текст

  useEffect(() => {
    if (!currentUserEmail || !applicationId) return

    const socketInstance = io({
      path: '/socket.io',
      transports: ['websocket'],
      auth: {
        token: currentUserEmail
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      setIsConnected(true)
      // Join the application room
      socketInstance.emit('join_room', {
        applicationId,
        userId: currentUserId
      })
      joinedRoomRef.current = false
      // flush pending unread marks
      if (pendingUnreadRef.current.length > 0) {
        socketInstance.emit('mark_read', { applicationId, messageIds: pendingUnreadRef.current })
        pendingUnreadRef.current = []
      }
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('connected', (data) => {
      console.log('Connected to chat server:', data)
    })

    socketInstance.on('new_message', (message: Message) => {
      // Сервер теперь всегда шлёт открытый текст для получателей.
      setMessages(prev => [...prev, message])
      if (onMessageSent) onMessageSent(message)
      if (message.sender.id !== currentUserId) {
        // Не помечаем мгновенно. Сохраняем в очередь и попытаемся сбросить, когда пользователь реально видит чат.
        pendingUnreadRef.current = Array.from(new Set([...pendingUnreadRef.current, message.id]))
        tryFlushRead()
      }
    })

    socketInstance.on('user_joined', (data) => {
      if (data?.userId === otherUser.id) {
        setOtherUserOnline(true)
        setOtherUserLastSeen(null)
      }
    })

    socketInstance.on('user_left', (data) => {
      // как только собеседник вышел — гасим индикатор печати на всякий случай
      setOtherUserTyping(false)
      if (data?.userId === otherUser.id) {
        setOtherUserOnline(false)
        setOtherUserLastSeen(Date.now())
      }
    })

    socketInstance.on('room_users', (data: { userIds: string[] }) => {
      // online если собеседник присутствует в комнате
      const online = Array.isArray(data?.userIds) && data.userIds.includes(otherUser.id)
      setOtherUserOnline(online)
      if (online) setOtherUserLastSeen(null)
      // Получили состояние комнаты — считаем, что мы присоединились успешно
      joinedRoomRef.current = true
      tryFlushRead()
    })

    socketInstance.on('presence', (data: { userId: string; online: boolean; lastSeenAt?: number }) => {
      if (data.userId === otherUser.id) {
        setOtherUserOnline(!!data.online)
        if (!data.online && data.lastSeenAt) setOtherUserLastSeen(data.lastSeenAt)
      }
    })

    socketInstance.on('user_typing', (data) => {
      if (data.userId !== currentUserId) {
        if (data.isTyping) {
          setOtherUserTyping(true)
          if (otherTypingClearTimerRef.current) {
            clearTimeout(otherTypingClearTimerRef.current)
          }
          otherTypingClearTimerRef.current = setTimeout(() => {
            setOtherUserTyping(false)
            otherTypingClearTimerRef.current = null
          }, 2500)
        } else {
          setOtherUserTyping(false)
          if (otherTypingClearTimerRef.current) {
            clearTimeout(otherTypingClearTimerRef.current)
            otherTypingClearTimerRef.current = null
          }
        }
      }
    })

    socketInstance.on('messages_read', (data) => {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg.id) 
          ? { ...msg, isRead: true }
          : msg
      ))
    })

    socketInstance.on('message_saved', (data: { tempId?: string; id: string; createdAt?: string }) => {
      if (!data?.tempId || !data?.id) return
      setMessages(prev => prev.map(m => (m.id === data.tempId ? { ...m, id: data.id, createdAt: data.createdAt || m.createdAt } : m)))
    })

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error)
    })

    socketInstance.on('connect_error', () => setIsConnected(false))
    try {
      // Manager-level reconnect events
      // @ts-ignore
      const mgr = socketInstance.io
      mgr.on?.('reconnect', () => setIsConnected(true))
      mgr.on?.('reconnect_error', () => setIsConnected(false))
      mgr.on?.('reconnect_failed', () => setIsConnected(false))
    } catch {}

    return () => {
      if (typingIdleTimerRef.current) {
        clearTimeout(typingIdleTimerRef.current)
        typingIdleTimerRef.current = null
      }
      if (otherTypingClearTimerRef.current) {
        clearTimeout(otherTypingClearTimerRef.current)
        otherTypingClearTimerRef.current = null
      }
      joinedRoomRef.current = false
      socketInstance.off('new_message')
      socketInstance.off('user_joined')
      socketInstance.off('user_left')
      socketInstance.off('user_typing')
      socketInstance.off('messages_read')
      socketInstance.off('message_saved')
      socketInstance.off('presence')
      socketInstance.disconnect()
    }
  }, [currentUserEmail, currentUserId, applicationId])

  // Initial history load (persisted messages) — сервер возвращает уже расшифрованный текст
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/messages?applicationId=${encodeURIComponent(applicationId)}&limit=30`)
        if (!res.ok) return
        const payload = await res.json()
        const list = (payload?.data || []) as Message[]
        setMessages(list)
        const page = payload?.page || {}
        historyCursorRef.current = page?.nextBefore || (list[0]?.createdAt ?? null)
        hasMoreHistoryRef.current = !!page?.hasMore
        // Автоскролл при первом входе в чат
        setTimeout(() => scrollToBottom(), 50)
        // Сохраняем непрочитанные входящие в очередь; отметим прочитанными, когда условия видимости выполнены
        const unreadIds = list.filter(m => !m.isRead && m.receiver.id === currentUserId).map(m => m.id)
        if (unreadIds.length) pendingUnreadRef.current = Array.from(new Set([...
          pendingUnreadRef.current, ...unreadIds
        ]))
        tryFlushRead()
      } catch {}
    }
    if (applicationId) loadHistory()
  }, [applicationId])

  // Больше не автоскроллим на каждое новое сообщение, чтобы лента не "подпрыгивала"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Опционально: автоскроллить только когда сообщение отправил текущий пользователь
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last) return
    if (isCurrentUser(last.sender.id)) {
      scrollToBottom()
    } else {
      // Автоскроллим входящие только если пользователь у нижней кромки
      if (isNearBottomRef.current) scrollToBottom()
    }
    // иначе оставляем позицию
    // Попробуем отметить прочитанными, если условия выполнены
    tryFlushRead()
  }, [messages])

  // Отслеживаем фокус окна и видимость вкладки, чтобы отмечать прочитанное только при активном просмотре
  useEffect(() => {
    const onFocus = () => { setWindowFocused(true); tryFlushRead() }
    const onBlur = () => { setWindowFocused(false) }
    const onVis = () => { setPageVisible(document.visibilityState === 'visible'); tryFlushRead() }
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Пытаемся отправить отметку «прочитано», когда выполняются условия
  const canMarkRead = () => {
    return isConnected && windowFocused && pageVisible && joinedRoomRef.current && isNearBottomRef.current
  }

  const tryFlushRead = () => {
    if (!socket) return
    if (!pendingUnreadRef.current.length) return
    if (!canMarkRead()) return
    const ids = Array.from(new Set(pendingUnreadRef.current))
    pendingUnreadRef.current = []
    socket.emit('mark_read', { applicationId, messageIds: ids })
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const onAttachClick = () => fileInputRef.current?.click()

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (closed) return
    const list = Array.from(files)
    // Простая валидация: до 10МБ, безопасные типы
    const maxBytes = 10 * 1024 * 1024
    const allowed = [
      'image/png','image/jpeg','image/gif','image/webp','application/pdf',
      'text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const safe = list.filter(f => f.size <= maxBytes && (allowed.includes(f.type) || f.type === ''))
    if (!safe.length) return
    const fd = new FormData()
    fd.set('applicationId', applicationId)
    for (const f of safe) fd.append('files', f)
    setUploading(true)
    try {
      const res = await fetch('/api/messages/attachments', { method: 'POST', body: fd })
      if (!res.ok) return
      const out = await res.json()
      const filesMeta = Array.isArray(out?.files) ? out.files as Array<{ url: string; name: string }> : []
      if (filesMeta.length) {
        const lines = filesMeta.map(f => `Вложение: ${f.name} — ${location.origin}${f.url}`)
        setNewMessage(prev => (prev ? prev + '\n' : '') + lines.join('\n'))
      }
    } catch {
      // ignore
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !currentUserId || closed) return

    const receiverId = otherUser.id
    
    // Local display: always plain text
    const tempId = `tmp-${Date.now()}`
    socket.emit('send_message', {
      content: newMessage.trim(),
      applicationId,
      receiverId,
      clientMessageId: tempId
    })

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      
      sender: {
        id: currentUserId,
        name: currentUserName,
        avatar: currentUserImage,
      },
      receiver: {
        id: receiverId,
        name: otherUser.name,
        avatar: otherUser.avatar
      },
      createdAt: new Date().toISOString(),
      isRead: false
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewMessage(value)
    
    if (socket && isConnected && !closed) {
      const hasText = !!value.trim()
      if (!isTyping && hasText) {
        setIsTyping(true)
        socket.emit('typing', { applicationId, isTyping: true })
      }
      // Idle debounce: if нет ввода 1500мс — гасим индикатор
      if (typingIdleTimerRef.current) {
        clearTimeout(typingIdleTimerRef.current)
      }
      typingIdleTimerRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false)
          socket?.emit('typing', { applicationId, isTyping: false })
        }
        typingIdleTimerRef.current = null
      }, 1500)
    }
  }

  const formatTime = (dateString: string) => {
    const ts = Date.parse(dateString)
    if (!isFinite(ts)) return ''
    return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера'
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  const isCurrentUser = (senderId: string) => {
    return senderId === currentUserId
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.avatar ? (otherUser.avatar.startsWith('/api/') ? otherUser.avatar : `/api/profile/avatar?user=${encodeURIComponent(otherUser.id)}`) : undefined} />
              <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-200">
                {otherUser.name?.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherUser.name}</CardTitle>
              <div className="flex items-center gap-2">
                {otherUser.title && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-[#14181b] dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {otherUser.title}
                  </span>
                )}
                {otherUser.companyName && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                    {otherUser.companyName}
                  </span>
                )}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${otherUserOnline ? 'bg-gray-900 dark:bg-white' : 'bg-gray-400 dark:bg-gray-600'}`} />
                  {otherUserOnline ? (
                    <span>В сети</span>
                  ) : (
                    <span>
                      {typeof otherUserLastSeen === 'number' && isFinite(otherUserLastSeen)
                        ? `Был(а) ${new Date(otherUserLastSeen).toLocaleString('ru-RU')}`
                        : 'Не в сети'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Info */}
            <Button
              title="Информация об отклике"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (jobId) window.open(`/jobs/${encodeURIComponent(jobId)}`, '_blank')
                else window.open(`/applications`, '_blank')
              }}
            >
              <Info className="w-4 h-4" />
            </Button>
            {/* Delete chat (remove application and its messages) */}
            <Button
              title="Удалить чат и пару"
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!applicationId) return
                if (!confirm('Удалить чат и связь между работодателем и соискателем?')) return
                try {
                  const res = await fetch(`/api/applications?applicationId=${encodeURIComponent(applicationId)}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error('failed')
                  alert('Чат и пара удалены')
                  window.location.href = '/chat'
                } catch (e) {
                  alert('Не удалось удалить чат')
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {/* More */}
            <Button
              title="Действия"
              variant="ghost"
              size="sm"
              onClick={async () => {
                const modal = document.createElement('dialog')
                modal.className = 'rounded-lg p-4 w-80'
                modal.innerHTML = `
                  <form method="dialog" class="space-y-3">
                    <div class="text-sm font-medium">Действия</div>
                    <button id="clear" class="w-full text-left px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Очистить чат</button>
                    <button id="cancel" class="w-full text-left px-3 py-2 rounded border">Отмена</button>
                  </form>
                `
                document.body.appendChild(modal)
                const clearBtn = modal.querySelector('#clear') as HTMLButtonElement
                const cancelBtn = modal.querySelector('#cancel') as HTMLButtonElement
                clearBtn.addEventListener('click', async (e) => {
                  e.preventDefault()
                  if (!confirm('Удалить все сообщения и вложения этого чата?')) return
                  try {
                    const res = await fetch(`/api/messages?applicationId=${encodeURIComponent(applicationId)}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error('failed')
                    setMessages([])
                    alert('Чат очищен')
                  } catch {
                    alert('Не удалось очистить чат')
                  } finally {
                    modal.close()
                    modal.remove()
                  }
                })
                cancelBtn.addEventListener('click', (e) => {
                  e.preventDefault()
                  modal.close()
                  modal.remove()
                })
                modal.showModal()
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4 overflow-y-auto" onScrollCapture={() => { updateNearBottomFlag(); maybeLoadOlder() }}>
          <div ref={(el) => { scrollViewportRef.current = el }} className="space-y-4 pb-4">
            {Object.entries(messageGroups).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex items-center justify-center my-4">
                  <div className="bg-white/80 dark:bg-black/40 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                    {formatDate(date)}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {dateMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser(message.sender.id) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg border ${
                          isCurrentUser(message.sender.id)
                            ? 'bg-gray-800 text-white border-gray-700'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={renderMessageHtml(message.content)} />
                        {(() => {
                          const atts = extractAttachments(message)
                          if (!atts.length) return null
                          return (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {atts.map((a, i) => (
                                <a
                                  key={i}
                                  href={a.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${
                                    isCurrentUser(message.sender.id)
                                      ? 'bg-gray-700/60 text-gray-100 border-gray-600 hover:bg-gray-700'
                                      : 'bg-white/70 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                                  title={a.name}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                  <span className="truncate max-w-[180px]">{a.name}</span>
                                </a>
                              ))}
                            </div>
                          )
                        })()}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isCurrentUser(message.sender.id) ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.createdAt)}
                          </span>
                          {isCurrentUser(message.sender.id) && (
                            message.isRead ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-white/90 dark:bg-[#0f1113]/90 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-200/70 dark:border-gray-700/60">
                  <div className="flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:100ms]" />
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:200ms]" />
                    </div>
                    <span className="text-xs">{otherUser.name} печатает...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Composer */}
        <div className="border-t p-4">
          {closed ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Чат закрыт. Связь с кандидатом завершена.
            </div>
          ) : (
            <div className="flex items-end gap-2">
              {/* attachments */}
              <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*,application/pdf,text/plain,.doc,.docx" onChange={(e) => uploadFiles(e.target.files)} />
              <Button type="button" title="Прикрепить файлы" variant="ghost" size="sm" onClick={onAttachClick} disabled={!isConnected || uploading}>
                <Paperclip className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Напишите сообщение..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-[#0f1113] dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-700 dark:focus:ring-gray-400"
                    rows={2}
                    disabled={!isConnected}
                  />
                  {/* send button positioned inside input, vertically centered */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <Button
                      onClick={sendMessage}
                      disabled={!isConnected || !newMessage.trim() || uploading}
                      size="sm"
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* templates feature removed */}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}