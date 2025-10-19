'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Edit,
  Save,
  X,
  Upload,
  Users,
  Briefcase,
  TrendingUp,
  Plus,
  Clock,
  Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import UniversityRequestsWidget from '@/components/UniversityRequestsWidget'

interface EmployerProfile {
  id: string
  companyName: string
  description?: string
  website?: string
  industry?: string
  size?: string
  location?: string
  logo?: string
  jobs?: Array<{
    id: string
    title: string
    isActive: boolean
    applicationsCount: number
    createdAt: string
  }>
}

export default function EmployerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<EmployerProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<EmployerProfile>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYER') {
      router.push('/dashboard')
      return
    }
    fetchProfile()
  }, [status, router, session])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/employer')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setProfile(data)
          setFormData(data)
        } else {
          const emptyProfile: EmployerProfile = {
            id: '',
            companyName: '',
            jobs: []
          }
          setProfile(emptyProfile)
          setFormData(emptyProfile)
        }
      } else {
        // Create empty profile if none exists
        const emptyProfile: EmployerProfile = {
          id: '',
          companyName: '',
          jobs: []
        }
        setProfile(emptyProfile)
        setFormData(emptyProfile)
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль компании",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/profile/company-logo', { method: 'POST', body: fd })
        if (!res.ok) { alert('Ошибка загрузки логотипа'); return }
        const data = await res.json()
        setProfile(prev => prev ? ({ ...prev, logo: data.url }) : prev)
        setFormData(prev => ({ ...prev, logo: data.url }))
      }
      input.click()
    } catch (e) {
      alert('Ошибка загрузки логотипа')
    }
  }

  // Check if user is authenticated and has the correct role
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Панель работодателя
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как работодатель, чтобы управлять компанией и вакансиями
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => router.push('/auth/signin')}
          >
            Войти как работодатель
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'authenticated' && session?.user?.role !== 'EMPLOYER') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <X className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Доступ запрещен
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Только работодатели могут получить доступ к этой панели
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => router.push('/dashboard')}
          >
            Вернуться в кабинет
          </Button>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile/employer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setIsEditing(false)
        toast({
          title: "Успешно",
          description: "Профиль компании обновлен",
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить профиль компании",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль компании",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div>Ошибка загрузки профиля</div>
      </div>
    )
  }

  const activeJobs = profile.jobs?.filter(job => job.isActive) || []
  const totalApplications = profile.jobs?.reduce((sum, job) => sum + job.applicationsCount, 0) || 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Панель работодателя
            </h1>
            <p className="text-slate-600">
              Управляйте компанией и вакансиями
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Редактировать
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Активные вакансии</p>
                  <p className="text-2xl font-bold text-slate-900">{activeJobs.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Всего откликов</p>
                  <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Просмотров</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {profile.jobs?.reduce((sum, job) => sum + (job as any).viewsCount, 0) || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* University Requests Widget */}
        <div className="mb-8">
          <UniversityRequestsWidget />
        </div>

        {/* Company Profile */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Профиль компании
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 relative">
                <AvatarImage src={profile.logo ? (profile.logo.startsWith('/api/') ? profile.logo : `/api/profile/company-logo?f=${encodeURIComponent(profile.logo)}`) : undefined} />
                <AvatarFallback className="text-xl bg-slate-200 text-slate-700">
                  {profile.companyName?.slice(0, 2).toUpperCase() || 'CO'}
                </AvatarFallback>
                {isEditing && (
                  <button
                    onClick={handleLogoUpload}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Название компании</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName || ''}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Название компании"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Описание компании</Label>
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Расскажите о вашей компании"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                      {profile.companyName || 'Название компании не указано'}
                    </h3>
                    <p className="text-slate-600">
                      {profile.description || 'Описание компании не добавлено'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="industry">Отрасль</Label>
                    <Select
                      value={formData.industry || ''}
                      onValueChange={(value) => handleInputChange('industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите отрасль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Finance">Финансы</SelectItem>
                        <SelectItem value="Healthcare">Здравоохранение</SelectItem>
                        <SelectItem value="Education">Образование</SelectItem>
                        <SelectItem value="Retail">Розничная торговля</SelectItem>
                        <SelectItem value="Manufacturing">Производство</SelectItem>
                        <SelectItem value="Other">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="size">Размер компании</Label>
                    <Select
                      value={formData.size || ''}
                      onValueChange={(value) => handleInputChange('size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите размер" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 сотрудников</SelectItem>
                        <SelectItem value="11-50">11-50 сотрудников</SelectItem>
                        <SelectItem value="51-200">51-200 сотрудников</SelectItem>
                        <SelectItem value="201-500">201-500 сотрудников</SelectItem>
                        <SelectItem value="500+">500+ сотрудников</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Локация</Label>
                    <Input
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Город"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Веб-сайт</Label>
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.industry && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{profile.industry}</Badge>
                    </div>
                  )}
                  {profile.size && (
                    <div className="text-sm text-slate-600">
                      Размер: {profile.size}
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Globe className="w-4 h-4" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:text-slate-700">
                        Веб-сайт
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Вакансии
              </CardTitle>
              <CardDescription>
                Управляйте вашими вакансиями
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/employer/jobs/create')} 
                  className="w-full justify-start"
                  variant="inverted"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать вакансию
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Все вакансии
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Отклики
              </CardTitle>
              <CardDescription>
                Управляйте откликами кандидатов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/employer/applications')} 
                  className="w-full justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Все отклики ({totalApplications})
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Новые отклики
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Вакансии
              </div>
              <Button variant="inverted" onClick={() => router.push('/employer/jobs/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Создать вакансию
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.jobs && profile.jobs.length > 0 ? (
              <div className="space-y-4">
                {profile.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900">{job.title}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant={job.isActive ? "default" : "secondary"}>
                          {job.isActive ? "Активна" : "Неактивна"}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {job.applicationsCount} откликов
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(job.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Управлять
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Нет вакансий
                </h3>
                <p className="text-slate-600 mb-4">
                  Создайте свою первую вакансию, чтобы начать поиск кандидатов
                </p>
                <Button variant="inverted" onClick={() => router.push('/employer/jobs/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать вакансию
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}