'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function UniversityCreate() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const submit = async () => {
    try {
      const res = await fetch('/api/university/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, website, contactEmail }) })
      if (res.ok) {
        alert('Университет создан')
        window.location.href = '/internships'
      } else {
        const j = await res.json()
        alert(j?.error || 'Ошибка')
      }
    } catch (e) { console.error(e); alert('Ошибка') }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Создать профиль вуза</h1>
      <div className="grid gap-3 max-w-xl">
        <Input placeholder="Название вуза" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Сайт" value={website} onChange={e => setWebsite(e.target.value)} />
        <Input placeholder="Контактный email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
        <Button onClick={submit}>Создать</Button>
      </div>
    </div>
  )
}


