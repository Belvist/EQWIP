'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award,
  Target,
  Plus,
  Save,
  Eye,
  Download,
  Sparkles,
  Brain,
  CheckCircle,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Справочники для быстрого выбора
const ROLES = [
  'Frontend Developer','Backend Developer','Full‑Stack Developer','Mobile Developer','DevOps Engineer','Data Scientist','ML Engineer','MLOps Engineer','AI Engineer','Product Manager','Project Manager','QA Engineer','Automation QA','Security Engineer','SRE','System Administrator','UI/UX Designer','Data Analyst','Business Analyst','Solution Architect','Tech Lead'
]

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
  targetJob?: {
    title: string
  }
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
  skills: Array<{
    category: string
    items: string[]
  }>
  languages: Array<{
    language: string
    level: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    date: string
    credentialId?: string
  }>
  compensation?: {
    salaryMin?: number | null
    salaryMax?: number | null
    currency?: 'RUB' | 'USD' | 'EUR'
  }
}

export default function CreateResume() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const userRole = (session?.user as any)?.role === 'CANDIDATE' ? 'jobseeker' : (session?.user as any)?.role === 'EMPLOYER' ? 'employer' : null
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'preview'>('personal')
  const [resumeData, setResumeData] = useState<ResumeData>({
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      summary: ''
    },
    targetJob: {
      title: ''
    },
    experience: [],
    education: [],
    skills: [
      { category: 'Технические навыки', items: [] },
      { category: 'Мягкие навыки', items: [] }
    ],
    languages: [],
    certifications: [],
    compensation: { salaryMin: null, salaryMax: null, currency: 'RUB' }
  })

  const [isSaving, setIsSaving] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  const handlePersonalChange = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }))
  }

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: Date.now().toString(),
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        }
      ]
    }))
  }

  const updateExperience = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: Date.now().toString(),
          degree: '',
          institution: '',
          location: '',
          startDate: '',
          endDate: '',
          gpa: ''
        }
      ]
    }))
  }

  const handleCompensationChange = (field: 'salaryMin' | 'salaryMax' | 'currency', value: any) => {
    setResumeData(prev => ({
      ...prev,
      compensation: {
        ...(prev.compensation || { salaryMin: null, salaryMax: null, currency: 'RUB' }),
        [field]: field === 'salaryMin' || field === 'salaryMax'
          ? (value === '' || value === null ? null : Number(value))
          : value
      }
    }))
  }

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const updateSkills = (categoryIndex: number, items: string[]) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, index) => 
        index === categoryIndex ? { ...skill, items } : skill
      )
    }))
  }

  const generateAISuggestions = async () => {
    try {
      const response = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimize',
          resumeText: JSON.stringify(resumeData),
          targetRole: 'Senior Developer'
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.optimization?.suggestions || [])
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
    }
  }

  const saveResume = async () => {
    setIsSaving(true)
    try {
      const title = (resumeData.personal.fullName || '').trim() || `Резюме ${new Date().toLocaleDateString('ru-RU')}`
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          data: resumeData,
          isDefault: true
        }),
      })
      
      if (response.ok) {
        alert('Резюме успешно сохранено!')
        // Optionally redirect to resumes page
        // window.location.href = '/resumes'
      } else {
        const error = await response.json()
        alert(`Ошибка при сохранении резюме: ${error.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Error saving resume:', error)
      alert('Ошибка при сохранении резюме. Пожалуйста, попробуйте еще раз.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isLoggedIn || userRole !== 'jobseeker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Создание резюме
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как соискатель, чтобы создать профессиональное резюме с помощью AI
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Создание резюме
                </h1>
                <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Создайте профессиональное резюме с помощью AI и получите лучшие предложения
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={generateAISuggestions}
              >
                <Brain className="w-4 h-4" />
                AI-советы
              </Button>
              
              <Button 
                size="sm" 
                className="gap-2"
                onClick={saveResume}
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>

          {/* Progress Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {[
              { id: 'personal', label: 'Личные данные', icon: User },
              { id: 'experience', label: 'Опыт работы', icon: Briefcase },
              { id: 'education', label: 'Образование', icon: GraduationCap },
              { id: 'skills', label: 'Навыки', icon: Target },
              { id: 'preview', label: 'Предпросмотр', icon: Eye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI-рекомендации
                  </h3>
                </div>
                <ul className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Tab Content */}
          {activeTab === 'personal' && (
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Личные данные
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Полное имя *
                    </label>
                    <Input
                      type="text"
                      value={resumeData.personal.fullName}
                      onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                      placeholder="Иван Иванов"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={resumeData.personal.email}
                      onChange={(e) => handlePersonalChange('email', e.target.value)}
                      placeholder="ivan@example.com"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Телефон
                    </label>
                    <Input
                      type="tel"
                      value={resumeData.personal.phone}
                      onChange={(e) => handlePersonalChange('phone', e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Локация
                    </label>
                    <Input
                      type="text"
                      value={resumeData.personal.location}
                      onChange={(e) => handlePersonalChange('location', e.target.value)}
                      placeholder="Moscow, Russia"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Веб-сайт/LinkedIn
                    </label>
                    <Input
                      type="url"
                      value={resumeData.personal.website}
                      onChange={(e) => handlePersonalChange('website', e.target.value)}
                      placeholder="https://linkedin.com/in/ivanov"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    О себе
                  </label>
                  <textarea
                    value={resumeData.personal.summary}
                    onChange={(e) => handlePersonalChange('summary', e.target.value)}
                    placeholder="Кратко опишите ваш профессиональный опыт, ключевые навыки и карьерные цели..."
                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 resize-none"
                    rows={4}
                  />
                </div>

                {/* Compensation */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" /> Желаемая зарплата
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        От
                      </label>
                      <Input
                        type="number"
                        value={resumeData.compensation?.salaryMin ?? ''}
                        onChange={(e) => handleCompensationChange('salaryMin', e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        До
                      </label>
                      <Input
                        type="number"
                        value={resumeData.compensation?.salaryMax ?? ''}
                        onChange={(e) => handleCompensationChange('salaryMax', e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Валюта
                      </label>
                      <Select
                        value={resumeData.compensation?.currency || 'RUB'}
                        onValueChange={(v) => handleCompensationChange('currency', v)}
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
                </div>

                {/* Target Job - optional, used for AI optimization */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" /> Целевая вакансия (опционально)
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Роль / Должность
                    </label>
                    <div className="flex gap-2">
                      <Select
                        value={resumeData.__targetRoleMode === 'other' ? '__OTHER__' : (resumeData.targetJob?.title || '')}
                        onValueChange={(v) => {
                          if (v === '__OTHER__') {
                            setResumeData(prev => ({ ...prev, __targetRoleMode: 'other', __targetRoleOther: '' }))
                          } else {
                            setResumeData(prev => ({ ...prev, __targetRoleMode: 'select', targetJob: { title: v } }))
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
                      {resumeData.__targetRoleMode === 'other' && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="text"
                            value={(resumeData as any).__targetRoleOther || ''}
                            onChange={(e) => setResumeData(prev => ({ ...prev, __targetRoleOther: e.target.value }))}
                            placeholder="Введите свою роль/должность"
                            className="w-full"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const v = String((resumeData as any).__targetRoleOther || '').trim()
                              if (!v) return
                              setResumeData(prev => ({ ...prev, targetJob: { title: v }, __targetRoleMode: 'select' }))
                            }}
                          >
                            Добавить
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">AI подстроит метрики и рекомендации под указанную роль</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'experience' && (
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Опыт работы
                  </h3>
                  <Button onClick={addExperience} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Добавить опыт
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {resumeData.experience.map((exp) => (
                    <div key={exp.id} className="border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Опыт работы #{resumeData.experience.indexOf(exp) + 1}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeExperience(exp.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Удалить
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Должность *
                          </label>
                          <Input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                            placeholder="Senior React Developer"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Компания *
                          </label>
                          <Input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            placeholder="TechCorp"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Локация
                          </label>
                          <Input
                            type="text"
                            value={exp.location}
                            onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                            placeholder="Moscow, Russia"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Период работы
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              className="flex-1"
                            />
                            <span className="flex items-center text-gray-500">—</span>
                            <Input
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Описание обязанностей
                        </label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                          placeholder="Опишите ваши основные обязанности и достижения..."
                          className="w-full p-3 border-2 border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {resumeData.experience.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Добавьте ваш опыт работы</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'education' && (
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Образование
                  </h3>
                  <Button onClick={addEducation} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Добавить образование
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {resumeData.education.map((edu) => (
                    <div key={edu.id} className="border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Образование #{resumeData.education.indexOf(edu) + 1}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Удалить
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Степень/Специальность *
                          </label>
                          <Input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="Computer Science, Bachelor"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Учебное заведение *
                          </label>
                          <Input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                            placeholder="МГУ им. Ломоносова"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Локация
                          </label>
                          <Input
                            type="text"
                            value={edu.location}
                            onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                            placeholder="Moscow, Russia"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Период обучения
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              className="flex-1"
                            />
                            <span className="flex items-center text-gray-500">—</span>
                            <Input
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            GPA (опционально)
                          </label>
                          <Input
                            type="text"
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                            placeholder="3.8/4.0"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {resumeData.education.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Добавьте ваше образование</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'skills' && (
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Навыки
                </h3>
                
                <div className="space-y-6">
                  {resumeData.skills.map((skillCategory, categoryIndex) => (
                    <div key={categoryIndex} className="border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {skillCategory.category}
                      </h4>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {skillCategory.items.map((skill, skillIndex) => (
                          <button
                            key={skillIndex}
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={() => {
                              const newItems = skillCategory.items.filter((_, i) => i !== skillIndex)
                              updateSkills(categoryIndex, newItems)
                            }}
                            title="Удалить"
                          >
                            {skill}
                            <span className="text-[10px] leading-none">×</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 items-start">
                        {(() => {
                          const isTech = skillCategory.category.toLowerCase().includes('техничес')
                          const isSoft = skillCategory.category.toLowerCase().includes('мяг')
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
                                      setResumeData(prev => ({ ...prev, __skillMode: { ...(prev as any).__skillMode, [categoryIndex]: 'other' }, __skillOther: { ...(prev as any).__skillOther, [categoryIndex]: '' } }))
                                    } else if (v) {
                                      if (!skillCategory.items.includes(v)) {
                                        updateSkills(categoryIndex, [...skillCategory.items, v])
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
                                    onChange={(e) => setResumeData(prev => ({ ...prev, __skillOther: { ...(prev as any).__skillOther, [categoryIndex]: e.target.value } }))}
                                    placeholder="Введите свой навык"
                                    className="flex-1 min-w-[260px]"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const v = String(((resumeData as any).__skillOther || {})[categoryIndex] || '').trim()
                                      if (!v) return
                                      if (!skillCategory.items.includes(v)) {
                                        updateSkills(categoryIndex, [...skillCategory.items, v])
                                      }
                                      setResumeData(prev => ({ ...prev, __skillMode: { ...(prev as any).__skillMode, [categoryIndex]: 'select' }, __skillOther: { ...(prev as any).__skillOther, [categoryIndex]: '' } }))
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

                      {skillCategory.category.toLowerCase().includes('мяг') && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-500 mb-2">Быстрый выбор</div>
                          <div className="flex flex-wrap gap-2">
                            {SOFT_SKILLS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className="px-3 py-1 rounded-full border text-sm hover:bg-accent"
                                onClick={() => {
                                  if (!skillCategory.items.includes(s)) {
                                    updateSkills(categoryIndex, [...skillCategory.items, s])
                                  }
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preview' && (
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Предпросмотр резюме
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/resumes/pdf-preview', { cache: 'no-store' })
                          if (!res.ok) throw new Error('pdf')
                          const blob = await res.blob()
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'resume-preview.pdf'
                          document.body.appendChild(a)
                          a.click()
                          a.remove()
                          URL.revokeObjectURL(url)
                        } catch {}
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Скачать PDF
                    </Button>
                    <Button onClick={saveResume} className="gap-2">
                      <Save className="w-4 h-4" />
                      Опубликовать
                    </Button>
                  </div>
                </div>
                
                <div id="resume-create-preview" className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
                  {/* Resume Preview Content */}
                  <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {resumeData.personal.fullName || 'Ваше имя'}
                      </h1>
                      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {resumeData.personal.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {resumeData.personal.email}
                          </div>
                        )}
                        {resumeData.personal.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {resumeData.personal.phone}
                          </div>
                        )}
                        {resumeData.personal.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {resumeData.personal.location}
                          </div>
                        )}
                        {(resumeData.compensation?.salaryMin || resumeData.compensation?.salaryMax) && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {(() => {
                              const min = resumeData.compensation?.salaryMin ?? undefined
                              const max = resumeData.compensation?.salaryMax ?? undefined
                              const currency = resumeData.compensation?.currency || 'RUB'
                              const map: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
                              const symbol = map[currency] || currency
                              if (typeof min === 'number' && typeof max === 'number' && !isNaN(min) && !isNaN(max)) {
                                return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`
                              } else if (typeof min === 'number' && !isNaN(min)) {
                                return `от ${symbol}${min.toLocaleString()}`
                              } else if (typeof max === 'number' && !isNaN(max)) {
                                return `до ${symbol}${max.toLocaleString()}`
                              }
                              return ''
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Summary */}
                    {resumeData.personal.summary && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">О себе</h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {resumeData.personal.summary}
                        </p>
                      </div>
                    )}
                    
                    {/* Experience */}
                    {resumeData.experience.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Опыт работы</h2>
                        <div className="space-y-6">
                          {resumeData.experience.map((exp) => (
                            <div key={exp.id}>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {exp.title}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {exp.company} • {exp.location}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {exp.startDate} — {exp.endDate || 'Настоящее время'}
                                </p>
                              </div>
                              {exp.description && (
                                <p className="text-gray-700 dark:text-gray-300">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Education */}
                    {resumeData.education.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Образование</h2>
                        <div className="space-y-4">
                          {resumeData.education.map((edu) => (
                            <div key={edu.id}>
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {edu.degree}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {edu.startDate} — {edu.endDate}
                                </p>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400">
                                {edu.institution} • {edu.location}
                              </p>
                              {edu.gpa && (
                                <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Skills */}
                    {resumeData.skills.some(category => category.items.length > 0) && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Навыки</h2>
                        <div className="space-y-4">
                          {resumeData.skills.map((category, index) => (
                            category.items.length > 0 && (
                              <div key={index}>
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                  {category.category}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {category.items.map((skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="inline-flex items-center px-2 py-1 rounded-full border text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => {
                const tabs = ['personal', 'experience', 'education', 'skills', 'preview']
                const currentIndex = tabs.indexOf(activeTab)
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1] as any)
                }
              }}
              disabled={activeTab === 'personal'}
            >
              Назад
            </Button>
            
            <Button
              onClick={() => {
                const tabs = ['personal', 'experience', 'education', 'skills', 'preview']
                const currentIndex = tabs.indexOf(activeTab)
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1] as any)
                }
              }}
              disabled={activeTab === 'preview'}
            >
              Далее
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}