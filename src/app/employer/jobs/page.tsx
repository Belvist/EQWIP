'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Briefcase, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Job {
  id: string
  title: string
  isActive: boolean
  applicationsCount: number
  createdAt: string
}

interface EmployerProfile {
  id: string
  companyName: string
  jobs?: Job[]
}

export default function EmployerJobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<EmployerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile/employer')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      } else {
        setProfile({ id: '', companyName: '', jobs: [] })
      }
    } catch (err) {
      setProfile({ id: '', companyName: '', jobs: [] })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-600" />
      </div>
    )
  }

  if (status === 'authenticated' && (session as any)?.user?.role !== 'EMPLOYER') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Мои вакансии</h1>
            <p className="text-sm text-slate-600">Управляйте своими вакансиями</p>
          </div>
          <div>
            <Button variant="inverted" onClick={() => router.push('/employer/jobs/create')}>
              <Plus className="w-4 h-4 mr-2" /> Создать вакансию
            </Button>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Вакансии
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.jobs && profile.jobs.length > 0 ? (
              <div className="space-y-4">
                {profile.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900">{job.title}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant={job.isActive ? 'default' : 'secondary'}>
                          {job.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                        <span className="text-sm text-slate-600">{job.applicationsCount} откликов</span>
                        <span className="text-sm text-slate-500">{new Date(job.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/employer/jobs/${job.id}/edit`)}>
                      Управлять
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Нет вакансий</h3>
                <p className="text-slate-600 mb-4">Создайте первую вакансию, чтобы начать поиск кандидатов</p>
                <Button variant="inverted" onClick={() => router.push('/employer/jobs/create')}>
                  <Plus className="w-4 h-4 mr-2" /> Создать вакансию
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


