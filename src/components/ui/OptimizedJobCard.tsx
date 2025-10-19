'use client'

import React, { memo, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar, 
  Heart, 
  Eye, 
  MessageCircle,
  Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Job {
  id: string
  title: string
  description: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  experienceLevel: string
  employmentType: string
  workFormat: string
  location: string
  isRemote: boolean
  isPromoted: boolean
  companyName: string
  companyLogo?: string
  createdAt: string
  skills: string[]
  applicationsCount: number
  savedCount: number
}

interface OptimizedJobCardProps {
  job: Job
  onSave?: (jobId: string) => void
  onUnsave?: (jobId: string) => void
  isSaved?: boolean
  className?: string
}

// Оптимизированный компонент карточки вакансии
const OptimizedJobCard = memo(({ 
  job, 
  onSave, 
  onUnsave, 
  isSaved = false,
  className = ""
}: OptimizedJobCardProps) => {
  const [isHovered, setIsHovered] = React.useState(false)
  const [localSaved, setLocalSaved] = React.useState(isSaved)

  // Мемоизация форматирования зарплаты
  const formattedSalary = useMemo(() => {
    if (!job.salaryMin && !job.salaryMax) return 'Зарплата не указана'
    
    const currencySymbols = {
      'RUB': '₽',
      'USD': '$',
      'EUR': '€'
    }
    
    const symbol = currencySymbols[job.currency as keyof typeof currencySymbols] || job.currency
    
    if (job.salaryMin && job.salaryMax) {
      return `${symbol}${job.salaryMin.toLocaleString()} - ${symbol}${job.salaryMax.toLocaleString()}`
    } else if (job.salaryMin) {
      return `от ${symbol}${job.salaryMin.toLocaleString()}`
    } else if (job.salaryMax) {
      return `до ${symbol}${job.salaryMax.toLocaleString()}`
    }
    
    return 'Зарплата не указана'
  }, [job.salaryMin, job.salaryMax, job.currency])

  // Мемоизация форматирования даты
  const formattedDate = useMemo(() => {
    const date = new Date(job.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Сегодня'
    if (diffDays === 2) return 'Вчера'
    if (diffDays <= 7) return `${diffDays} дней назад`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} недель назад`
    return `${Math.floor(diffDays / 30)} месяцев назад`
  }, [job.createdAt])

  // Мемоизация обработчика сохранения
  const handleSave = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (localSaved) {
      setLocalSaved(false)
      onUnsave?.(job.id)
    } else {
      setLocalSaved(true)
      onSave?.(job.id)
    }
  }, [localSaved, job.id, onSave, onUnsave])

  // Мемоизация отображения навыков (фильтр пустых и читаемые стили в обеих темах)
  const skillsDisplay = useMemo(() => {
    const all = (job.skills || []).map((s) => String(s || '').trim()).filter(Boolean)
    const shown = all.slice(0, 4)
    const rest = Math.max(0, all.length - shown.length)
    return (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {shown.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
          >
            {tag}
          </span>
        ))}
        {!!rest && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
            +{rest}
          </span>
        )}
      </div>
    )
  }, [job.skills])

  return (
    <Link href={`/jobs/${job.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className={`bg-white dark:bg-black rounded-3xl border-2 ${job.isPromoted ? 'border-gray-800 shadow-lg' : 'border-gray-200 dark:border-gray-800'} p-6 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden h-full flex flex-col ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {job.isPromoted && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-gray-800 text-white">
              <Briefcase className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {job.companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.companyLogo.startsWith('/api/') ? job.companyLogo : `/api/profile/company-logo?f=${encodeURIComponent(job.companyLogo)}`} alt={job.companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {job.companyName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 truncate">
                {job.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{job.companyName}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
          >
            <Heart className={`w-5 h-5 ${localSaved ? 'fill-gray-500 text-gray-500' : 'text-gray-400'}`} />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            {job.location}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            {formattedSalary}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            {job.employmentType}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            {formattedDate}
          </div>
        </div>
        
        {skillsDisplay}
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">{job.applicationsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{job.savedCount}</span>
            </div>
            <div className="text-xs text-gray-400">
              {formattedDate}
            </div>
          </div>
          
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-shrink-0"
              >
                <Button 
                  size="sm"
                  variant="neutral"
                  className="rounded-2xl text-sm font-medium px-4 py-2"
                >
                  Откликнуться
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Link>
  )
})

OptimizedJobCard.displayName = 'OptimizedJobCard'

export default OptimizedJobCard