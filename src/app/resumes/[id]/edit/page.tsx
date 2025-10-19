"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Target,
  Save,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  DollarSign,
} from 'lucide-react'

// Готовые пресеты навыков (как в создании резюме)
const TECH_SKILLS: string[] = [
  'JavaScript','TypeScript','React','Next.js','Vue','Angular','Node.js','Express','NestJS','Python','Django','Flask','FastAPI','Go','Java','Spring','Kotlin','Swift','Objective‑C','C#','.NET','PHP','Laravel','Ruby','Rails','C++','Rust','SQL','PostgreSQL','MySQL','MongoDB','Redis','Kafka','RabbitMQ','GraphQL','REST API','gRPC','Docker','Kubernetes','Helm','Terraform','Ansible','AWS','GCP','Azure','Linux','Nginx','CI/CD','GitHub Actions','GitLab CI','Jenkins','Playwright','Cypress','Jest','Vitest','PyTorch','TensorFlow','CUDA','OpenCV','HuggingFace','LangChain','Airflow','dbt','Spark'
]

const SOFT_SKILLS: string[] = [
  'Коммуникации','Лидерство','Работа в команде','Самоорганизация','Тайм‑менеджмент','Критическое мышление','Публичные выступления','Наставничество','Проактивность','Решение проблем','Гибкость','Стрессоустойчивость','Ведение переговоров','Внимание к деталям','Клиентоориентированность'
]

interface ResumeData {
  personal: {
    fullName: string
    email: string
    phone: string
    location: string
    website: string
    summary: string
  }
  targetJob?: { title: string }
  experience: Array<{
    id: string
    title: string
    company: string
    location: string
    startDate: string
    endDate: string
    description: string
  }>
  education: Array<{
    id: string
    degree: string
    institution: string
    location: string
    startDate: string
    endDate: string
    gpa?: string
  }>
  skills: Array<{ category: string; items: string[] }>
  languages: Array<{ language: string; level: string }>
  certifications: Array<{ name: string; issuer: string; date: string; credentialId?: string }>
  compensation?: { salaryMin?: number | null; salaryMax?: number | null; currency?: 'RUB' | 'USD' | 'EUR' }
}

export default function EditResumePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { status } = useSession()
  const isLoggedIn = status === 'authenticated'

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/resumes/${params.id}`)
        if (!res.ok) throw new Error('not found')
        const json = await res.json()
        const data = (json.data || {}) as ResumeData
        setResumeData({
          personal: {
            fullName: data?.personal?.fullName || '',
            email: data?.personal?.email || '',
            phone: data?.personal?.phone || '',
            location: data?.personal?.location || '',
            website: data?.personal?.website || '',
            summary: data?.personal?.summary || '',
          },
          targetJob: { title: data?.targetJob?.title || '' },
          experience: Array.isArray(data?.experience) ? data.experience : [],
          education: Array.isArray(data?.education) ? data.education : [],
          skills: Array.isArray(data?.skills) ? data.skills : [
            { category: 'Технические навыки', items: [] },
            { category: 'Мягкие навыки', items: [] }
          ],
          languages: Array.isArray(data?.languages) ? data.languages : [],
          certifications: Array.isArray(data?.certifications) ? data.certifications : [],
          compensation: data?.compensation || { salaryMin: null, salaryMax: null, currency: 'RUB' },
        })
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isLoggedIn, params.id])

  const handlePersonalChange = (field: string, value: string) => {
    setResumeData(prev => prev ? ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }) : prev)
  }

  const handleCompensationChange = (field: 'salaryMin' | 'salaryMax' | 'currency', value: any) => {
    setResumeData(prev => prev ? ({
      ...prev,
      compensation: {
        ...(prev.compensation || { salaryMin: null, salaryMax: null, currency: 'RUB' }),
        [field]: field === 'salaryMin' || field === 'salaryMax'
          ? (value === '' || value === null ? null : Number(value))
          : value
      }
    }) : prev)
  }

  const handleExperienceChange = (index: number, field: string, value: string) => {
    setResumeData(prev => prev ? ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }) : prev)
  }

  const addExperience = () => {
    setResumeData(prev => prev ? ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now().toString(),
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }) : prev)
  }

  const removeExperience = (index: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }) : prev)
  }

  const handleEducationChange = (index: number, field: string, value: string) => {
    setResumeData(prev => prev ? ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }) : prev)
  }

  const addEducation = () => {
    setResumeData(prev => prev ? ({
      ...prev,
      education: [...prev.education, {
        id: Date.now().toString(),
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
        gpa: ''
      }]
    }) : prev)
  }

  const removeEducation = (index: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }) : prev)
  }

  const updateSkills = (categoryIndex: number, items: string[]) => {
    setResumeData(prev => prev ? ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === categoryIndex ? { ...skill, items } : skill)
    }) : prev)
  }

  const handleSkillsChange = (categoryIndex: number, itemIndex: number, value: string) => {
    setResumeData(prev => prev ? ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === categoryIndex ? {
          ...skill,
          items: skill.items.map((item, j) => j === itemIndex ? value : item)
        } : skill
      )
    }) : prev)
  }

  const addSkillItem = (categoryIndex: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === categoryIndex ? {
          ...skill,
          items: [...skill.items, '']
        } : skill
      )
    }) : prev)
  }

  const removeSkillItem = (categoryIndex: number, itemIndex: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === categoryIndex ? {
          ...skill,
          items: skill.items.filter((_, j) => j !== itemIndex)
        } : skill
      )
    }) : prev)
  }

  const addSkillCategory = () => {
    setResumeData(prev => prev ? ({
      ...prev,
      skills: [...prev.skills, { category: 'Новая категория', items: [] }]
    }) : prev)
  }

  const removeSkillCategory = (categoryIndex: number) => {
    setResumeData(prev => prev ? ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== categoryIndex)
    }) : prev)
  }

  const handleSkillCategoryChange = (categoryIndex: number, value: string) => {
    setResumeData(prev => prev ? ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === categoryIndex ? { ...skill, category: value } : skill
      )
    }) : prev)
  }

  const save = async () => {
    if (!resumeData) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/resumes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: resumeData.personal.fullName || 'Резюме', 
          data: resumeData 
        })
      })
      if (!res.ok) {
        alert('Не удалось сохранить резюме')
        return
      }
      router.push(`/resumes/${params.id}`)
    } catch {
      alert('Ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Редактирование резюме</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Войдите как соискатель, чтобы редактировать резюме</p>
          <Button size="lg" className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100" onClick={() => (window.location.href = '/auth/signin')}>Войти</Button>
        </div>
      </div>
    )
  }

  if (loading || !resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-500">Загрузка...</div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Редактирование резюме</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/resumes/${params.id}`)}>Отмена</Button>
              <Button size="sm" className="gap-2" onClick={save} disabled={isSaving}>
                <Save className="w-4 h-4" /> {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Желаемая должность</label>
                  <Input 
                    value={resumeData.targetJob?.title || ''} 
                    onChange={(e) => setResumeData(prev => prev ? ({
                      ...prev,
                      targetJob: { ...prev.targetJob, title: e.target.value }
                    }) : prev)} 
                    placeholder="Например: Senior Frontend Engineer" 
                  />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-6">Личные данные</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Полное имя</label>
                  <Input value={resumeData.personal.fullName} onChange={(e) => handlePersonalChange('fullName', e.target.value)} placeholder="Иван Иванов" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <Input type="email" value={resumeData.personal.email} onChange={(e) => handlePersonalChange('email', e.target.value)} placeholder="ivan@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
                  <Input value={resumeData.personal.phone} onChange={(e) => handlePersonalChange('phone', e.target.value)} placeholder="+7 (999) 123-45-67" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Локация</label>
                  <Input value={resumeData.personal.location} onChange={(e) => handlePersonalChange('location', e.target.value)} placeholder="Moscow, Russia" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">О себе</label>
                  <textarea value={resumeData.personal.summary} onChange={(e) => handlePersonalChange('summary', e.target.value)} rows={4} className="w-full p-3 border-2 border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 resize-none" />
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Желаемая зарплата</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">От</label>
                    <Input type="number" value={resumeData.compensation?.salaryMin ?? ''} onChange={(e) => handleCompensationChange('salaryMin', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">До</label>
                    <Input type="number" value={resumeData.compensation?.salaryMax ?? ''} onChange={(e) => handleCompensationChange('salaryMax', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Валюта</label>
                    <Select value={resumeData.compensation?.currency || 'RUB'} onValueChange={(v) => handleCompensationChange('currency', v)}>
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
              </div>

              {/* Опыт работы */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5" /> Опыт работы
                  </h4>
                  <Button variant="outline" size="sm" onClick={addExperience}>+ Добавить опыт</Button>
                </div>
                {resumeData.experience.map((exp, index) => (
                  <Card key={exp.id} className="mb-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Опыт {index + 1}</h5>
                        <Button variant="outline" size="sm" onClick={() => removeExperience(index)} className="text-red-600 hover:text-red-700">Удалить</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Должность</label>
                          <Input value={exp.title} onChange={(e) => handleExperienceChange(index, 'title', e.target.value)} placeholder="Frontend Developer" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Компания</label>
                          <Input value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} placeholder="ООО Рога и Копыта" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Локация</label>
                          <Input value={exp.location} onChange={(e) => handleExperienceChange(index, 'location', e.target.value)} placeholder="Moscow, Russia" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дата начала</label>
                          <Input type="date" value={exp.startDate} onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дата окончания</label>
                          <Input type="date" value={exp.endDate} onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Описание</label>
                          <textarea 
                            value={exp.description} 
                            onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} 
                            rows={3} 
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 resize-none" 
                            placeholder="Опишите ваши обязанности и достижения"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Образование */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" /> Образование
                  </h4>
                  <Button variant="outline" size="sm" onClick={addEducation}>+ Добавить образование</Button>
                </div>
                {resumeData.education.map((edu, index) => (
                  <Card key={edu.id} className="mb-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Образование {index + 1}</h5>
                        <Button variant="outline" size="sm" onClick={() => removeEducation(index)} className="text-red-600 hover:text-red-700">Удалить</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Степень</label>
                          <Input value={edu.degree} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} placeholder="Бакалавр" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Учебное заведение</label>
                          <Input value={edu.institution} onChange={(e) => handleEducationChange(index, 'institution', e.target.value)} placeholder="МГУ им. Ломоносова" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Локация</label>
                          <Input value={edu.location} onChange={(e) => handleEducationChange(index, 'location', e.target.value)} placeholder="Moscow, Russia" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дата начала</label>
                          <Input type="date" value={edu.startDate} onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дата окончания</label>
                          <Input type="date" value={edu.endDate} onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GPA</label>
                          <Input value={edu.gpa || ''} onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)} placeholder="4.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Навыки */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5" /> Навыки
                  </h4>
                  <Button variant="outline" size="sm" onClick={addSkillCategory}>+ Добавить категорию</Button>
                </div>
                {resumeData.skills.map((skill, categoryIndex) => (
                  <Card key={categoryIndex} className="mb-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Input 
                          value={skill.category} 
                          onChange={(e) => handleSkillCategoryChange(categoryIndex, e.target.value)} 
                          className="w-48 font-medium"
                          placeholder="Название категории"
                        />
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => removeSkillCategory(categoryIndex)} className="text-red-600 hover:text-red-700">Удалить</Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skill.items.map((s, itemIndex) => (
                          <button
                            key={itemIndex}
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={() => {
                              const next = skill.items.filter((_, j) => j !== itemIndex)
                              updateSkills(categoryIndex, next)
                            }}
                            title="Удалить"
                          >
                            {s}
                            <span className="text-[10px] leading-none">×</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 items-start">
                        {(() => {
                          const isTech = skill.category.toLowerCase().includes('техничес')
                          const isSoft = skill.category.toLowerCase().includes('мяг')
                          const options = isTech ? TECH_SKILLS : (isSoft ? SOFT_SKILLS : [])
                          const modeMap = (resumeData as any).__skillMode || {}
                          const otherMap = (resumeData as any).__skillOther || {}
                          const isOther = modeMap[categoryIndex] === 'other'
                          return (
                            <>
                              {!isOther && (
                                <Select
                                  value={''}
                                  onValueChange={(v) => {
                                    if (v === '__OTHER__') {
                                      setResumeData(prev => prev ? ({ ...prev, __skillMode: { ...(prev as any).__skillMode, [categoryIndex]: 'other' }, __skillOther: { ...(prev as any).__skillOther, [categoryIndex]: '' } }) : prev)
                                    } else if (v) {
                                      if (!skill.items.includes(v)) {
                                        updateSkills(categoryIndex, [...skill.items, v])
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full md:w-[360px]">
                                    <SelectValue placeholder={options.length ? 'Выберите навык из списка' : 'Добавьте навык'} />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-64">
                                    <SelectItem value="__OTHER__">Другое…</SelectItem>
                                    {options.map((s) => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {isOther && (
                                <div className="flex gap-2 w-full">
                                  <Input
                                    type="text"
                                    value={otherMap[categoryIndex] || ''}
                                    onChange={(e) => setResumeData(prev => prev ? ({ ...prev, __skillOther: { ...(prev as any).__skillOther, [categoryIndex]: e.target.value } }) : prev)}
                                    placeholder="Введите свой навык"
                                    className="flex-1 min-w-[260px]"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const v = String(((resumeData as any).__skillOther || {})[categoryIndex] || '').trim()
                                      if (!v) return
                                      if (!skill.items.includes(v)) {
                                        updateSkills(categoryIndex, [...skill.items, v])
                                      }
                                      setResumeData(prev => prev ? ({ ...prev, __skillMode: { ...(prev as any).__skillMode, [categoryIndex]: 'select' }, __skillOther: { ...(prev as any).__skillOther, [categoryIndex]: '' } }) : prev)
                                    }}
                                  >
                                    Добавить
                                  </Button>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>

                      {skill.category.toLowerCase().includes('техничес') && (
                        <div className="w-full mt-3">
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Массовый ввод</div>
                          <textarea
                            data-bulk-tech={`tech-${categoryIndex}`}
                            placeholder="Вставьте список навыков (каждый с новой строки или через запятую)"
                            className="w-full min-h-[120px] p-3 border-2 border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                          />
                          <div className="mt-2 flex items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const el = document.querySelector(`textarea[data-bulk-tech="tech-${categoryIndex}"]`) as HTMLTextAreaElement | null
                                if (!el) return
                                const parts = el.value.split(/[\n,;]+/)
                                const cleaned = parts.map(s => s.trim()).filter(Boolean)
                                if (cleaned.length === 0) return
                                const merged = Array.from(new Set([...(skill.items || []), ...cleaned]))
                                updateSkills(categoryIndex, merged)
                              }}
                            >
                              Добавить из поля
                            </Button>
                            <span className="text-xs text-gray-500">Разделяйте навыки запятыми или с новой строки</span>
                          </div>
                        </div>
                      )}

                      {skill.category.toLowerCase().includes('мяг') && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-500 mb-2">Быстрый выбор</div>
                          <div className="flex flex-wrap gap-2">
                            {SOFT_SKILLS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className="px-3 py-1 rounded-full border text-sm hover:bg-accent"
                                onClick={() => {
                                  if (!skill.items.includes(s)) {
                                    updateSkills(categoryIndex, [...skill.items, s])
                                  }
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
