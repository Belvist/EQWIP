'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

interface JobRow {
  id: string
  title: string
  createdAt: string
  viewsCount: number
  applicationsCount: number
  isActive: boolean
}

export default function AdminCompanyJobsPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const companyId = params.id as string

  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/admin')
      return
    }
    if (status === 'authenticated') {
      // only admins allowed
      if ((session as any)?.user?.role !== 'ADMIN') {
        router.replace('/auth/admin')
        return
      }
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/jobs`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить вакансии', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить вакансию? Это действие необратимо.')) return
    try {
      const r = await fetch(`/api/admin/moderation/jobs/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Failed')
      setJobs(prev => prev.filter(j => j.id !== id))
      toast({ title: 'Удалено', description: 'Вакансия удалена' })
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить вакансию', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Вакансии компании</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/admin/companies')}>Назад</Button>
            <Button onClick={() => load()}>Обновить</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Загрузка…</div>
        ) : jobs.length === 0 ? (
          <div className="text-center p-8 text-gray-500">У этой компании нет вакансий</div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Card key={job.id} className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{job.title}</div>
                    <div className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString('ru-RU')}</div>
                    <div className="text-sm text-gray-500">Просмотры: {job.viewsCount} · Отклики: {job.applicationsCount}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{job.isActive ? 'published' : 'inactive'}</Badge>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${job.id}`)}>Подробнее</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(job.id)}>Удалить</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}


