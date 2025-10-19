'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface InternshipPosting {
  id: string
  title: string
  specialty: string
  description: string
  studentCount: number
  startDate: string
  endDate: string
  location: string
  isActive: boolean
}

export default function EditInternshipPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [posting, setPosting] = useState<InternshipPosting | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    specialty: '',
    description: '',
    studentCount: '',
    startDate: '',
    endDate: '',
    location: '',
    isActive: true
  })

  useEffect(() => {
    fetchPosting()
  }, [params.id])

  const fetchPosting = async () => {
    try {
      const response = await fetch(`/api/internships/${params.id}`)
      if (!response.ok) {
        throw new Error('Ошибка загрузки стажировки')
      }
      const data = await response.json()
      setPosting(data)
      setFormData({
        title: data.title || '',
        specialty: data.specialty || '',
        description: data.description || '',
        studentCount: data.studentCount?.toString() || '',
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        location: data.location || '',
        isActive: data.isActive ?? true
      })
    } catch (error) {
      console.error('Error fetching posting:', error)
      toast.error('Ошибка загрузки стажировки')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.specialty || !formData.description) {
      toast.error('Заполните все обязательные поля')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/internships/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          specialty: formData.specialty,
          description: formData.description,
          studentCount: parseInt(formData.studentCount) || 1,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          location: formData.location,
          isActive: formData.isActive
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка обновления стажировки')
      }

      toast.success('Стажировка обновлена!')
      router.push('/university/postings')
    } catch (error) {
      console.error('Error updating posting:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка обновления стажировки')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!posting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Стажировка не найдена</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Редактировать стажировку
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Обновите информацию о стажировке
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Информация о стажировке</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Название стажировки *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Введите название стажировки"
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialty">Специальность *</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Например: Программирование, Маркетинг"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Описание *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Опишите, что будут изучать студенты, какие задачи выполнять..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentCount">Количество студентов</Label>
                  <Input
                    id="studentCount"
                    type="number"
                    min="1"
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Местоположение</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Город, адрес"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Дата начала</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Дата окончания</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="isActive">Статус</Label>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активная</SelectItem>
                    <SelectItem value="inactive">Неактивная</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
