'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Menu, 
  X, 
  User, 
  Briefcase, 
  Bell, 
  Moon, 
  Sun,
  ChevronDown,
  LogIn,
  Plus,
  Building,
  Users,
  FileText,
  Settings,
  LogOut,
  Home,
  Star,
  BookOpen,
  MessageSquare,
  Brain,
  Target,
  BarChart3,
  Shield,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { io } from 'socket.io-client'
import { useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import aiStyles from '@/styles/ai.module.css'
import { Unbounded } from 'next/font/google'

const unbounded = Unbounded({ subsets: ['latin', 'cyrillic'], weight: ['800'] })
import searchBackdrop from '@/styles/search-modal.module.css'
// NextAuth is the source of truth for auth
interface HeaderNotification {
  id: string | number
  title: string
  message: string
  time: string
  read: boolean
  type?: string
  data?: any
  href?: string | null
  jobTitle?: string
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [universityOverride, setUniversityOverride] = useState(false)
  // Подсказки (вкладки): вакансии, компании. Навыки отключаем по требованию.
  const [suggestions, setSuggestions] = useState<Array<any>>([])
  const [activeTab, setActiveTab] = useState<'jobs' | 'companies' | 'candidates'>('jobs')
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searchFocused, setSearchFocused] = useState(false)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Встроенный компонент популярных тегов (подгрузка с бэкенда)
  const PopularTags = ({ onPick }: { onPick: (t: string) => void }) => {
    const [tags, setTags] = useState<string[]>([])
    useEffect(() => {
      let cancelled = false
      const load = async () => {
        try {
          const res = await fetch('/api/jobs/popular-tags', { cache: 'no-store' })
          const data = res.ok ? await res.json() : { tags: [] }
          if (!cancelled) setTags(Array.isArray(data.tags) ? data.tags : [])
        } catch {
          if (!cancelled) setTags([])
        }
      }
      load()
      return () => { cancelled = true }
    }, [])
    return (
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 8).map(tag => (
          <button
            key={tag}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-sm transition-colors"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(tag)}
          >{tag}</button>
        ))}
      </div>
    )
  }
  // Ensure portal mounts only on client
  useEffect(() => {
    setPortalEl(document.body)
  }, [])

  // Blur underlying app and lock scroll when modal open
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    if (isSearchOpen) {
      root.classList.add('search-blur-active')
      body.style.overflow = 'hidden'
    } else {
      root.classList.remove('search-blur-active')
      body.style.overflow = ''
    }
    return () => {
      root.classList.remove('search-blur-active')
      body.style.overflow = ''
    }
  }, [isSearchOpen])
  const isLoggedIn = status === 'authenticated'
  const rawRole = (session?.user as any)?.role as string | undefined
  const userRole = rawRole === 'CANDIDATE'
    ? 'jobseeker'
    : rawRole === 'EMPLOYER'
      ? 'employer'
      : rawRole === 'ADMIN'
        ? 'admin'
        : rawRole === 'UNIVERSITY' ? 'university' : (universityOverride ? 'university' : null)

  // Main navigation for all users
  const mainNavigation = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Вакансии', href: '/jobs', icon: Briefcase },
    { name: 'Компании', href: '/companies', icon: Building },
  ]

  // Job seeker navigation
  const jobseekerNavigation = [
    // Убрали «Найти работу» из шапки по требованию
    { name: 'Создать резюме', href: '/resumes/create', icon: FileText },
    { name: 'AI-рекомендации', href: '/ai-recommendations', icon: Brain },
    { name: 'Карта карьеры', href: '/career-map', icon: Target },
  ]

  // Employer navigation
  const employerNavigation = [
    { name: 'Разместить вакансию', href: '/employer/jobs/create', icon: Plus },
    { name: 'Найти кандидатов', href: '/employer/candidates', icon: Users },
    { name: 'Заявки от вузов', href: '/employer/internship-applications', icon: FileText },
    { name: 'Управление откликами', href: '/employer/applications', icon: MessageSquare },
    { name: 'Тарифы', href: '/employer/pricing', icon: Star },
    { name: 'Аналитика', href: '/employer/analytics', icon: BarChart3 },
  ]

  // University navigation
  const universityNavigation = [
    { name: 'Панель вуза', href: '/university', icon: BookOpen },
    { name: 'Подать заявку', href: '/internships/create', icon: Plus },
    { name: 'Мои заявки', href: '/university/postings', icon: FileText },
    { name: 'Ответы компаний', href: '/university/applications', icon: MessageSquare },
  ]

  // Admin navigation
  const adminNavigation = [
    { name: 'Панель администратора', href: '/admin', icon: Shield },
    { name: 'Модерация', href: '/admin/moderation/vacancies', icon: Briefcase },
    { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
  ]

  // About platform navigation
  const aboutNavigation = [
    { name: 'О нас', href: '/about', icon: Building },
    { name: 'AI-возможности', href: '/ai-features', icon: Brain },
    { name: 'Правила', href: '/terms', icon: Shield },
    { name: 'Конфиденциальность', href: '/privacy', icon: Shield },
  ]

  // Support navigation
  const supportNavigation = [
    { name: 'Помощь', href: '/help', icon: HelpCircle },
    { name: 'Контакты', href: '/contacts', icon: MessageSquare },
  ]

  // Get current navigation based on user role
  const getCurrentNavigation = () => {
    if (userRole === 'jobseeker') return [...mainNavigation, ...jobseekerNavigation]
    if (userRole === 'employer') return [...mainNavigation, ...employerNavigation]
    if (userRole === 'university') {
      // For universities hide Jobs and Companies from top-level nav and show university-specific items
      const base = mainNavigation.filter(i => i.name !== 'Вакансии' && i.name !== 'Компании')
      return [...base, ...universityNavigation]
    }
    if (userRole === 'admin') {
      // For admins show all main navigation plus admin-specific items
      return [...mainNavigation, ...adminNavigation]
    }
    return mainNavigation
  }

  const profileHref = userRole === 'admin' ? '/admin' : (userRole === 'employer' ? '/employer' : (userRole === 'university' ? '/university/profile' : '/profile'))
  const authedMenuBase = [
    { name: 'Профиль', href: profileHref, icon: User },
    { name: 'Мои резюме', href: '/resumes', icon: FileText, role: 'jobseeker' },
    { name: 'Мои вакансии', href: '/employer/jobs', icon: Briefcase, role: 'employer' },
    { name: 'Отклики', href: '/otkliki', icon: MessageSquare, role: 'jobseeker' },
    { name: 'Чат', href: '/chat', icon: MessageSquare },
    { name: 'Кандидаты', href: '/employer/candidates', icon: Users, role: 'employer' },
    { name: 'Управление откликами', href: '/employer/applications', icon: MessageSquare, role: 'employer' },
    { name: 'Панель вуза', href: '/university', icon: BookOpen, role: 'university' },
    { name: 'Мои публикации (вуза)', href: '/university/postings', icon: FileText, role: 'university' },
    { name: 'Настройки', href: '/settings', icon: Settings },
    { name: 'Избранное', href: '/favorites', icon: Star },
  ]

  // Filter user menu based on role
  const getAuthedMenu = () => {
    if (userRole === 'admin') {
      return [
        { name: 'Панель администратора', href: '/admin', icon: Shield },
        { name: 'Модерация', href: '/admin/moderation/vacancies', icon: Briefcase },
        { name: 'Настройки', href: '/settings', icon: Settings },
      ]
    } else if (userRole === 'jobseeker') {
      return authedMenuBase.filter(item => !item.role || item.role === 'jobseeker')
    } else if (userRole === 'employer') {
      return authedMenuBase.filter(item => !item.role || item.role === 'employer')
    } else if (userRole === 'university') {
      return authedMenuBase.filter(item => !item.role || item.role === 'university')
    }
    return authedMenuBase.filter(item => !item.role)
  }

  const guestMenu = [
    { name: 'Войти', href: '/auth/signin', icon: LogIn },
    { name: 'Помощь', href: '/help', icon: HelpCircle },
    { name: 'Контакты', href: '/contacts', icon: MessageSquare },
  ]

  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const parseJsonLoose = (text: string): any | undefined => {
    const s = (text || '').trim()
    if (!s) return undefined
    const first = s.indexOf('{')
    const last = s.lastIndexOf('}')
    if (first >= 0 && last > first) {
      try { return JSON.parse(s.slice(first, last + 1)) } catch { /* noop */ }
    }
    return undefined
  }
  const isAiFeedbackHeader = (t?: string, title?: string, payload?: any) => {
    const tt = String(t || '').toUpperCase()
    const tl = String(title || '').toUpperCase()
    return tt === 'AI_FEEDBACK' || tl === 'AI_FEEDBACK' || !!(payload && (payload.reason || payload.jobId || payload.feedback))
  }
  const humanizeReason = (reason?: string) => {
    if (!reason) return ''
    const map: Record<string, string> = {
      not_interested: 'Не заинтересован',
      salary_too_low: 'Низкая зарплата',
      location_mismatch: 'Локация не подходит',
      skills_mismatch: 'Навыки не подходят',
      other: 'Другая причина',
    }
    return map[reason] || reason.replace(/_/g, ' ')
  }
  const normalizeHeaderNotification = (n: any): HeaderNotification => {
    const title = String(n?.title || '')
    const message = String(n?.message || '')
    const payload = n?.data && typeof n.data === 'object' ? n.data : parseJsonLoose(message)
    const rawType = n?.type ? String(n.type) : ''
    const type = isAiFeedbackHeader(rawType, title, payload) ? 'AI_FEEDBACK' : (rawType || 'SYSTEM')
    const href = payload?.jobId ? `/jobs/${payload.jobId}` : (typeof payload?.actionUrl === 'string' ? payload.actionUrl : null)
    return {
      id: n?.id ?? crypto.randomUUID?.() ?? String(Date.now()),
      title,
      message,
      time: n?.createdAt ? new Date(n.createdAt).toLocaleString() : new Date().toLocaleString(),
      read: !!n?.isRead,
      type,
      data: payload,
      href,
      jobTitle: undefined,
    }
  }
  const hydrateJobTitles = async (items: HeaderNotification[]) => {
    const withJob = items.filter(n => n.data?.jobId)
    const results = await Promise.all(withJob.map(async (n) => {
      try {
        const r = await fetch(`/api/jobs/${n.data.jobId}`)
        if (r.ok) {
          const j = await r.json()
          return { id: n.id, title: j?.title as string | undefined }
        }
      } catch {}
      return { id: n.id, title: undefined as string | undefined }
    }))
    const idToTitle = new Map(results.map(r => [r.id, r.title]))
    return items.map(n => ({ ...n, jobTitle: n.jobTitle ?? idToTitle.get(n.id) }))
  }
  const fetchHeaderNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const base = Array.isArray(data) ? data.map((n: any) => normalizeHeaderNotification(n)) : []
      const hydrated = await hydrateJobTitles(base)
      setNotifications(hydrated)
    } catch {}
  }
  const markHeaderNotificationRead = async (id: string | number) => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationIds: [id], markAsRead: true }) })
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    } catch {}
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  // Live notifications via WebSocket
  useEffect(() => {
    if (!isLoggedIn || !session?.user?.email) return
    const socket = io({ path: '/socket.io', transports: ['websocket'], auth: { token: session.user.email } })
    // Join personal room to receive notifications
    socket.emit('join-user-room', (session.user as any).id)
    socket.on('notification', (payload: any) => {
      const norm = normalizeHeaderNotification(payload)
      norm.read = false
      if (norm.data?.jobId) {
        fetch(`/api/jobs/${norm.data.jobId}`).then(async r => {
          if (r.ok) {
            const j = await r.json()
            norm.jobTitle = j?.title || undefined
          }
        }).finally(() => {
          setNotifications(prev => [norm, ...prev])
        })
      } else {
        setNotifications(prev => [norm, ...prev])
      }
    })
    return () => {
      socket.disconnect()
    }
  }, [isLoggedIn, session?.user?.email])

  // If session role isn't UNIVERSITY but user has university profile (just created), override UI
  useEffect(() => {
    let cancelled = false
    const checkUni = async () => {
      if (!isLoggedIn || !session?.user?.email) return
      const role = (session?.user as any)?.role
      if (role === 'UNIVERSITY') return
      try {
        const res = await fetch('/api/university/me', { cache: 'no-store' })
        if (!res.ok) return
        const j = await res.json()
        if (!cancelled && j?.data) setUniversityOverride(true)
      } catch {}
    }
    checkUni()
    return () => { cancelled = true }
  }, [isLoggedIn, session?.user?.email])

  // Initial fetch of recent notifications
  useEffect(() => {
    if (isLoggedIn) fetchHeaderNotifications()
  }, [isLoggedIn])

  // Дебаунс подсказок по активной вкладке (без навыков)
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSuggestions([])
      setActiveIndex(-1)
      return
    }
    let cancelled = false
    setSuggestLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        let merged: any[] = []
        if (activeTab === 'jobs') {
          const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}&limit=6&page=1`, { cache: 'no-store', signal: ctrl.signal })
          const data = res.ok ? await res.json() : { jobs: [] }
          merged = (data?.jobs || []).slice(0, 6).map((j: any) => ({
            kind: 'job', id: j.id, title: j.title, companyName: j.companyName, location: j.location, href: `/jobs/${j.id}`
          }))
        } else if (activeTab === 'companies') {
          const res = await fetch(`/api/companies?q=${encodeURIComponent(q)}&limit=6&page=1`, { cache: 'no-store', signal: ctrl.signal })
          const data = res.ok ? await res.json() : { companies: [] }
          merged = (data?.companies || []).slice(0, 6).map((c: any) => ({
            kind: 'company', id: c.id, title: c.companyName, companyName: c.companyName, location: c.location, href: `/companies/${c.id}`
          }))
        } else if (activeTab === 'candidates') {
          // Только для работодателей показываем кандидатов
          const res = await fetch(`/api/candidates?q=${encodeURIComponent(q)}&limit=6&page=1`, { cache: 'no-store', signal: ctrl.signal })
          const data = res.ok ? await res.json() : { candidates: [] }
          merged = (data?.candidates || []).slice(0, 6).map((c: any) => ({
            kind: 'candidate', id: c.id, title: c.name, companyName: c.title, location: c.location, href: `/candidates/${c.id}`
          }))
        }
        if (!cancelled) {
          setSuggestions(merged.slice(0, 6))
          setActiveIndex(merged.length > 0 ? 0 : -1)
        }
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setSuggestLoading(false)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(t); ctrl.abort() }
  }, [searchQuery, activeTab])

  const submitSearch = (dest?: string) => {
    const q = searchQuery.trim()
    setIsSearchOpen(false)
    if (dest) {
      router.push(dest)
      return
    }
    if (!q) { router.push(`/jobs`); return }
    if (activeTab === 'jobs') router.push(`/jobs?q=${encodeURIComponent(q)}`)
    else if (activeTab === 'companies') router.push(`/companies?q=${encodeURIComponent(q)}`)
    else router.push(`/candidates?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 header-slim">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 min-w-0">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="flex items-center justify-center flex-shrink-0">
              <span className={`${unbounded.className} text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-none select-none logo-clip`}>
                EQWIP
              </span>
            </motion.div>
            {/* Убрали текстовое название */}
          </Link>

          {/* Desktop Navigation (no role flash on load) */}
          <nav className="flex max-lg:hidden items-center space-x-1">
            {(() => {
              const navAll = status === 'authenticated' ? getCurrentNavigation() : mainNavigation
              const primary = navAll.slice(0, 3)
              const more = navAll.slice(3)
              return (
                <>
                  {primary.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group font-medium text-sm"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                  {more.length > 0 && (
                    <div className="relative">
                      <button
                        className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
                        onClick={() => setIsMoreOpen((v) => !v)}
                      >
                        Ещё
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isMoreOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-black rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2 z-50"
                          >
                            {more.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setIsMoreOpen(false)}
                              >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )
            })()}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hide-xxs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white w-9 h-9 md:w-12 md:h-12 rounded-3xl btn-touch-48 md:btn-touch-none px-0"
              >
                <Search className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Theme toggle */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hide-xxs">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white w-9 h-9 md:w-12 md:h-12 rounded-3xl btn-touch-48 md:btn-touch-none px-0"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </motion.div>

            {/* Chat quick access near search/moon – скрываем на мобилках */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden lg:block">
              <Link href="/chat">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white w-10 h-10 md:w-12 md:h-12 rounded-3xl"
                  aria-label="Чат"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Notifications */}
            <div className="relative">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setIsNotificationsOpen(false)
                      router.push('/notifications')
                    } else {
                      setIsNotificationsOpen(!isNotificationsOpen)
                    }
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white w-10 h-10 md:w-12 md:h-12 rounded-3xl relative btn-touch-48 md:btn-touch-none"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white text-[10px] rounded-full flex items-center justify-center p-0 min-w-5">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </motion.div>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="hidden lg:block absolute right-0 mt-2 w-80 max-w-sm bg-white dark:bg-black rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Уведомления</h3>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-gray-100 dark:bg-gray-900/20' : ''
                          }`}
                          onClick={() => {
                            markHeaderNotificationRead(notification.id)
                            if (notification.href) router.push(notification.href)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm break-anywhere">
                                {notification.type === 'AI_FEEDBACK' ? 'Фидбэк от кандидата' : notification.title}
                              </h4>
                              {notification.type === 'AI_FEEDBACK' && notification.data ? (
                                <div className="text-gray-600 dark:text-gray-400 text-xs mt-1 space-y-1">
                                  <div>Причина: {humanizeReason(notification.data?.reason)}</div>
                                  {notification.data?.jobId && (
                                    <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded px-2 py-0.5 max-w-[220px]">
                                      <Briefcase className="w-3 h-3" />
                                      <span className="truncate" title={notification.jobTitle || String(notification.data.jobId)}>
                                        {notification.jobTitle || String(notification.data.jobId)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 break-anywhere">
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                      <Link
                        href="/notifications"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Все уведомления
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 md:px-3 py-2 rounded-3xl"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={session?.user?.id ? `/api/profile/avatar?user=${encodeURIComponent((session.user as any).id)}` : '/placeholder-avatar.jpg'} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 hidden sm:block" />
                </Button>
              </motion.div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-black rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2"
                  >
                    {(isLoggedIn ? getAuthedMenu() : guestMenu).map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    ))}
                    {isLoggedIn && (
                      <>
                        <hr className="my-2 border-gray-200 dark:border-gray-800" />
                        <button 
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => signOut({ callbackUrl: '/' })}
                        >
                          <LogOut className="w-4 h-4" />
                          Выйти
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA Buttons: render only when статус определён, чтобы исключить flash */}
            <div className="hidden xl:flex items-center space-x-2">
            {status !== 'loading' && !isLoggedIn && (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-3xl px-6 py-3"
                      onClick={() => router.push('/auth/signin')}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Войти как соискатель
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-3xl px-6 py-3 shadow-lg"
                      onClick={() => router.push('/auth/signin')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Разместить вакансию
                    </Button>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile menu: добавим пункт Чат */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden text-gray-600 dark:text-gray-400 w-11 h-11 rounded-3xl px-0"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {getCurrentNavigation().map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-3xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                {!userRole ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-3xl justify-start"
                      onClick={() => router.push('/auth/signin')}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Войти
                    </Button>
                    <Button
                      className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-3xl justify-start"
                      onClick={() => router.push('/auth/signin')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Разместить вакансию
                    </Button>
                  </>
                ) : userRole === 'jobseeker' ? (
                  <Button
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-3xl justify-start"
                    onClick={() => router.push('/jobs')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Найти работу
                  </Button>
                ) : userRole === 'admin' ? (
                  <Button
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-3xl justify-start"
                    onClick={() => router.push('/admin')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Панель администратора
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-3xl justify-start"
                    onClick={() => router.push('/employer/jobs/create')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Разместить вакансию
                  </Button>
                )}
                <Link
                  href="/chat"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-3xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="w-4 h-4" />
                  Чат
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal via portal (ensures backdrop-filter samples whole page) */}
      {portalEl && createPortal(
        (
          <AnimatePresence>
            {isSearchOpen && (
              <div className="fixed inset-0 z-[1000]" onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false) }}>
                {/* Backdrop; добавляем явный класс для тёмной темы на всякий случай */}
                <div className={`${searchBackdrop.backdrop} ${searchBackdrop.backdropDark} ai-modal-backdrop`} data-search-backdrop onClick={() => setIsSearchOpen(false)} />
                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative flex items-start justify-center pt-20 px-4 min-h-screen z-[1001]"
                >
                  <div
                    className={`w-full max-w-3xl ${aiStyles.surface} ${aiStyles.edge} ${aiStyles.bwThin} ${searchFocused ? aiStyles.ringVisible : aiStyles.ringHidden} ${aiStyles.ringDim} rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6`}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Поиск</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSearchOpen(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </div>

                    {/* Search tabs */}
                    <div className="flex gap-2 mb-6">
                      <button
                        className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${activeTab==='jobs' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                        onClick={() => setActiveTab('jobs')}
                      >Вакансии</button>
                      <button
                        className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${activeTab==='companies' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                        onClick={() => setActiveTab('companies')}
                      >Компании</button>
                      {userRole === 'employer' && (
                        <button
                          className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${activeTab==='candidates' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                          onClick={() => setActiveTab('candidates')}
                        >Кандидаты</button>
                      )}
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)) }
                          else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
                          else if (e.key === 'Enter') {
                            e.preventDefault()
                            if (activeIndex >= 0 && suggestions[activeIndex]) submitSearch(suggestions[activeIndex].href || `/jobs/${suggestions[activeIndex].id}`)
                            else submitSearch()
                          }
                        }}
                        placeholder="Поиск вакансий, компаний, навыков..."
                        className="w-full pl-12 pr-4 py-3 bg-transparent border-2 border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* Suggestions dynamic height (1..6 items), smooth layout; зарезервируем место под popular */}
                    <div className="mb-3">
                      <div
                        className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                        aria-live="polite"
                        style={{
                          height: `${Math.max(1, Math.min((suggestions.length || (suggestLoading ? 1 : 0)), 6)) * 56}px`,
                          transition: 'height .2s ease',
                        }}
                      >
                        {(suggestions.length > 0 || suggestLoading) ? (
                          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                            {suggestions.map((s, idx) => (
                              <li key={s.id}>
                                <button
                                  className={`w-full text-left px-4 h-14 flex items-center justify-between ${idx === activeIndex ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
                                  onMouseEnter={() => setActiveIndex(idx)}
                                  onClick={() => submitSearch(s.href)}
                                >
                                  <div className="flex items-center gap-3">
                                    {s.kind === 'company' ? (
                                      <Building className="w-4 h-4 text-gray-500" />
                                    ) : s.kind === 'candidate' ? (
                                      <Users className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <Briefcase className="w-4 h-4 text-gray-500" />
                                    )}
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">{s.title}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {s.companyName || ''} {s.location ? `• ${s.location}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400">Enter</span>
                                </button>
                              </li>
                            ))}
                            {suggestLoading && (
                              <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Загрузка…</li>
                            )}
                          </ul>
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Начните вводить запрос, чтобы увидеть подсказки</div>
                        )}
                      </div>
                    </div>

                    {/* Reserve space so popular tags don't jump */}
                    <div className="h-2" />

                    {/* Advanced filters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {['Москва', 'Удаленно', 'Full-time', 'Senior'].map((filter) => (
                        <button
                          key={filter}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl text-sm transition-colors"
                          onClick={() => setSearchQuery(filter)}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Популярные запросы:</p>
                      <PopularTags onPick={(tag) => setSearchQuery(tag)} />
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl px-6" onClick={() => submitSearch()}>Найти</Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        ), portalEl)}
    </header>
  )
}

export default Header