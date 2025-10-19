'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Clock, Users, BookOpen, Star, Filter } from 'lucide-react'

interface Internship {
  id: string
  title: string
  company: string
  location: string
  duration: string
  type: string
  description: string
  requirements: string[]
  benefits: string[]
  isPaid: boolean
  isRemote: boolean
  applicationsCount: number
  createdAt: string
}

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    duration: '',
    isPaid: false,
    isRemote: false
  })

  useEffect(() => {
    // Загружаем стажировки
    loadInternships()
  }, [])

  const loadInternships = async () => {
    try {
      setLoading(true)
      // Здесь будет API запрос
      const mockInternships: Internship[] = [
        {
          id: '1',
          title: 'Frontend Developer Intern',
          company: 'TechCorp',
          location: 'Москва',
          duration: '3 месяца',
          type: 'Очная',
          description: 'Стажировка для начинающих frontend разработчиков',
          requirements: ['HTML', 'CSS', 'JavaScript', 'React'],
          benefits: ['Менторство', 'Опыт работы', 'Возможность трудоустройства'],
          isPaid: true,
          isRemote: false,
          applicationsCount: 15,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          title: 'Data Science Intern',
          company: 'DataTech',
          location: 'Санкт-Петербург',
          duration: '6 месяцев',
          type: 'Удаленная',
          description: 'Стажировка в области анализа данных и машинного обучения',
          requirements: ['Python', 'SQL', 'Pandas', 'Scikit-learn'],
          benefits: ['Работа с реальными данными', 'Сертификат', 'Рекомендации'],
          isPaid: false,
          isRemote: true,
          applicationsCount: 8,
          createdAt: '2024-01-10'
        }
      ]
      setInternships(mockInternships)
    } catch (error) {
      console.error('Ошибка загрузки стажировок:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         internship.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filters.type || internship.type === filters.type
    const matchesLocation = !filters.location || internship.location.includes(filters.location)
    const matchesDuration = !filters.duration || internship.duration.includes(filters.duration)
    const matchesPaid = !filters.isPaid || internship.isPaid
    const matchesRemote = !filters.isRemote || internship.isRemote

    return matchesSearch && matchesType && matchesLocation && matchesDuration && matchesPaid && matchesRemote
  })

  const handleApply = (internshipId: string) => {
    // Логика подачи заявки
    console.log('Подача заявки на стажировку:', internshipId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Загрузка стажировок...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Стажировки
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Найдите подходящую стажировку для развития карьеры
          </p>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Поиск стажировок..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Тип стажировки</option>
                <option value="Очная">Очная</option>
                <option value="Удаленная">Удаленная</option>
                <option value="Гибридная">Гибридная</option>
              </select>
              <select
                value={filters.duration}
                onChange={(e) => setFilters({...filters, duration: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Продолжительность</option>
                <option value="1 месяц">1 месяц</option>
                <option value="3 месяца">3 месяца</option>
                <option value="6 месяцев">6 месяцев</option>
                <option value="1 год">1 год</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setFilters({type: '', location: '', duration: '', isPaid: false, isRemote: false})}
              >
                <Filter className="w-4 h-4 mr-2" />
                Сбросить
              </Button>
            </div>
          </div>
        </div>

        {/* Список стажировок */}
        <div className="grid gap-6">
          {filteredInternships.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Стажировки не найдены
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Попробуйте изменить параметры поиска
              </p>
            </div>
          ) : (
            filteredInternships.map((internship) => (
              <Card key={internship.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{internship.title}</CardTitle>
                      <CardDescription className="text-lg font-medium text-blue-600 dark:text-blue-400">
                        {internship.company}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {internship.isPaid && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Оплачиваемая
                        </Badge>
                      )}
                      {internship.isRemote && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Удаленная
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {internship.location}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      {internship.duration}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      {internship.type}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Star className="w-4 h-4 mr-2" />
                      {internship.applicationsCount} заявок
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {internship.description}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Требования:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {internship.requirements.map((req, index) => (
                        <Badge key={index} variant="outline">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Преимущества:
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                      {internship.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Опубликовано: {new Date(internship.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <Button onClick={() => handleApply(internship.id)}>
                      Подать заявку
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
