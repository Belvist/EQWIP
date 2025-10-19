'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Github,
  Linkedin,
  Globe
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

// Справочники для ролей и навыков (соискатель)
const ROLES = [
  'Frontend Developer','Backend Developer','Full‑Stack Developer','Mobile Developer','DevOps Engineer','Data Scientist','ML Engineer','MLOps Engineer','AI Engineer','Product Manager','Project Manager','QA Engineer','Automation QA','Security Engineer','SRE','System Administrator','UI/UX Designer','Data Analyst','Business Analyst','Solution Architect','Tech Lead'
]

const TECH_SKILLS: string[] = [
  'JavaScript','TypeScript','React','Next.js','Vue','Angular','Node.js','Express','NestJS','Python','Django','Flask','FastAPI','Go','Java','Spring','Kotlin','Swift','Objective‑C','C#','.NET','PHP','Laravel','Ruby','Rails','C++','Rust','SQL','PostgreSQL','MySQL','MongoDB','Redis','Kafka','RabbitMQ','GraphQL','REST API','gRPC','Docker','Kubernetes','Helm','Terraform','Ansible','AWS','GCP','Azure','Linux','Nginx','CI/CD','GitHub Actions','GitLab CI','Jenkins','Playwright','Cypress','Jest','Vitest','PyTorch','TensorFlow','CUDA','OpenCV','HuggingFace','LangChain','Airflow','dbt','Spark'
]

const SOFT_SKILLS: string[] = [
  'Коммуникации','Лидерство','Работа в команде','Самоорганизация','Тайм‑менеджмент','Критическое мышление','Публичные выступления','Наставничество','Проактивность','Решение проблем','Гибкость','Стрессоустойчивость','Ведение переговоров','Внимание к деталям','Клиентоориентированность'
]

interface CandidateProfile {
  id: string
  title?: string
  bio?: string
  location?: string
  website?: string
  linkedin?: string
  github?: string
  portfolio?: string
  resumeUrl?: string
  experience?: number
  salaryMin?: number
  salaryMax?: number
  currency: string
  skills: Array<{
    id: string
    level: number
    skill: {
      id: string
      name: string
      category: string
    }
  }>
  workExperience: Array<{
    id: string
    title: string
    company: string
    description?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
  }>
  education: Array<{
    id: string
    institution: string
    degree?: string
    field?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [skillModes, setSkillModes] = useState<Record<number, 'select' | 'other'>>({})
  const [skillOtherValues, setSkillOtherValues] = useState<Record<number, string>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/candidate')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData(data)
      } else {
        // Create empty profile if none exists
        const emptyProfile: CandidateProfile = {
          id: '',
          currency: 'RUB',
          skills: [],
          workExperience: [],
          education: []
        }
        setProfile(emptyProfile)
        setFormData(emptyProfile)
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile/candidate', {
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
          description: "Профиль обновлен",
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить профиль",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
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

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), { skill: { name: '', category: '' }, level: 3 }]
    }))
  }

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const updateSkill = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }))
  }

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...(prev.workExperience || []), {
        title: '',
        company: '',
        description: '',
        startDate: '',
        endDate: '',
        isCurrent: false
      }]
    }))
  }

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }))
  }

  const updateExperience = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        isCurrent: false
      }]
    }))
  }

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const updateEducation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div>Ошибка загрузки профиля</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Мой профиль
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Управляйте своей информацией и резюме
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

        {/* Basic Info */}
        <Card className="mb-8 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Основная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={session?.user?.id ? `/api/profile/avatar?user=${encodeURIComponent((session.user as any).id)}` : undefined} />
                <AvatarFallback className="text-xl">
                  {session?.user?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Роль / Должность</Label>
                      {formData.__roleMode !== 'other' ? (
                        <div className="flex gap-2">
                          <Select
                            value={formData.title || ''}
                            onValueChange={(v) => {
                              if (v === '__OTHER__') {
                                handleInputChange('__roleMode', 'other')
                                handleInputChange('__roleOther', '')
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
                            id="title"
                            value={formData.__roleOther || ''}
                            onChange={(e) => handleInputChange('__roleOther', e.target.value)}
                            placeholder="Введите свою роль/должность"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const v = (formData.__roleOther || '').trim()
                              if (!v) return
                              handleInputChange('title', v)
                              handleInputChange('__roleMode', 'select')
                            }}
                          >
                            Добавить
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="bio">О себе</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Расскажите о себе и своем опыте"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                      {session?.user?.name}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                      {profile.title || 'Должность не указана'}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {profile.bio || 'Описание не добавлено'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Контакты</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4" />
                    {session?.user?.email}
                  </div>
                  {profile.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
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
                <div className="space-y-2">
                  {profile.website && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Globe className="w-4 h-4" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-700">
                        Веб-сайт
                      </a>
                    </div>
                  )}
                  {profile.github && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Github className="w-4 h-4" />
                      <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-700">
                        GitHub
                      </a>
                    </div>
                  )}
                  {profile.linkedin && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Linkedin className="w-4 h-4" />
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-700">
                        LinkedIn
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="mb-8 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Навыки
              </div>
              {isEditing && (
                <Button variant="outline" size="sm" onClick={addSkill}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {formData.skills?.map((skill: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="col-span-2 flex gap-2">
                        {skillModes[index] !== 'other' ? (
                          <Select
                            value={skill.skill?.name || ''}
                            onValueChange={(v) => {
                              if (v === '__OTHER__') {
                                setSkillModes(m => ({ ...m, [index]: 'other' }))
                                setSkillOtherValues(vv => ({ ...vv, [index]: '' }))
                              } else {
                                updateSkill(index, 'skill', { ...skill.skill, name: v })
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Выберите навык" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="__OTHER__">Другое…</SelectItem>
                              {TECH_SKILLS.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2 w-full">
                            <Input
                              value={skillOtherValues[index] || ''}
                              onChange={(e) => setSkillOtherValues(v => ({ ...v, [index]: e.target.value }))}
                              placeholder="Введите свой навык"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                const v = (skillOtherValues[index] || '').trim()
                                if (!v) return
                                updateSkill(index, 'skill', { ...skill.skill, name: v })
                                setSkillModes(m => ({ ...m, [index]: 'select' }))
                              }}
                            >
                              Добавить
                            </Button>
                          </div>
                        )}
                      </div>
                      <Select
                        value={skill.level?.toString() || '3'}
                        onValueChange={(value) => updateSkill(index, 'level', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Начинающий</SelectItem>
                          <SelectItem value="2">Любительский</SelectItem>
                          <SelectItem value="3">Средний</SelectItem>
                          <SelectItem value="4">Хороший</SelectItem>
                          <SelectItem value="5">Эксперт</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Soft skills быстрый набор */}
                <div className="mt-2">
                  <Label>Мягкие навыки (быстрый выбор)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SOFT_SKILLS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="px-3 py-1 rounded-full border text-sm hover:bg-accent"
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            skills: [...(prev.skills || []), { skill: { name: s, category: 'Soft Skill' }, level: 4 }]
                          }))
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill, index) => (
                  <span key={index} className="text-sm inline-flex items-center px-2 py-1 rounded-full border">
                    {skill.skill.name} ({skill.level}/5)
                  </span>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                  <p className="text-slate-500 dark:text-slate-400">Навыки не добавлены</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card className="mb-8 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Опыт работы
              </div>
              {isEditing && (
                <Button variant="outline" size="sm" onClick={addExperience}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {formData.workExperience?.map((exp: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Опыт работы #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        value={exp.title || ''}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="Должность"
                      />
                      <Input
                        value={exp.company || ''}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="Компания"
                      />
                    </div>
                    <Textarea
                      value={exp.description || ''}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Описание обязанностей"
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Дата начала</Label>
                        <Input
                          type="date"
                          value={exp.startDate || ''}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Дата окончания</Label>
                        <Input
                          type="date"
                          value={exp.endDate || ''}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          disabled={exp.isCurrent}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`current-${index}`}
                        checked={exp.isCurrent || false}
                        onChange={(e) => {
                          updateExperience(index, 'isCurrent', e.target.checked)
                          if (e.target.checked) {
                            updateExperience(index, 'endDate', '')
                          }
                        }}
                      />
                      <Label htmlFor={`current-${index}`}>По настоящее время</Label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {profile.workExperience?.map((exp, index) => (
                  <div key={index} className="border-l-4 border-slate-500 pl-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{exp.title}</h4>
                    <p className="text-slate-600 dark:text-slate-300">{exp.company}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(exp.startDate).toLocaleDateString('ru-RU')} - {
                        exp.isCurrent ? 'Настоящее время' : 
                        exp.endDate ? new Date(exp.endDate).toLocaleDateString('ru-RU') : ''
                      }
                    </p>
                    {exp.description && (
                      <p className="text-slate-700 dark:text-slate-300 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
                {(!profile.workExperience || profile.workExperience.length === 0) && (
                  <p className="text-slate-500 dark:text-slate-400">Опыт работы не добавлен</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Образование
              </div>
              {isEditing && (
                <Button variant="outline" size="sm" onClick={addEducation}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {formData.education?.map((edu: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Образование #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        value={edu.institution || ''}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        placeholder="Учебное заведение"
                      />
                      <Input
                        value={edu.degree || ''}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Степень"
                      />
                    </div>
                    <Input
                      value={edu.field || ''}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      placeholder="Специальность"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Дата начала</Label>
                        <Input
                          type="date"
                          value={edu.startDate || ''}
                          onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Дата окончания</Label>
                        <Input
                          type="date"
                          value={edu.endDate || ''}
                          onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                          disabled={edu.isCurrent}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edu-current-${index}`}
                        checked={edu.isCurrent || false}
                        onChange={(e) => {
                          updateEducation(index, 'isCurrent', e.target.checked)
                          if (e.target.checked) {
                            updateEducation(index, 'endDate', '')
                          }
                        }}
                      />
                      <Label htmlFor={`edu-current-${index}`}>По настоящее время</Label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {profile.education?.map((edu, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{edu.institution}</h4>
                    <p className="text-slate-600 dark:text-slate-300">
                      {edu.degree} {edu.field && `• ${edu.field}`}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(edu.startDate).toLocaleDateString('ru-RU')} - {
                        edu.isCurrent ? 'Настоящее время' : 
                        edu.endDate ? new Date(edu.endDate).toLocaleDateString('ru-RU') : ''
                      }
                    </p>
                  </div>
                ))}
                {(!profile.education || profile.education.length === 0) && (
                  <p className="text-slate-500 dark:text-slate-400">Образование не добавлено</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}