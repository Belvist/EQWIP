'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageCircle,
  Users,
  Building,
  Clock,
  CheckCircle,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Facebook,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Footer from '@/components/Footer'

export default function ContactsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    category: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed')
      setIsSubmitted(true)
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
        category: ''
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Ошибка при отправке сообщения')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      label: 'Email',
      value: 'support@eqwip.ru',
      description: 'Для общих вопросов и поддержки'
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: 'Телефон',
      value: '+7 (495) 123-45-67',
      description: 'Пн-Пт: 9:00 - 18:00 (МСК)'
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: 'Адрес',
      value: 'Казань, Россия',
      description: 'Офис в центре города'
    }
  ]

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Facebook, href: '#', label: 'Facebook' }
  ]

  const departments = [
    {
      name: 'Продажи',
      email: 'support@eqwip.ru',
      description: 'Вопросы по тарифам и партнерству',
      icon: <Users className="w-5 h-5" />
    },
    {
      name: 'Техническая поддержка',
      email: 'support@eqwip.ru',
      description: 'Проблемы с работой платформы',
      icon: <MessageCircle className="w-5 h-5" />
    },
    {
      name: 'HR',
      email: 'support@eqwip.ru',
      description: 'Карьера и вакансии в EQWIP',
      icon: <Building className="w-5 h-5" />
    }
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Сообщение отправлено!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Спасибо за обращение! Мы свяжемся с вами в течение 24 часов.
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => setIsSubmitted(false)}
          >
            Отправить еще сообщение
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Контакты
            </h1>
            <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Свяжитесь с нами любым удобным способом. Мы всегда рады помочь и ответить на ваши вопросы
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
              <CardContent className="p-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Контактная информация
                </h2>
                
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <div className="text-gray-700 dark:text-gray-300">
                          {info.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          {info.label}
                        </h3>
                        <p className="text-gray-900 dark:text-white font-medium mb-1">
                          {info.value}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6">
              <CardContent className="p-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Мы в соцсетях
                </h2>
                
                <div className="grid grid-cols-3 gap-3">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Написать нам
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Имя *
                      </label>
                      <Input
                        type="text"
                        placeholder="Ваше имя"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Компания
                      </label>
                      <Input
                        type="text"
                        placeholder="Название компании"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Тема *
                      </label>
                      <Select onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Выберите тему" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Общие вопросы</SelectItem>
                          <SelectItem value="technical">Техническая поддержка</SelectItem>
                          <SelectItem value="billing">Оплата и тарифы</SelectItem>
                          <SelectItem value="partnership">Партнерство</SelectItem>
                          <SelectItem value="feedback">Обратная связь</SelectItem>
                          <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Тема сообщения *
                    </label>
                    <Input
                      type="text"
                      placeholder="Краткое описание темы"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Сообщение *
                    </label>
                    <Textarea
                      placeholder="Подробное описание вашего вопроса или предложения..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                      rows={6}
                      className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 py-3"
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Departments */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Отделы компании
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Напишите напрямую в нужный отдел для быстрого ответа
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6 h-full">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                        <div className="text-gray-700 dark:text-gray-300">
                          {dept.icon}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dept.name}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {dept.description}
                    </p>
                    <a
                      href={`mailto:${dept.email}`}
                      className="text-gray-900 dark:text-white font-medium hover:underline"
                    >
                      {dept.email}
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Наш офис
              </h2>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden h-96">
              <iframe
                title="Карта — Казань, Россия"
                className="w-full h-full"
                src="https://www.openstreetmap.org/export/embed.html?bbox=49.03%2C55.73%2C49.24%2C55.83&layer=mapnik&marker=55.7963%2C49.1088"
                style={{ border: 0 }}
              />
            </div>
            <div className="mt-2 text-center text-sm text-gray-500">
              <a
                href="https://www.openstreetmap.org/?mlat=55.7963&mlon=49.1088#map=12/55.7963/49.1088"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Открыть карту — Казань, Россия
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  )
}