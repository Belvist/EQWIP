'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Users,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  MessageCircle,
  Download as DownloadIcon,
  CheckCircle
} from 'lucide-react'

interface CandidateDetail {
  id: string
  name: string
  title: string
  avatar?: string
  email?: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  experience: number
  skills: string[]
  bio?: string
  resumeUrl?: string
  matchScore?: number
  availability?: string
}

export default function CandidateDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const search = useSearchParams()
  const tab = search.get('tab') || 'profile'
  const action = search.get('action') || ''
  const { status } = useSession()
  const isLoggedIn = status === 'authenticated'

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const experienceLabel = useMemo(() => {
    const years = candidate?.experience || 0
    if (years < 2) return 'Junior'
    if (years < 5) return 'Middle'
    return 'Senior'
  }, [candidate])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/candidates?id=${id}`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 401) setError('Требуется вход')
          else if (res.status === 403) setError('Доступ запрещен. Требуется профиль работодателя.')
          else setError(`Ошибка загрузки (${res.status})`)
          setCandidate(null)
        } else {
          const data = await res.json()
          const item = (data?.candidates?.[0]) || null
          setCandidate(item)
        }
      } catch (e) {
        setError('Не удалось загрузить данные кандидата')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="space-y-4 text-center">
              <div className="text-xl font-semibold">Требуется вход</div>
              <Button onClick={() => (window.location.href = '/auth/signin')}>Войти</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-400 animate-pulse" />
          <div className="text-lg">Загрузка профиля кандидата...</div>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="space-y-4 text-center">
              <div className="text-xl font-semibold">{error || 'Кандидат не найден'}</div>
              <Button onClick={() => router.push('/candidates')}><ArrowLeft className="w-4 h-4 mr-2" />Назад к списку</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.push('/candidates')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                {candidate.avatar ? (
                  <img src={candidate.avatar.startsWith('/api/') ? candidate.avatar : `/api/profile/avatar?user=${encodeURIComponent(candidate.id)}`} alt={candidate.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-600">{candidate.name?.charAt(0) || 'A'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{candidate.name}</div>
                <div className="text-gray-600 dark:text-gray-400">{candidate.title}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-xs">{experienceLabel}</Badge>
                  {candidate.availability && (
                    <Badge className="text-xs">{candidate.availability}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => (window.location.href = '/chat')}>
                  <MessageCircle className="w-4 h-4 mr-1" /> Написать
                </Button>
                {candidate.resumeUrl && (
                  <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <DownloadIcon className="w-4 h-4 mr-1" /> Скачать резюме
                    </Button>
                  </a>
                )}
                <Button
                  size="sm"
                  onClick={async () => {
                    await fetch(`/api/candidates/${candidate.id}/invite`, { method: 'POST' })
                    router.refresh()
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Пригласить
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 mr-2" /> {candidate.location || 'Не указано'}
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4 mr-2" />{candidate.salaryMin || candidate.salaryMax ? `${candidate.salaryMin ? candidate.salaryMin.toLocaleString() : ''}${candidate.salaryMin && candidate.salaryMax ? ' - ' : ''}${candidate.salaryMax ? candidate.salaryMax.toLocaleString() : ''} ${candidate.currency || ''}` : 'Зарплата не указана'}
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <Briefcase className="w-4 h-4 mr-2" /> {experienceLabel}
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4 mr-2" /> Активность: {candidate.availability || '—'}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                <button
                  className={`px-4 py-2 text-sm ${tab === 'profile' ? 'border-b-2 border-gray-900 dark:border-white font-semibold' : 'text-gray-600 dark:text-gray-400'}`}
                  onClick={() => router.replace(`/candidates/${candidate.id}?tab=profile`)}
                >
                  Профиль
                </button>
                <button
                  className={`px-4 py-2 text-sm ${tab === 'resume' ? 'border-b-2 border-gray-900 dark:border-white font-semibold' : 'text-gray-600 dark:text-gray-400'}`}
                  onClick={() => router.replace(`/candidates/${candidate.id}?tab=resume`)}
                >
                  Резюме
                </button>
              </div>

              {tab === 'profile' && (
                <div className="mt-4 space-y-4">
                  {candidate.bio && (
                    <div className="text-gray-700 dark:text-gray-300">{candidate.bio}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills?.map((s, idx) => (
                      <Badge key={idx} className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'resume' && (
                <div className="mt-4">
                  {candidate.resumeUrl ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Откройте резюме по ссылке ниже:</div>
                      <a className="underline" href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">Открыть резюме</a>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-400">Резюме не прикреплено</div>
                  )}
                </div>
              )}
            </div>

            {/* Invite inline panel */}
            {action === 'invite' && (
              <div className="mt-6 p-4 border rounded-xl bg-gray-50 dark:bg-gray-900/40">
                <div className="font-semibold mb-2">Приглашение кандидата</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Вы можете написать кандидатy в чате или отправить приглашение к вашей вакансии.
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      const res = await fetch(`/api/candidates/${candidate.id}/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: 'Здравствуйте!' })
                      })
                      if (res.ok) router.push('/chat')
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" /> Открыть чат
                  </Button>
                  <Button variant="inverted" onClick={() => (window.location.href = '/employer/jobs/create')}>
                    Создать вакансию
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


