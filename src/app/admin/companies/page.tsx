'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

type CompanyRow = {
  id: string
  companyName: string
  createdAt: string
  activeJobs: number
  responses: number
  hireRate: number
}

export default function AdminCompaniesPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<CompanyRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = async (p = 1) => {
    try {
      const res = await fetch(`/api/admin/companies?q=${encodeURIComponent(q)}&page=${p}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить компании', variant: 'destructive' })
    }
  }

  useEffect(() => { load(1) }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Управление компаниями‑резидентами</h1>
          <div className="flex items-center gap-3">
            <Input placeholder="Поиск компании" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={() => load(page)}>Применить</Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Компания</TableHead>
                <TableHead>Активные вакансии</TableHead>
                <TableHead>Отклики</TableHead>
                <TableHead>Процент найма</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.companyName}</div>
                  </TableCell>
                  <TableCell>{c.activeJobs}</TableCell>
                  <TableCell>{c.responses}</TableCell>
                  <TableCell><Badge>{Math.round(c.hireRate)}%</Badge></TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => router.push(`/admin/companies/${c.id}/jobs`)}>Управлять</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}


