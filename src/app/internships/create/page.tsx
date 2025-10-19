'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CreateInternship() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    specialty: '',
    description: '',
    studentCount: 1,
    startDate: '',
    endDate: '',
    location: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    // Allow UNIVERSITY role or users with university profile
    const userRole = (session?.user as any)?.role
    if (userRole !== 'UNIVERSITY' && userRole !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.specialty || !formData.description) {
      alert('Заполните все обязательные поля')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        alert('Заявка успешно подана! Работодатели получат уведомления.')
        router.push('/university/postings')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания стажировки')
      }
    } catch (error) {
      console.error('Error creating internship:', error)
      alert('Произошла ошибка при создании стажировки')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/university">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Подать заявку на стажировку</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Заполните заявку на размещение стажеров в компаниях
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Заявка на размещение стажеров</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название стажировки *</Label>
                    <Input
                      id="title"
                      placeholder="Например: Стажировка по веб-разработке"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Специальность *</Label>
                    <Input
                      id="specialty"
                      placeholder="Например: Программирование, Дизайн, Маркетинг"
                      value={formData.specialty}
                      onChange={(e) => handleChange('specialty', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание стажировки *</Label>
                  <Textarea
                    id="description"
                    placeholder="Опишите задачи, которые будут выполнять стажеры, требования к кандидатам, что они получат от стажировки..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="studentCount">Количество мест</Label>
                    <Input
                      id="studentCount"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.studentCount}
                      onChange={(e) => handleChange('studentCount', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Дата начала</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Дата окончания</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Местоположение</Label>
                  <Input
                    id="location"
                    placeholder="Например: Москва, Санкт-Петербург, Удаленно"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Отправка...' : 'Подать заявку'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push('/university/postings')}>
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


