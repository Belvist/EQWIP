'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Briefcase, Save, X, DollarSign, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'

interface JobPayload {
  title: string
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: string
  experienceLevel?: string
  employmentType?: string
  workFormat?: string
  location?: string
  isRemote?: boolean
  expiresAt?: string | null
}

export default function EditJobPage() {
  const params = useParams() as { id?: string }
  const jobId = params?.id
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<JobPayload>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    salaryMin: null,
    salaryMax: null,
    currency: 'RUB',
    experienceLevel: '',
    employmentType: '',
    workFormat: '',
    location: '',
    isRemote: false,
    expiresAt: null,
  })
  const [originalForm, setOriginalForm] = useState<JobPayload | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (!jobId) return
    fetchJob()
  }, [jobId, status])

  const fetchJob = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setForm({
        title: data.title || '',
        description: data.description || '',
        requirements: data.requirements || '',
        responsibilities: data.responsibilities || '',
        benefits: data.benefits || '',
        salaryMin: typeof data.salaryMin === 'number' ? data.salaryMin : null,
        salaryMax: typeof data.salaryMax === 'number' ? data.salaryMax : null,
        currency: data.currency || 'RUB',
        experienceLevel: data.experienceLevel || '',
        employmentType: data.employmentType || '',
        workFormat: data.workFormat || '',
        location: data.location || '',
        isRemote: !!data.isRemote,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0,10) : null,
      })
      // store original for dirty check
      setOriginalForm({
        title: data.title || '',
        description: data.description || '',
        requirements: data.requirements || '',
        responsibilities: data.responsibilities || '',
        benefits: data.benefits || '',
        salaryMin: typeof data.salaryMin === 'number' ? data.salaryMin : null,
        salaryMax: typeof data.salaryMax === 'number' ? data.salaryMax : null,
        currency: data.currency || 'RUB',
        experienceLevel: data.experienceLevel || '',
        employmentType: data.employmentType || '',
        workFormat: data.workFormat || '',
        location: data.location || '',
        isRemote: !!data.isRemote,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0,10) : null,
      })
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить вакансию', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof JobPayload, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isDirty = () => {
    if (!originalForm) return false
    return JSON.stringify(originalForm) !== JSON.stringify(form)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!jobId) return
    console.log('EditJobPage.handleSubmit', { jobId, form })
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin === null ? null : Number(form.salaryMin),
        salaryMax: form.salaryMax === null ? null : Number(form.salaryMax),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Вакансия обновлена' })
        router.push(`/employer/jobs/${jobId}`)
      } else {
        // try to parse json or text to show details
        let parsed: any = null
        try { parsed = await res.json() } catch (e) { parsed = await res.text().catch(() => null) }
        console.error('PATCH /api/jobs/:id response', res.status, parsed)
        const message = parsed && parsed.error ? parsed.error : (typeof parsed === 'string' ? parsed : 'Не удалось обновить вакансию')
        toast({ title: `Ошибка ${res.status}`, description: message, variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить вакансию', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!jobId) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Неверный идентификатор вакансии</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Редактировать вакансию</h1>
            <p className="text-sm text-slate-600">ID: {jobId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <X className="w-4 h-4 mr-2" /> Отмена
            </Button>
            <Button type="button" onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Название вакансии *</Label>
                <Input id="title" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="experienceLevel">Уровень опыта</Label>
                  <Select value={form.experienceLevel || ''} onValueChange={(v) => handleChange('experienceLevel', v)}>
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
                  <Label htmlFor="employmentType">Тип занятости</Label>
                  <Select value={form.employmentType || ''} onValueChange={(v) => handleChange('employmentType', v)}>
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
                  <Label htmlFor="workFormat">Формат работы</Label>
                  <Select value={form.workFormat || ''} onValueChange={(v) => handleChange('workFormat', v)}>
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

              <div className="flex items-center space-x-2">
                <Checkbox id="isRemote" checked={!!form.isRemote} onCheckedChange={(c) => handleChange('isRemote', !!c)} />
                <Label htmlFor="isRemote">Полностью удаленная работа</Label>
              </div>

              <div>
                <Label htmlFor="location">Локация</Label>
                <Input id="location" value={form.location || ''} onChange={(e) => handleChange('location', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Зарплата
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salaryMin">От</Label>
                <Input id="salaryMin" type="number" value={form.salaryMin ?? ''} onChange={(e) => handleChange('salaryMin', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <Label htmlFor="salaryMax">До</Label>
                <Input id="salaryMax" type="number" value={form.salaryMax ?? ''} onChange={(e) => handleChange('salaryMax', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <Label htmlFor="currency">Валюта</Label>
                <Select value={form.currency || 'RUB'} onValueChange={(v) => handleChange('currency', v)}>
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
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Описание вакансии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" value={form.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={6} />
              </div>

              <div>
                <Label htmlFor="requirements">Требования</Label>
                <Textarea id="requirements" value={form.requirements || ''} onChange={(e) => handleChange('requirements', e.target.value)} rows={4} />
              </div>

              <div>
                <Label htmlFor="responsibilities">Обязанности</Label>
                <Textarea id="responsibilities" value={form.responsibilities || ''} onChange={(e) => handleChange('responsibilities', e.target.value)} rows={3} />
              </div>

              <div>
                <Label htmlFor="benefits">Преимущества</Label>
                <Textarea id="benefits" value={form.benefits || ''} onChange={(e) => handleChange('benefits', e.target.value)} rows={3} />
              </div>

              <div>
                <Label htmlFor="expiresAt">Дата окончания (необязательно)</Label>
                <Input id="expiresAt" type="date" value={form.expiresAt || ''} onChange={(e) => handleChange('expiresAt', e.target.value || null)} />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}


