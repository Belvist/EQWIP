'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

type UnivRow = {
  id: string
  name: string
  internships: number
  students: number
  activityScore: number
}

export default function AdminUniversitiesPage() {
  const [items, setItems] = useState<UnivRow[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ totalUnivs: 0, totalInternships: 0, totalStudents: 0 })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/universities')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setItems(data.items || [])
      setMetrics({ totalUnivs: data.total || 0, totalInternships: data.totalInternships || 0, totalStudents: data.totalStudents || 0 })
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить вузы', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Управление образовательными учреждениями</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => load()}>Обновить</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Всего вузов</div>
              <div className="text-2xl font-bold">{metrics.totalUnivs}</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Всего стажировок</div>
              <div className="text-2xl font-bold">{metrics.totalInternships}</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Всего студентов</div>
              <div className="text-2xl font-bold">{metrics.totalStudents}</div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Кол-во стажировок</TableHead>
                <TableHead>Кол-во студентов</TableHead>
                <TableHead>Активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.internships}</TableCell>
                  <TableCell>{u.students}</TableCell>
                  <TableCell>
                    <Badge variant={u.activityScore > 66 ? 'default' : u.activityScore > 33 ? 'outline' : 'secondary'}>
                      {u.activityScore}%
                    </Badge>
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


