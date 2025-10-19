'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building,
  Calendar,
  Edit3,
  Download,
  Share2,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Award,
  BookOpen,
  Code,
  Target,
  TrendingUp,
  CheckCircle,
  Star,
  Plus,
  X,
  Camera,
  Upload,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

import Footer from '@/components/Footer'

interface UserProfile {
  name: string
  firstName?: string
  lastName?: string
  email: string
  phone: string
  location: string
  title: string
  company: string
  salary: string
  experience: string
  bio: string
  skills: string[]
  languages: string[]
  languageLevels?: Array<{ name: string; level: string; id?: string }>
  dateOfBirth?: string
  telegram?: string
  searchSettings?: {
    status: 'ACTIVE' | 'OPEN' | 'NOT_SEARCHING'
    currentLocation: string
    searchLocation: string
    desiredTitle: string
  }
  education?: Array<{
    id?: string
    institution: string
    degree?: string
    field?: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
  }>
  socialLinks: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  avatar: string
  presence?: {
    online: boolean
    lastSeenAt?: string | null
  }
  candidateId?: string
  stats: {
    profileViews: number
    applicationsSent: number
    interviews: number
    savedJobs: number
  }
  recentActivity: Array<{
    type: 'application' | 'save' | 'view' | 'interview'
    title: string
    company: string
    timestamp: string
  }>
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    company: '',
    salary: '',
    experience: '',
    bio: '',
    skills: [],
    languages: [],
    languageLevels: [],
    dateOfBirth: '',
    telegram: '',
    searchSettings: { status: 'OPEN', currentLocation: '', searchLocation: '', desiredTitle: '' },
    education: [],
    socialLinks: {},
    avatar: '',
    presence: { online: false, lastSeenAt: null },
    candidateId: '',
    stats: {
      profileViews: 0,
      applicationsSent: 0,
      interviews: 0,
      savedJobs: 0
    },
    recentActivity: []
  })

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      
      try {
        const [profileRes, applicationsRes, savedRes] = await Promise.all([
          fetch('/api/profile/candidate', { credentials: 'include' }),
          fetch('/api/applications', { credentials: 'include' }),
          fetch('/api/saved-jobs', { credentials: 'include' })
        ])
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const appsJson = applicationsRes.ok ? await applicationsRes.json() : { applications: [] }
          const savedJson = savedRes.ok ? await savedRes.json() : { savedJobs: [] }
          if (profileData) {
            const fullName = (profileData.user?.name || '').toString().trim()
            const parts = fullName.split(/\s+/)
            const firstName = parts[0] || ''
            const lastName = parts.slice(1).join(' ')
            const prefs = profileData.preferences || {}
            const jobSearch = prefs.jobSearch || {}
            setProfile({
              name: profileData.user?.name || '',
              firstName,
              lastName,
              email: profileData.user?.email || '',
              phone: profileData.phone || '',
              location: profileData.location || '',
              title: profileData.title || '',
              company: profileData.company || '',
              salary: (() => {
                const sym = (profileData.currency === 'USD') ? '$' : (profileData.currency === 'EUR') ? '€' : '₽'
                const hasMin = typeof profileData.salaryMin === 'number' && profileData.salaryMin > 0
                const hasMax = typeof profileData.salaryMax === 'number' && profileData.salaryMax > 0
                if (!hasMin && !hasMax) return 'Зарплата не указана'
                if (hasMin && hasMax) {
                  return `${sym} ${Number(profileData.salaryMin).toLocaleString('ru-RU')} - ${sym} ${Number(profileData.salaryMax).toLocaleString('ru-RU')}`
                }
                if (hasMin) return `${sym} ${Number(profileData.salaryMin).toLocaleString('ru-RU')}`
                return `${sym} ${Number(profileData.salaryMax).toLocaleString('ru-RU')}`
              })(),
              experience: profileData.experience ? `${profileData.experience}+ лет` : '',
              bio: profileData.bio || '',
              skills: profileData.skills?.map((skill: any) => skill.skill.name) || [],
              languages: profileData.languages || [],
              languageLevels: Array.isArray(profileData.languages)
                ? profileData.languages.map((l: any) => ({ id: l.id, name: l.name, level: l.level }))
                : [],
              dateOfBirth: prefs?.dateOfBirth || '',
              telegram: (prefs?.contacts && prefs.contacts.telegram) || prefs?.telegram || '',
              searchSettings: {
                status: (jobSearch?.status as any) || 'OPEN',
                currentLocation: profileData.location || '',
                searchLocation: jobSearch?.searchLocation || '',
                desiredTitle: jobSearch?.desiredTitle || ''
              },
              education: Array.isArray(profileData.education)
                ? profileData.education.map((e: any) => ({
                    id: e.id,
                    institution: e.institution || '',
                    degree: e.degree || '',
                    field: e.field || '',
                    startDate: e.startDate ? String(e.startDate).slice(0, 10) : '',
                    endDate: e.endDate ? String(e.endDate).slice(0, 10) : '',
                    isCurrent: !!e.isCurrent,
                  }))
                : [],
              socialLinks: {
                github: profileData.github || '',
                linkedin: profileData.linkedin || '',
                twitter: profileData.twitter || '',
                website: profileData.website || ''
              },
              avatar: profileData.user?.avatar ? `/api/profile/avatar?f=${encodeURIComponent((profileData.user as any).avatar)}` : '',
              presence: {
                online: !!profileData?.presence?.online,
                lastSeenAt: profileData?.presence?.lastSeenAt || null,
              },
              candidateId: profileData?.id,
              stats: {
                // Просмотры откликов (fallback 0)
                profileViews: profileData?.analytics?.applicationViews ?? 0,
                // Отклики пользователя
                applicationsSent: Array.isArray(appsJson.applications) ? appsJson.applications.length : 0,
                // Инвайты на собеседование (из откликов по статусу)
                interviews: Array.isArray(appsJson.applications)
                  ? appsJson.applications.filter((a: any) => String(a.status || '').toUpperCase() === 'INTERVIEW').length
                  : 0,
                // Сохранённые вакансии
                savedJobs: Array.isArray(savedJson.savedJobs) ? savedJson.savedJobs.length : 0
              },
              recentActivity: profileData.recentActivity || []
            })
          }
        } else if (profileRes.status === 401) {
          // not authenticated – do nothing here, the UI below will show login prompt
        } else {
          console.error('Failed to fetch profile')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (status === 'authenticated' && session?.user?.role === 'CANDIDATE') {
      fetchProfile()
    }
  }, [status, session?.user?.role])

  // Show login prompt only if explicitly unauthenticated or wrong role
  if (status !== 'authenticated' || session?.user?.role !== 'CANDIDATE') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Профиль соискателя
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как соискатель, чтобы просмотреть и редактировать свой профиль
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/auth/signin'}
          >
            Войти как соискатель
          </Button>
        </div>
      </div>
    )
  }
  const formatLastSeen = (dateStr?: string | null) => {
    if (!dateStr) return 'неизвестно'
    const ts = new Date(dateStr).getTime()
    const diffMs = Date.now() - ts
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'только что'
    if (mins < 60) return `${mins} мин назад`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ч назад`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} дн назад`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} мес назад`
    const years = Math.floor(months / 12)
    return `${years} г назад`
  }

  const handleAvatarUpload = async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
        if (!res.ok) {
          alert('Ошибка загрузки аватара')
          return
        }
        const data = await res.json()
        // Обновляем локально ссылку на аватар
        setProfile(prev => ({ ...prev, avatar: data.url }))
      }
      input.click()
    } catch (e) {
      console.error('avatar upload failed', e)
      alert('Ошибка загрузки аватара')
    }
  }

  const handleSave = async () => {
    try {
      // Robust salary parsing from free text like "₽ 145 000 - 210 000", "$5000" etc.
      const salaryText = (profile.salary || '').toString()
      const currency = salaryText.includes('$') ? 'USD' : salaryText.includes('€') ? 'EUR' : 'RUB'
      const numberMatches = salaryText.match(/\d[\d\s]*/g) || []
      const numbers = numberMatches.map((n) => parseInt(n.replace(/\s/g, ''), 10)).filter((n) => !isNaN(n))
      const salaryMinVal = numbers.length >= 1 ? numbers[0] : null
      const salaryMaxVal = numbers.length >= 2 ? numbers[1] : null

      const composedName = [profile.firstName || '', profile.lastName || ''].join(' ').trim()

      const response = await fetch('/api/profile/candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: composedName || profile.name,
          title: profile.title,
          bio: profile.bio,
          location: profile.location,
          phone: profile.phone,
          website: profile.socialLinks.website,
          linkedin: profile.socialLinks.linkedin,
          github: profile.socialLinks.github,
          twitter: profile.socialLinks.twitter,
          skills: profile.skills.map(skill => ({ skill: { name: skill } })),
          experience: parseInt(profile.experience) || null,
          salaryMin: salaryMinVal,
          salaryMax: salaryMaxVal,
          currency,
          languages: (profile.languageLevels || []).map(l => ({ name: l.name, level: l.level })),
          preferences: {
            ...(profile.dateOfBirth ? { dateOfBirth: profile.dateOfBirth } : {}),
            jobSearch: {
              status: profile.searchSettings?.status || 'OPEN',
              searchLocation: profile.searchSettings?.searchLocation || '',
              desiredTitle: profile.searchSettings?.desiredTitle || ''
            },
            contacts: {
              ...(profile.telegram ? { telegram: profile.telegram } : {})
            }
          },
          education: (profile.education || [])
            .filter(e => (e.institution || '').trim() && (e.startDate || '').trim())
            .map(e => ({
              institution: e.institution.trim(),
              degree: (e.degree || '').trim() || undefined,
              field: (e.field || '').trim() || undefined,
              startDate: e.startDate,
              endDate: e.endDate || undefined,
              isCurrent: !!e.isCurrent,
            }))
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setProfile(prev => ({
          ...prev,
          name: composedName || prev.name,
          avatar: updated?.user?.avatar ? `/api/profile/avatar?f=${encodeURIComponent(updated.user.avatar)}` : prev.avatar
        }))
        // Подтянем профиль заново, чтобы убедиться, что образование сохранилось
        try {
          const fresh = await fetch('/api/profile/candidate', { credentials: 'include' })
          if (fresh.ok) {
            const profileData = await fresh.json()
            // Простое обновление образования
            setProfile(prev => ({
              ...prev,
              education: Array.isArray(profileData.education)
                ? profileData.education.map((e: any) => ({
                    id: e.id,
                    institution: e.institution || '',
                    degree: e.degree || '',
                    field: e.field || '',
                    startDate: e.startDate ? String(e.startDate).slice(0, 10) : '',
                    endDate: e.endDate ? String(e.endDate).slice(0, 10) : '',
                    isCurrent: !!e.isCurrent,
                  }))
                : [],
            }))
          }
        } catch {}
        setEditing(false)
        alert('Профиль успешно обновлен!')
      } else {
        alert('Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Ошибка при сохранении профиля')
    }
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !profile.skills.includes(skill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const removeLanguage = (index: number) => {
    setProfile(prev => ({
      ...prev,
      languageLevels: (prev.languageLevels || []).filter((_, i) => i !== index)
    }))
  }

  const removeEducation = (index: number) => {
    setProfile(prev => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index)
    }))
  }

  const getActivityIcon = (type: UserProfile['recentActivity'][0]['type']) => {
    switch (type) {
      case 'application':
        return <Briefcase className="w-4 h-4" />
      case 'save':
        return <Star className="w-4 h-4" />
      case 'interview':
        return <Calendar className="w-4 h-4" />
      case 'view':
        return <Eye className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: UserProfile['recentActivity'][0]['type']) => {
    switch (type) {
      case 'application':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
      case 'save':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'interview':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
      case 'view':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка профиля...
              </h3>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen account-surface">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 mb-8">
            <Button
              variant="outline"
              onClick={() => setEditing(!editing)}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" />
              {editing ? 'Отменить' : 'Редактировать'}
            </Button>
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                // формируем ссылку на страницу публичного профиля пользователя
                const base = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : ''
                const cid = profile.candidateId || ''
                const shareUrl = cid ? `${base}/candidates/${cid}` : `${base}/profile`
                const copyWithFallback = async (text: string) => {
                  try {
                    if (navigator.clipboard && (window as any).isSecureContext) {
                      await navigator.clipboard.writeText(text)
                      return true
                    }
                  } catch {}
                  try {
                    const ta = document.createElement('textarea')
                    ta.value = text
                    ta.style.position = 'fixed'
                    ta.style.left = '-9999px'
                    document.body.appendChild(ta)
                    ta.focus()
                    ta.select()
                    const ok = document.execCommand('copy')
                    document.body.removeChild(ta)
                    return ok
                  } catch {
                    return false
                  }
                }
                const ok = await copyWithFallback(shareUrl)
                toast({ title: ok ? 'Ссылка скопирована' : 'Не удалось скопировать', description: ok ? shareUrl : undefined })
              }}
            >
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                try {
                  const res = await fetch('/api/telegram/link/start')
                  const data = await res.json()
                  if (!res.ok || !data?.deepLink) {
                    alert('Телеграм ещё не настроен администратором')
                    return
                  }
                  window.open(data.deepLink, '_blank')
                } catch (e) {
                  alert('Не удалось получить ссылку для подключения Telegram')
                }
              }}
            >
              <LinkIcon className="w-4 h-4" /> Подключить Telegram
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center relative overflow-hidden">
                      {profile.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                      )}
                      {editing && (
                        <button
                          onClick={handleAvatarUpload}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-gray-600 dark:bg-gray-400 rounded-full flex items-center justify-center text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {editing ? (
                            <div className="flex gap-2">
                              <Input
                                value={profile.firstName}
                                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value, name: `${e.target.value} ${prev.lastName||''}`.trim() }))}
                                placeholder="Имя"
                                className="text-2xl font-bold mb-2"
                              />
                              <Input
                                value={profile.lastName}
                                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value, name: `${prev.firstName||''} ${e.target.value}`.trim() }))}
                                placeholder="Фамилия"
                                className="text-2xl font-bold mb-2"
                              />
                            </div>
                          ) : (
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                              {profile.name}
                            </h2>
                          )}
                          
                          {/* скрыто: должность под именем */}
                          {/*
                          {editing ? (
                            <Input
                              value={profile.title}
                              onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                              className="text-lg text-gray-600 dark:text-gray-400 mb-1"
                            />
                          ) : (
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                              {profile.title}
                            </p>
                          )}
                          */}
                          
                          {/* скрыто: компания */}
 
                          {/* Дата рождения под именем */}
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {editing ? (
                              <Input type="date" value={profile.dateOfBirth || ''} onChange={(e)=> setProfile(prev=>({...prev, dateOfBirth: e.target.value}))} className="w-48" />
                            ) : (
                              <span>{profile.dateOfBirth || '—'}</span>
                            )}
                          </div>
                        </div>
                        
                        {editing && (
                          <Button onClick={handleSave} className="gap-2">
                            <Save className="w-4 h-4" />
                            Сохранить
                          </Button>
                        )}
                      </div>
                      
                      {/* скрыто: бейджи локации/опыта/зарплаты/ДР */}
                      
                      <div className="flex gap-2">
                        {profile.socialLinks.github && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {profile.socialLinks.linkedin && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {profile.socialLinks.twitter && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                              <Twitter className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {profile.socialLinks.website && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* скрыто: блоки "О себе" и "Навыки" */}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Контакты и способы связи</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      {editing ? (
                        <Input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          {profile.email}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Телефон
                      </label>
                      {editing ? (
                        <Input
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          {profile.phone}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram</label>
                      {editing ? (
                        <Input value={profile.telegram || ''} onChange={(e)=> setProfile(prev => ({...prev, telegram: e.target.value }))} placeholder="@username" />
                      ) : (
                        <div className="text-gray-600 dark:text-gray-400">{profile.telegram || '—'}</div>
                      )}
                    </div>

                    {/* удалены поля Местоположение и Желаемая зарплата */}
                  </div>
                </CardContent>
              </Card>

              {/* Job search settings */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Настройки поиска
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                      {editing ? (
                        <select className="border rounded px-2 py-2 w-full" value={profile.searchSettings?.status || 'OPEN'} onChange={(e)=>setProfile(prev=>({...prev, searchSettings:{...(prev.searchSettings||{}), status:e.target.value as any}}))}>
                          <option value="ACTIVE">Активно ищу</option>
                          <option value="OPEN">Рассматриваю предложения</option>
                          <option value="NOT_SEARCHING">Не ищу работу</option>
                        </select>
                      ) : (
                        <div className="text-gray-600 dark:text-gray-400">{profile.searchSettings?.status === 'ACTIVE' ? 'Активно ищу' : profile.searchSettings?.status === 'NOT_SEARCHING' ? 'Не ищу' : 'Рассматриваю предложения'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Где живёте</label>
                      {editing ? (
                        <Input value={profile.searchSettings?.currentLocation || ''} onChange={(e)=>setProfile(prev=>({...prev, searchSettings:{...(prev.searchSettings||{}), currentLocation:e.target.value}}))} />
                      ) : (
                        <div className="text-gray-600 dark:text-gray-400">{profile.searchSettings?.currentLocation || '—'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Где ищете работу</label>
                      {editing ? (
                        <Input value={profile.searchSettings?.searchLocation || ''} onChange={(e)=>setProfile(prev=>({...prev, searchSettings:{...(prev.searchSettings||{}), searchLocation:e.target.value}}))} />
                      ) : (
                        <div className="text-gray-600 dark:text-gray-400">{profile.searchSettings?.searchLocation || '—'}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Желаемая должность</label>
                    {editing ? (
                      <Input value={profile.searchSettings?.desiredTitle || ''} onChange={(e)=>setProfile(prev=>({...prev, searchSettings:{...(prev.searchSettings||{}), desiredTitle:e.target.value}}))} />
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400">{profile.searchSettings?.desiredTitle || '—'}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Образование</h3>
                  <div className="space-y-3">
                    {(profile.education||[]).map((ed, idx)=> (
                      <div key={ed.id||idx} className="border rounded p-3">
                        {editing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input placeholder="Учреждение" value={ed.institution} onChange={(e)=>{
                              const v=e.target.value; setProfile(prev=>({...prev, education:(prev.education||[]).map((x,i)=>i===idx?{...x,institution:v}:x)}))
                            }} />
                            <Input placeholder="Степень (опц.)" value={ed.degree||''} onChange={(e)=>{
                              const v=e.target.value; setProfile(prev=>({...prev, education:(prev.education||[]).map((x,i)=>i===idx?{...x,degree:v}:x)}))
                            }} />
                            <Input placeholder="Специализация (опц.)" value={ed.field||''} onChange={(e)=>{
                              const v=e.target.value; setProfile(prev=>({...prev, education:(prev.education||[]).map((x,i)=>i===idx?{...x,field:v}:x)}))
                            }} />
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="date" value={ed.startDate||''} onChange={(e)=>{
                                const v=e.target.value; setProfile(prev=>({...prev, education:(prev.education||[]).map((x,i)=>i===idx?{...x,startDate:v}:x)}))
                              }} />
                              <Input type="date" value={ed.endDate||''} onChange={(e)=>{
                                const v=e.target.value; setProfile(prev=>({...prev, education:(prev.education||[]).map((x,i)=>i===idx?{...x,endDate:v}:x)}))
                              }} />
                            </div>
                            <div className="col-span-2">
                              <Button variant="outline" size="sm" onClick={()=>removeEducation(idx)} className="text-red-600">Удалить</Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{ed.institution}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{[ed.degree, ed.field].filter(Boolean).join(' • ')}</div>
                            <div className="text-xs text-gray-500">{[ed.startDate, ed.endDate].filter(Boolean).join(' - ')}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {editing && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" onClick={()=> setProfile(prev=>({...prev, education:[...(prev.education||[]), { institution:'', startDate:'' }]}))}>
                        <Plus className="w-4 h-4" /> Добавить образование
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats and Activity */}
            <div className="space-y-6">
              {/* Stats */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Статистика
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Просмотры</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {profile.stats.profileViews.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Отклики</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {profile.stats.applicationsSent}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Собеседования</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {profile.stats.interviews}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Сохранено</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {profile.stats.savedJobs}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Последняя активность
                  </h3>
                  <div className="mb-4 flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${profile.presence?.online ? 'bg-gray-900 dark:bg-white' : 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {profile.presence?.online ? 'Онлайн' : `Не в сети • был(а) ${formatLastSeen(profile.presence?.lastSeenAt)}`}
                    </span>
                  </div>
                  {profile.recentActivity.length > 0 && (
                    <div className="space-y-3">
                      {profile.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{activity.company}</span>
                              <span>•</span>
                              <span>{activity.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Languages */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Языки
                  </h3>
                  <div className="space-y-2">
                    {profile.languageLevels && profile.languageLevels.length > 0 ? (
                      profile.languageLevels.map((lang, index) => (
                        <div key={lang.id || index} className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white flex-1">
                            {lang.name}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Уровень: {lang.level}
                          </span>
                          {editing && (
                            <button onClick={()=>removeLanguage(index)} className="text-red-500 text-xs ml-2">Удалить</button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Пока не указано</p>
                    )}
                  </div>
                  {editing && (
                    <div className="mt-4 space-y-2">
                      <div className="flex gap-2">
                        <Input placeholder="Язык (например: English)" id="new-lang-name" />
                        <select id="new-lang-level" className="border rounded px-2">
                          {['A1','A2','B1','B2','C1','C2','FLUENT','NATIVE'].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const nameInput = document.getElementById('new-lang-name') as HTMLInputElement
                            const levelInput = document.getElementById('new-lang-level') as HTMLInputElement
                            const name = nameInput?.value?.trim()
                            const level = (levelInput?.value || 'B1').toString()
                            if (!name) return
                            setProfile(prev => ({
                              ...prev,
                              languageLevels: [...(prev.languageLevels || []), { name, level }]
                            }))
                            if (nameInput) nameInput.value = ''
                            if (levelInput) levelInput.value = ''
                          }}
                        >
                          Добавить
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}