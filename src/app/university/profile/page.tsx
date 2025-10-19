'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

export default function UniversityProfile() {
  const [profile, setProfile] = useState<any | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const router = useRouter()

  const load = async () => {
    try {
      const res = await fetch('/api/university/me', { cache: 'no-store' })
      if (res.ok) {
        const j = await res.json()
        setProfile(j.data || null)
        setName(j.data?.name || '')
        setWebsite(j.data?.website || '')
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      const res = await fetch('/api/university/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, website }) })
      if (res.ok) { setEditing(false); load() }
      else alert('Ошибка')
    } catch (e) { console.error(e); alert('Ошибка') }
  }

  if (!profile) return <div className="p-8">Загрузка...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Профиль учебного заведения</h1>
      {!editing ? (
        <div className="max-w-xl">
          <p className="mb-2"><strong>Название:</strong> {profile.name}</p>
          <p className="mb-2"><strong>Сайт:</strong> {profile.website || '—'}</p>
          <p className="mb-6"><strong>Контакт:</strong> {profile.contactEmail || '—'}</p>
          <div className="flex gap-2">
            <Button onClick={() => setEditing(true)}>Редактировать</Button>
            <Button variant="outline" onClick={() => router.push('/university')}>Назад</Button>
          </div>
        </div>
      ) : (
        <div className="max-w-xl grid gap-3">
          <Input value={name} onChange={e => setName(e.target.value)} />
          <Input value={website} onChange={e => setWebsite(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={save}>Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Отмена</Button>
          </div>
        </div>
      )}
    </div>
  )
}


