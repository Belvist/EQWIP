'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [direction, setDirection] = useState('ALL')
  const [entity, setEntity] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>({ avgSalary: 0, responses: 0, hireRate: 0, employedStudents: 0 })
  const [trendData, setTrendData] = useState<any[]>([])
  const [salaryData, setSalaryData] = useState<any[]>([])
  const [effData, setEffData] = useState<any[]>([])
  const [univReport, setUnivReport] = useState<any[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}&direction=${direction}&entity=${entity}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMetrics(data.metrics)
      setTrendData(data.trend)
      setSalaryData(data.salary)
      setEffData(data.eff)
      setUnivReport(data.univReport)
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить аналитику', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period, direction, entity])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Аналитика и отчёты</h1>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Месяц</SelectItem>
                <SelectItem value="90d">Квартал</SelectItem>
                <SelectItem value="365d">Год</SelectItem>
              </SelectContent>
            </Select>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все направления</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="ENG">Инжиниринг</SelectItem>
                <SelectItem value="BIO">Биотех</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все компании/вузы</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => load()}>Обновить</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white"><CardContent className="p-6 text-center"><div className="text-sm text-gray-500">Средняя зарплата</div><div className="text-2xl font-bold">{metrics.avgSalary} ₽</div></CardContent></Card>
          <Card className="bg-white"><CardContent className="p-6 text-center"><div className="text-sm text-gray-500">Кол-во откликов</div><div className="text-2xl font-bold">{metrics.responses}</div></CardContent></Card>
          <Card className="bg-white"><CardContent className="p-6 text-center"><div className="text-sm text-gray-500">Эффективность найма</div><div className="text-2xl font-bold">{metrics.hireRate}%</div></CardContent></Card>
          <Card className="bg-white"><CardContent className="p-6 text-center"><div className="text-sm text-gray-500">Трудоустроено студентов</div><div className="text-2xl font-bold">{metrics.employedStudents}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white p-4"><ResponsiveContainer width="100%" height={240}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#8884d8" /></LineChart></ResponsiveContainer></Card>
          <Card className="bg-white p-4"><ResponsiveContainer width="100%" height={240}><BarChart data={salaryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="salary" fill="#82ca9d" /></BarChart></ResponsiveContainer></Card>
          <Card className="bg-white p-4"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={effData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>{effData.map((d,i)=>(<Cell key={i} fill={i%2? '#8884d8':'#82ca9d'} />))}</Pie></PieChart></ResponsiveContainer></Card>
        </div>

        <div className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-4">Отчёт по вузам</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название вуза</TableHead>
                <TableHead>Студентов на стажировках</TableHead>
                <TableHead>Трудоустроено</TableHead>
                <TableHead>Узкие места</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {univReport.map((r:any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.onInternships}</TableCell>
                  <TableCell>{r.employed}</TableCell>
                  <TableCell>{r.issues}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}


