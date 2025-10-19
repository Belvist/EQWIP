'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users, 
  Building,
  FileText,
  CheckCircle,
  ArrowRight,
  Plus,
  X,
  Tag,
  Target,
  Star,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Footer from '@/components/Footer'
import { useUser } from '@/contexts/UserContext'

interface JobFormData {
  title: string
  company: string
  description: string
  requirements: string[]
  benefits: string[]
  location: string
  salaryMin: string
  salaryMax: string
  currency: string
  experienceLevel: string
  employmentType: string
  workFormat: string
  skills: string[]
  category: string
  applicationDeadline: string
  contactEmail: string
  isRemote: boolean
  isPromoted: boolean
}

export default function PostJobPage() {
  const { userRole, isLoggedIn } = useUser()
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    description: '',
    requirements: [''],
    benefits: [''],
    location: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'RUB',
    experienceLevel: '',
    employmentType: '',
    workFormat: '',
    skills: [''],
    category: '',
    applicationDeadline: '',
    contactEmail: '',
    isRemote: false,
    isPromoted: false
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: keyof JobFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'requirements' | 'benefits' | 'skills', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'requirements' | 'benefits' | 'skills') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'requirements' | 'benefits' | 'skills', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          requirements: formData.requirements.filter(r => r.trim() !== ''),
          benefits: formData.benefits.filter(b => b.trim() !== ''),
          skills: formData.skills.filter(s => s.trim() !== '')
        }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        throw new Error('Failed to create job')
      }
    } catch (error) {
      console.error('Error creating job:', error)
      alert('Ошибка при создании вакансии')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn || userRole !== 'employer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <Briefcase className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Размещение вакансий
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Только работодатели могут размещать вакансии. Войдите как работодатель, чтобы продолжить.
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/auth/signin'}
          >
            Войти как работодатель
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Вакансия создана!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Ваша вакансия успешно размещена и теперь доступна для соискателей.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
              onClick={() => window.location.href = '/employer'}
            >
              Перейти в кабинет
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => window.location.href = '/post-job'}
            >
              Создать еще
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Briefcase className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Разместить вакансию
              </h1>
              <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Найдите идеальных кандидатов для вашей компании. Заполните форму ниже, чтобы создать вакансию.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Основная информация
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Название вакансии *
                    </label>
                    <Input
                      type="text"
                      placeholder="Например: Senior React Developer"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Компания *
                    </label>
                    <Input
                      type="text"
                      placeholder="Название вашей компании"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Локация *
                    </label>
                    <Input
                      type="text"
                      placeholder="Например: Москва, Россия"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Категория
                    </label>
                    <Select onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Технологии</SelectItem>
                        <SelectItem value="design">Дизайн</SelectItem>
                        <SelectItem value="marketing">Маркетинг</SelectItem>
                        <SelectItem value="sales">Продажи</SelectItem>
                        <SelectItem value="finance">Финансы</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="operations">Операции</SelectItem>
                        <SelectItem value="other">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Описание вакансии *
                  </label>
                  <Textarea
                    placeholder="Подробное описание вакансии, обязанностей и условий работы..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                    rows={6}
                    className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Детали вакансии
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Опыт работы
                    </label>
                    <Select onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                        <SelectValue placeholder="Выберите уровень" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intern">Стажер</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Тип занятости
                    </label>
                    <Select onValueChange={(value) => handleInputChange('employmentType', value)}>
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Полная занятость</SelectItem>
                        <SelectItem value="part-time">Частичная занятость</SelectItem>
                        <SelectItem value="contract">Контракт</SelectItem>
                        <SelectItem value="internship">Стажировка</SelectItem>
                        <SelectItem value="project">Проектная работа</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Формат работы
                    </label>
                    <Select onValueChange={(value) => handleInputChange('workFormat', value)}>
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                        <SelectValue placeholder="Выберите формат" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">В офисе</SelectItem>
                        <SelectItem value="remote">Удаленно</SelectItem>
                        <SelectItem value="hybrid">Гибрид</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Зарплата от
                    </label>
                    <Input
                      type="number"
                      placeholder="Минимальная зарплата"
                      value={formData.salaryMin}
                      onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Зарплата до
                    </label>
                    <Input
                      type="number"
                      placeholder="Максимальная зарплата"
                      value={formData.salaryMax}
                      onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Валюта
                    </label>
                    <Select onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                        <SelectValue placeholder="Выберите валюту" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RUB">RUB (₽)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRemote}
                      onChange={(e) => handleInputChange('isRemote', e.target.checked)}
                      className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Удаленная работа</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPromoted}
                      onChange={(e) => handleInputChange('isPromoted', e.target.checked)}
                      className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Продвинутая вакансия</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Требования
                  </h2>
                </div>

                <div className="space-y-4">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        placeholder={`Требование ${index + 1}`}
                        value={requirement}
                        onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('requirements', index)}
                          className="p-2 border-gray-300 dark:border-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('requirements')}
                    className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить требование
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <Tag className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Навыки
                  </h2>
                </div>

                <div className="space-y-4">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        placeholder={`Навык ${index + 1}`}
                        value={skill}
                        onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      />
                      {formData.skills.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('skills', index)}
                          className="p-2 border-gray-300 dark:border-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('skills')}
                    className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить навык
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Преимущества
                  </h2>
                </div>

                <div className="space-y-4">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        placeholder={`Преимущество ${index + 1}`}
                        value={benefit}
                        onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('benefits', index)}
                          className="p-2 border-gray-300 dark:border-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('benefits')}
                    className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить преимущество
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Контактная информация
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email для откликов *
                    </label>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Срок приема откликов
                    </label>
                    <Input
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-3 text-lg font-medium rounded-2xl"
              >
                {loading ? 'Создание вакансии...' : 'Разместить вакансию'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}