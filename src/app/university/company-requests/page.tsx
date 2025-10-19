'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Send, Users, Calendar, MapPin, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Company {
  id: string
  companyName: string
  industry?: string
  location?: string
  size?: string
  website?: string
  description?: string
  user: {
    name?: string
    email: string
  }
}

interface InternshipPosting {
  id: string
  title: string
  specialty: string
  description: string
  studentCount: number
  startDate?: string
  endDate?: string
  location?: string
  isActive: boolean
}

export default function CompanyRequestsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [internships, setInternships] = useState<InternshipPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedInternship, setSelectedInternship] = useState<string>('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [companiesResponse, internshipsResponse] = await Promise.all([
        fetch('/api/university/company-requests'),
        fetch('/api/university/postings')
      ])
      
      if (!companiesResponse.ok || !internshipsResponse.ok) {
        throw new Error('Ошибка загрузки данных')
      }
      
      const [companiesData, internshipsData] = await Promise.all([
        companiesResponse.json(),
        internshipsResponse.json()
      ])
      
      setCompanies(companiesData.companies || [])
      setInternships(internshipsData.postings || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!selectedCompany || !selectedInternship || !message) {
      toast.error('Выберите компанию, стажировку и напишите сообщение')
      return
    }

    const internship = internships.find(i => i.id === selectedInternship)
    if (!internship) {
      toast.error('Стажировка не найдена')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/university/company-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany,
          message,
          internshipTitle: internship.title,
          studentCount: internship.studentCount,
          startDate: internship.startDate,
          endDate: internship.endDate
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка отправки запроса')
      }

      toast.success('Заявка отправлена компании!')
      setMessage('')
      setSelectedCompany('')
      setSelectedInternship('')
    } catch (error) {
      console.error('Error sending request:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка отправки запроса')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Предложить стажеров
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите компанию и стажировку, чтобы предложить своих студентов
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Предложить стажеров</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company">Компания *</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите компанию" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="internship">Стажировка *</Label>
                <Select value={selectedInternship} onValueChange={setSelectedInternship}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите стажировку" />
                  </SelectTrigger>
                  <SelectContent>
                    {internships.filter(i => i.isActive).map((internship) => (
                      <SelectItem key={internship.id} value={internship.id}>
                        {internship.title} - {internship.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedInternship && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Информация о стажировке:</h4>
                  {(() => {
                    const internship = internships.find(i => i.id === selectedInternship)
                    if (!internship) return null
                    return (
                      <div className="space-y-1 text-sm">
                        <p><strong>Специальность:</strong> {internship.specialty}</p>
                        <p><strong>Количество студентов:</strong> {internship.studentCount}</p>
                        {internship.startDate && internship.endDate && (
                          <p><strong>Период:</strong> {new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}</p>
                        )}
                        {internship.location && (
                          <p><strong>Местоположение:</strong> {internship.location}</p>
                        )}
                        <p><strong>Описание:</strong> {internship.description}</p>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div>
                <Label htmlFor="message">Сообщение *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Напишите сообщение компании о том, почему ваши студенты подходят для этой стажировки..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSendRequest} 
                disabled={sending || !selectedCompany || !selectedInternship || !message}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Отправка...' : 'Предложить стажеров'}
              </Button>
            </CardContent>
          </Card>

          {/* Companies List */}
          <Card>
            <CardHeader>
              <CardTitle>Доступные компании</CardTitle>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Нет компаний, готовых принимать запросы от вузов
                </p>
              ) : (
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div key={company.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {company.companyName}
                          </h3>
                          <div className="space-y-1 mt-2">
                            {company.industry && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Отрасль:</strong> {company.industry}
                              </p>
                            )}
                            {company.location && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {company.location}
                              </p>
                            )}
                            {company.size && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Размер:</strong> {company.size}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Контакт:</strong> {company.user.name || company.user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCompany(company.id)}
                        >
                          Выбрать
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
