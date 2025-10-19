'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Edit, Trash2, Users, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Job {
  id: string
  title: string
  description?: string
  isActive: boolean
  applicationsCount: number
  createdAt: string
}

export default function ManageJobPage() {
  const params = useParams() as { id?: string }
  const jobId = params?.id
  const router = useRouter()
  const { toast } = useToast()

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!jobId) return
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (res.ok) {
        const data = await res.json()
        setJob(data)
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось загрузить вакансию', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить вакансию', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async () => {
    if (!job) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !job.isActive }),
      })
      if (res.ok) {
        const updated = await res.json()
        setJob(updated)
        toast({ title: 'Успешно', description: `Вакансия ${updated.isActive ? 'активирована' : 'деактивирована'}` })
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось обновить вакансию', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить вакансию', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!job) return
    if (!confirm('Удалить вакансию? Это действие необратимо.')) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Вакансия удалена' })
        router.push('/employer')
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось удалить вакансию', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить вакансию', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!jobId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div>Неверный идентификатор вакансии</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Управление вакансией</h1>
            <p className="text-sm text-slate-600">ID: {jobId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Назад
            </Button>
            <Button onClick={() => router.push(`/employer/jobs/${jobId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" /> Редактировать
            </Button>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium">{job?.title || (isLoading ? 'Загрузка...' : 'Вакансия не найдена')}</h2>
                {job && (
                  <Badge variant={job.isActive ? 'default' : 'secondary'}>
                    {job.isActive ? 'Активна' : 'Неактивна'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.push(`/employer/applications?jobId=${jobId}`)}>
                  <Users className="w-4 h-4 mr-2" /> Отклики ({job?.applicationsCount ?? 0})
                </Button>
                <Button variant="outline" onClick={handleToggleActive} disabled={isSaving}>
                  {job?.isActive ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />}
                  {job?.isActive ? 'Деактивировать' : 'Активировать'}
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                  <Trash2 className="w-4 h-4 mr-2" /> Удалить
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-slate-700">
              {job?.description || 'Описание не предоставлено.'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


