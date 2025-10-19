'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  MapPin, 
  DollarSign,
  Clock,
  Save,
  X,
  Plus,
  Trash2,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { SITE_CATEGORY_META } from '@/lib/siteCategories'

interface Skill { name: string; category: string }

// Предустановленные справочники
const ROLES = [
  'Frontend Developer','Backend Developer','Full‑Stack Developer','Mobile Developer','DevOps Engineer','Data Scientist','ML Engineer','MLOps Engineer','AI Engineer','Product Manager','Project Manager','QA Engineer','Automation QA','Security Engineer','SRE','System Administrator','UI/UX Designer','Data Analyst','Business Analyst','Solution Architect','Tech Lead'
]

const TECH_SKILLS: string[] = [
  'JavaScript','TypeScript','React','Next.js','Vue','Angular','Node.js','Express','NestJS','Python','Django','Flask','FastAPI','Go','Java','Spring','Kotlin','Swift','Objective‑C','C#','.NET','PHP','Laravel','Ruby','Rails','C++','Rust','SQL','PostgreSQL','MySQL','MongoDB','Redis','Kafka','RabbitMQ','GraphQL','REST API','gRPC','Docker','Kubernetes','Helm','Terraform','Ansible','AWS','GCP','Azure','Linux','Nginx','CI/CD','GitHub Actions','GitLab CI','Jenkins','Playwright','Cypress','Jest','Vitest','PyTorch','TensorFlow','CUDA','OpenCV','HuggingFace','LangChain','Airflow','dbt','Spark'
]

const SOFT_SKILLS: string[] = [
  'Коммуникации','Лидерство','Работа в команде','Самоорганизация','Тайм‑менеджмент','Критическое мышление','Публичные выступления','Наставничество','Проактивность','Решение проблем','Гибкость','Стрессоустойчивость','Ведение переговоров','Внимание к деталям','Клиентоориентированность'
]

export default function CreateJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'RUB',
    experienceLevel: '',
    employmentType: '',
    workFormat: '',
    location: '',
    isRemote: false,
    expiresAt: '',
    siteCategory: '',
    skills: [] as Skill[]
  })
  const [roleOther, setRoleOther] = useState<string>('')
  const [roleMode, setRoleMode] = useState<'select' | 'other'>('select')
  const [customSkillOpen, setCustomSkillOpen] = useState(false)
  const [customSkillName, setCustomSkillName] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      if (session?.user?.role !== 'EMPLOYER') {
        router.push('/dashboard')
        return
      }
    }
  }, [status, router, session])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', category: '' }]
    }))
  }

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const updateSkill = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }))
  }
  const categorizeSkill = (name: string): string => {
    const n = name.toLowerCase()
    const soft = new Set(SOFT_SKILLS.map(s => s.toLowerCase()))
    if (soft.has(n)) return 'Soft Skill'
    const langs = ['javascript','typescript','python','go','java','kotlin','swift','c#','c++','php','ruby','rust','sql']
    if (langs.includes(n)) return 'Programming Language'
    const frameworks = ['react','next.js','vue','angular','django','flask','fastapi','spring','laravel','rails','nestjs','express']
    if (frameworks.includes(n)) return 'Framework'
    const db = ['postgresql','mysql','mongodb','redis']
    if (db.includes(n)) return 'Database'
    return 'Tool'
  }

  const addNamedSkill = (name: string) => {
    const v = name.trim()
    if (!v) return
    setFormData(prev => {
      const exists = prev.skills.some(s => s.name.toLowerCase() === v.toLowerCase())
      if (exists) return prev
      const category = categorizeSkill(v)
      return { ...prev, skills: [...prev.skills, { name: v, category }] }
    })
  }

  const removeNamedSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (!formData.siteCategory) {
        toast({
          title: "Категория не выбрана",
          description: "Пожалуйста, укажите категорию вакансии",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          responsibilities: formData.responsibilities,
          benefits: formData.benefits,
          currency: formData.currency,
          experienceLevel: formData.experienceLevel,
          employmentType: formData.employmentType,
          workFormat: formData.workFormat,
          location: formData.location ? formData.location : undefined,
          isRemote: formData.isRemote,
          expiresAt: formData.expiresAt ? formData.expiresAt : undefined,
          siteCategory: formData.siteCategory,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
          skills: (formData.skills && formData.skills.filter(s => s.name && s.name.trim() !== '').length > 0)
            ? formData.skills.filter(s => s.name && s.name.trim() !== '')
            : undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Вакансия создана",
        })
        router.push('/employer')
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.details || error.error || "Не удалось создать вакансию",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать вакансию",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Создать вакансию
            </h1>
            <p className="text-slate-600 dark:text-gray-300">
              Заполните информацию о вакансии
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Роль / Должность *</Label>
                  {roleMode === 'select' ? (
                    <div className="flex gap-2">
                      <Select
                        value={formData.title}
                        onValueChange={(v) => {
                          if (v === '__OTHER__') {
                            setRoleMode('other')
                            setRoleOther('')
                          } else {
                            handleInputChange('title', v)
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите из списка" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__OTHER__">Другое…</SelectItem>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={roleOther}
                        onChange={(e) => setRoleOther(e.target.value)}
                        placeholder="Введите свою роль/должность"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const v = roleOther.trim()
                          if (!v) return
                          handleInputChange('title', v)
                          setRoleMode('select')
                        }}
                      >
                        Добавить
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="experienceLevel">Уровень опыта *</Label>
                  <Select
                    value={formData.experienceLevel}
                    onValueChange={(value) => handleInputChange('experienceLevel', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JUNIOR">Junior</SelectItem>
                      <SelectItem value="MIDDLE">Middle</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="INTERN">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employmentType">Тип занятости *</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => handleInputChange('employmentType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Полная занятость</SelectItem>
                      <SelectItem value="PART_TIME">Частичная занятость</SelectItem>
                      <SelectItem value="CONTRACT">Контракт</SelectItem>
                      <SelectItem value="FREELANCE">Фриланс</SelectItem>
                      <SelectItem value="INTERNSHIP">Стажировка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workFormat">Формат работы *</Label>
                  <Select
                    value={formData.workFormat}
                    onValueChange={(value) => handleInputChange('workFormat', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMOTE">Удаленная</SelectItem>
                      <SelectItem value="OFFICE">В офисе</SelectItem>
                      <SelectItem value="HYBRID">Гибрид</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="siteCategory">Категория вакансии *</Label>
                <Select
                  value={formData.siteCategory}
                  onValueChange={(value) => handleInputChange('siteCategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SITE_CATEGORY_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRemote"
                  checked={formData.isRemote}
                  onCheckedChange={(checked) => handleInputChange('isRemote', checked)}
                />
                <Label htmlFor="isRemote">Полностью удаленная работа</Label>
              </div>

              <div>
                <Label htmlFor="location">Локация</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Город"
                />
              </div>
            </CardContent>
          </Card>

          {/* Salary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Зарплата
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salaryMin">От</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">До</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Валюта</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Описание вакансии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="description">Описание *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Подробное описание вакансии, компании и условий работы"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="requirements">Требования *</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="Обязательные требования к кандидату"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="responsibilities">Обязанности</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                  placeholder="Основные обязанности на должности"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="benefits">Преимущества и бонусы</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleInputChange('benefits', e.target.value)}
                  placeholder="Дополнительные преимущества работы в вашей компании"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Требуемые навыки
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Выбранные */}
              <div className="mb-4">
                <div className="text-sm text-slate-600 dark:text-gray-300 mb-2">Выбранные навыки</div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((s, i) => (
                    <button
                      key={`${s.name}-${i}`}
                      type="button"
                      title="Удалить"
                      onClick={() => removeNamedSkill(i)}
                      className="px-2 py-1 rounded-full border text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      {s.name} <span className="text-[10px]">×</span>
                    </button>
                  ))}
                  {formData.skills.length === 0 && (
                    <span className="text-slate-500 dark:text-gray-400 text-sm">Пока пусто</span>
                  )}
                </div>
              </div>

              {/* Быстрые пресеты */}
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Технические навыки</div>
                  <div className="flex flex-wrap gap-2">
                    {TECH_SKILLS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="px-3 py-1 rounded-full border text-sm hover:bg-accent"
                        onClick={() => addNamedSkill(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Мягкие навыки</div>
                  <div className="flex flex-wrap gap-2">
                    {SOFT_SKILLS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="px-3 py-1 rounded-full border text-sm hover:bg-accent"
                        onClick={() => addNamedSkill(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Плюсик для своего навыка */}
                <div className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setCustomSkillOpen(v => !v)}>
                    <Plus className="inline w-4 h-4 mr-2" /> Добавить свой навык
                  </Button>
                  {customSkillOpen && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={customSkillName}
                        onChange={(e) => setCustomSkillName(e.target.value)}
                        placeholder="Введите свой навык"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addNamedSkill(customSkillName)
                          setCustomSkillName('')
                          setCustomSkillOpen(false)
                        }}
                      >
                        Добавить
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Срок действия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="expiresAt">Дата окончания (необязательно)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Создание...' : 'Создать вакансию'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}