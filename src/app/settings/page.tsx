'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Monitor,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  Check,
  Camera,
  Upload,
  Download,
  Trash2,
  Plus,
  Edit3,
  Link as LinkIcon,
  Github,
  Linkedin,
  Twitter,
  Languages,
  Palette,
  Volume2,
  VolumeX,
  Settings,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useUser } from '@/contexts/UserContext'
import Footer from '@/components/Footer'
import { useTheme } from 'next-themes'

interface UserProfile {
  name: string
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
  socialLinks: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  avatar: string
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: 'ru' | 'en'
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
      jobMatches: boolean
      applicationUpdates: boolean
      messages: boolean
    }
    privacy: {
      profileVisible: boolean
      showEmail: boolean
      showPhone: boolean
      allowRecruiters: boolean
    }
  }
}

export default function SettingsPage() {
  const { userRole, isLoggedIn } = useUser()
  const { setTheme, theme, systemTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'appearance'>('notifications')
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
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
    socialLinks: {},
    avatar: '',
    preferences: {
      theme: 'auto',
      language: 'ru',
      notifications: {
        email: true,
        push: true,
        sms: false,
        jobMatches: true,
        applicationUpdates: true,
        messages: true
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showPhone: false,
        allowRecruiters: true
      }
    }
  })

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/profile/candidate', { credentials: 'include' })
        if (!res.ok) {
          setLoading(false)
          return
        }
        const data = await res.json()
        if (!data) {
          setLoading(false)
          return
        }
        const salaryStr = (() => {
          const { salaryMin, salaryMax, currency } = data || {}
          if (!salaryMin && !salaryMax) return ''
          const cur = currency === 'USD' ? '$' : '₽'
          if (salaryMin && salaryMax) return `${cur}${salaryMin.toLocaleString('ru-RU')} - ${cur}${salaryMax.toLocaleString('ru-RU')}`
          if (salaryMin) return `${cur}${salaryMin.toLocaleString('ru-RU')}`
          return `${cur}${salaryMax.toLocaleString('ru-RU')}`
        })()
        const mapped: UserProfile = {
          name: data.user?.name || '',
          email: data.user?.email || '',
          phone: '',
          location: data.location || '',
          title: data.title || '',
          company: '',
          salary: salaryStr,
          experience: data.experience ? `${data.experience}+ лет` : '',
          bio: data.bio || '',
          skills: Array.isArray(data.skills) ? data.skills.map((s: any) => s?.skill?.name).filter(Boolean) : [],
          languages: [],
          socialLinks: {
            github: data.github || '',
            linkedin: data.linkedin || '',
            twitter: '',
            website: data.website || ''
          },
          avatar: data.user?.avatar || '',
          preferences: {
            ...profile.preferences,
            ...(data.preferences || {}),
          },
        }
        setProfile(prev => ({ ...prev, ...mapped }))
        // Подгружаем отдельный срез уведомлений, если доступен узкий эндпоинт
        try {
          const nres = await fetch('/api/notifications/preferences', { credentials: 'include' })
          if (nres.ok) {
            const nd = await nres.json()
            if (nd?.notifications) {
              setProfile(prev => ({ ...prev, preferences: { ...prev.preferences, notifications: { ...prev.preferences.notifications, ...nd.notifications } } }))
            }
          }
        } catch {}
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { salary } = profile
      const currency = salary.includes('$') ? 'USD' : 'RUB'
      // Попробуем извлечь 2 числа из строки зарплаты
      const nums = (salary.match(/\d+/g) || []).map((n) => parseInt(n, 10))
      const [salaryMin, salaryMax] = nums.length >= 2 ? [nums[0], nums[1]] : [nums[0] || null, null]

      const resp = await fetch('/api/profile/candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userName: profile.name,
          userEmail: profile.email,
          title: profile.title,
          bio: profile.bio,
          location: profile.location,
          website: profile.socialLinks.website,
          linkedin: profile.socialLinks.linkedin,
          github: profile.socialLinks.github,
          portfolio: undefined,
          experience: parseInt((profile.experience || '').replace(/\D/g, '')) || null,
          salaryMin: salaryMin || null,
          salaryMax: salaryMax || null,
          currency,
          skills: profile.skills.map((name) => ({ skill: { name } })),
          preferences: profile.preferences,
        }),
      })
      if (!resp.ok) throw new Error('Failed to save profile')
      const updated = await resp.json()
      // Применяем тему прямо после сохранения настроек
      const targetTheme = profile.preferences.theme
      setTheme(targetTheme === 'auto' ? 'system' : targetTheme)
      // Обновим локально ключевые поля
      setProfile((prev) => ({
        ...prev,
        title: updated?.title ?? prev.title,
        bio: updated?.bio ?? prev.bio,
        location: updated?.location ?? prev.location,
        skills: Array.isArray(updated?.skills) ? updated.skills.map((s: any) => s?.skill?.name).filter(Boolean) : prev.skills,
      }))
      alert('Изменения сохранены')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setSaving(false)
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

  const updateNotificationPreference = (key: keyof UserProfile['preferences']['notifications'], value: boolean) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [key]: value
        }
      }
    }))
    // Отправим обновления на сервер сразу (toggle-as-you-go)
    fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ notifications: { [key]: value } })
    }).catch(() => {})
  }

  const updatePrivacyPreference = (key: keyof UserProfile['preferences']['privacy'], value: boolean) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        privacy: {
          ...prev.preferences.privacy,
          [key]: value
        }
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка настроек...
              </h3>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Настройки
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Управление профилем и предпочтениями
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { key: 'notifications', label: 'Уведомления', icon: Bell },
              { key: 'privacy', label: 'Приватность', icon: Shield },
              { key: 'appearance', label: 'Внешний вид', icon: Palette }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeTab === key ? 'default' : 'outline'}
                onClick={() => setActiveTab(key as any)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>

          {/* Tab Content (профиль удалён по просьбе пользователя) */}
          <div className="space-y-6">
            {/* Профиль скрыт */}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                      Уведомления
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Способы уведомлений
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Email уведомления</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Получать уведомления на email</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.notifications.email}
                              onCheckedChange={(checked) => updateNotificationPreference('email', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Push уведомления</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Push уведомления в браузере</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.notifications.push}
                              onCheckedChange={(checked) => updateNotificationPreference('push', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">SMS уведомления</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">СМС уведомления на телефон</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.notifications.sms}
                              onCheckedChange={(checked) => updateNotificationPreference('sms', checked)}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Типы уведомлений
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Совпадения вакансий</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">AI рекомендации вакансий</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.notifications.jobMatches}
                              onCheckedChange={(checked) => updateNotificationPreference('jobMatches', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Check className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Статус заявок</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Обновления по вашим заявкам</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.notifications.applicationUpdates}
                              onCheckedChange={(checked) => updateNotificationPreference('applicationUpdates', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Сообщения</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Новые сообщения от рекрутеров</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.notifications.messages}
                              onCheckedChange={(checked) => updateNotificationPreference('messages', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                      Приватность
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Видимость профиля
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Профиль виден</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Ваш профиль виден другим пользователям</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.privacy.profileVisible}
                              onCheckedChange={(checked) => updatePrivacyPreference('profileVisible', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Показывать email</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Ваш email виден в профиле</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.privacy.showEmail}
                              onCheckedChange={(checked) => updatePrivacyPreference('showEmail', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Показывать телефон</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Ваш телефон виден в профиле</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.privacy.showPhone}
                              onCheckedChange={(checked) => updatePrivacyPreference('showPhone', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Разрешить рекрутерам</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Рекрутеры могут видеть ваш профиль</p>
                              </div>
                            </div>
                            <Switch
                              checked={profile.preferences.privacy.allowRecruiters}
                              onCheckedChange={(checked) => updatePrivacyPreference('allowRecruiters', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                      Внешний вид
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Тема
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <button
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, theme: 'light' }
                            }))}
                            className={`p-4 rounded-2xl border-2 transition-colors ${
                              profile.preferences.theme === 'light'
                                ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          >
                            <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Светлая</p>
                          </button>

                          <button
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, theme: 'dark' }
                            }))}
                            className={`p-4 rounded-2xl border-2 transition-colors ${
                              profile.preferences.theme === 'dark'
                                ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          >
                            <Moon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Темная</p>
                          </button>

                          <button
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, theme: 'auto' }
                            }))}
                            className={`p-4 rounded-2xl border-2 transition-colors ${
                              profile.preferences.theme === 'auto'
                                ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          >
                            <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Авто</p>
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Язык
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, language: 'ru' }
                            }))}
                            className={`p-4 rounded-2xl border-2 transition-colors ${
                              profile.preferences.language === 'ru'
                                ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          >
                            <Globe className="w-8 h-8 mx-auto mb-2 text-red-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Русский</p>
                          </button>

                          <button
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, language: 'en' }
                            }))}
                            className={`p-4 rounded-2xl border-2 transition-colors ${
                              profile.preferences.language === 'en'
                                ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          >
                            <Globe className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">English</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}