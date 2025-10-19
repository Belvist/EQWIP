
'use client'
import { Unbounded } from 'next/font/google'
const unbounded = Unbounded({ subsets: ['latin', 'cyrillic'], weight: ['800'] })

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Twitter, 
  ArrowUpRight,
  Send,
  ChevronRight,
  Sparkles,
  Briefcase,
  FileText,
  Brain,
  Search,
  DollarSign,
  BarChart3,
  Building,
  HelpCircle,
  Shield
} from 'lucide-react'

const footerLinks = {
  'Для соискателей': [
    { name: 'Найти работу', href: '/jobs', icon: Briefcase },
    { name: 'Создать резюме', href: '/resumes/create', icon: FileText },
    { name: 'AI-рекомендации', href: '/ai-recommendations', icon: Brain },
    { name: 'Карта карьеры', href: '/career-map', icon: MapPin },
  ],
  'Для работодателей': [
    { name: 'Разместить вакансию', href: '/employer/jobs/create', icon: Briefcase },
    { name: 'Найти кандидатов', href: '/employer/candidates', icon: Search },
    { name: 'Тарифы', href: '/employer/pricing', icon: DollarSign },
    { name: 'Аналитика', href: '/employer/analytics', icon: BarChart3 },
  ],
  'О платформе': [
    { name: 'О нас', href: '/about', icon: Building },
    { name: 'AI-возможности', href: '/ai-features', icon: Brain },
  ],
  'Поддержка': [
    { name: 'Помощь', href: '/help', icon: HelpCircle },
    { name: 'Контакты', href: '/contacts', icon: Phone },
    { name: 'Правила', href: '/terms', icon: FileText },
    { name: 'Конфиденциальность', href: '/privacy', icon: Shield },
  ],
}

const socialLinks = [
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
]

const FooterLink = ({ href, children, Icon }: { href: string; children: React.ReactNode; Icon?: any }) => {
  const LucideIcon = Icon
  return (
    <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
      <Link 
        href={href} 
        className="group flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 py-2"
      >
        {Icon && <LucideIcon className="w-4 h-4" />}
        <span className="relative">
          {children}
          <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-gray-400 to-gray-600 group-hover:w-full transition-all duration-300"></span>
        </span>
        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </Link>
    </motion.div>
  )
}

const SocialIcon = ({ Icon, href, label }: { Icon: any; href: string; label: string }) => (
  <motion.a
    key={label}
    href={href}
    className="relative w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 group overflow-hidden"
    whileHover={{ scale: 1.1, rotate: 5 }}
    whileTap={{ scale: 0.9 }}
    aria-label={label}
  >
    {/* Background effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    {/* Icon */}
    <Icon className="w-5 h-5 relative z-10" />
    
    {/* Decorative element */}
    <div className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </motion.a>
)

const NewsletterForm = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setEmail('')
      alert('Спасибо за подписку!')
    }, 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
          <Send className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Будьте в курсе новостей
        </h3>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Подпишитесь на нашу рассылку и получайте лучшие вакансии и советы по карьере
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-3 rounded-2xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Подписка...' : 'Подписаться'}
        </motion.button>
      </form>
    </motion.div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNNTAgNTBjMC01LjUyMyA0LjQ3Ny0xMCAxMC0xMHMxMCA0LjQ3NyAxMCAxMC00LjQ3NyAxMC0xMCAxMGMwIDUuNTIzLTQuNDc3IDEwLTEwIDEwcy0xMC00LjQ3Ny0xMC0xMCA0LjQ3Ny0xMCAxMC0xMHpNMTAgMTBjMC01LjUyMyA0LjQ3Ny0xMCAxMC0xMHMxMCA0LjQ3NyAxMCAxMC00LjQ3NyAxMC0xMCAxMGMwIDUuNTIzLTQuNDc3IDEwLTEwIDEwUzAgMjUuNTIzIDAgMjBzNC40NzctMTAgMTAtMTB6bTEwIDhjNC40MTggMCA4LTMuNTgyIDgtOHMtMy41ODItOC04IDggMy41ODIgOCA4IDggOC0zLjU4MiA4LTggOC04em00MCA0MGM0LjQxOCAwIDgtMy41ODIgOC04cy0zLjU4Mi04LTgtOC04IDMuNTgyLTggOCA4IDMuNTgyIDggOCA4eiIgLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Logo and description */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-8 md:h-9 flex items-center justify-start">
                  <span className={`${unbounded.className} text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none select-none`}>
                    EQWIP
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                Инновационная платформа на основе искусственного интеллекта, которая соединяет талантливых профессионалов с лучшими компаниями
              </p>
            </motion.div>

            {/* Contact info */}
            <motion.div 
              className="space-y-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-4 group">
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                  <div className="absolute -bottom-1 -left-1 w-full h-full bg-gray-200 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">support@eqwip.ru</span>
              </div>
              
              <div className="flex items-center space-x-4 group">
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                  <div className="absolute -bottom-1 -left-1 w-full h-full bg-gray-200 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">+7 (495) 123-45-67</span>
              </div>
              
              <div className="flex items-center space-x-4 group">
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                  <div className="absolute -bottom-1 -left-1 w-full h-full bg-gray-200 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Казань, Россия</span>
              </div>
            </motion.div>

            {/* Social links */}
            <motion.div 
              className="flex space-x-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {socialLinks.map((social) => (
                <SocialIcon key={social.label} Icon={social.icon} href={social.href} label={social.label} />
              ))}
            </motion.div>
          </div>

          {/* Links */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Object.entries(footerLinks).map(([category, links], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  viewport={{ once: true }}
                  className="group"
                >
                  {/* Category title */}
                  <div className="relative mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                      {category}
                    </h4>
                    <div className="absolute -bottom-2 left-0 w-12 h-px bg-gradient-to-r from-gray-300 to-transparent group-hover:w-full transition-all duration-500"></div>
                  </div>
                  
                  {/* Links */}
                  <nav className="space-y-1">
                    {links.map((link) => (
                      <FooterLink 
                        key={link.name} 
                        href={link.href} 
                        Icon={link.icon}
                      >
                        {link.name}
                      </FooterLink>
                    ))}
                  </nav>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3">
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 dark:border-gray-800 mt-16 pt-12"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Copyright */}
            <motion.div 
              className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <span>© 2025 EQWIP.</span>
              <span className="text-gray-400">Все права защищены.</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-500">Powered by AI</span>
            </motion.div>
            
            {/* Additional links */}
            <div className="flex flex-wrap gap-6 text-sm">
              {[
                { href: '/terms', label: 'Условия использования' },
                { href: '/privacy', label: 'Конфиденциальность' },
                { href: '/cookies', label: 'Cookie' },
                { href: '/status', label: 'Статус системы' }
              ].map((link, index) => (
                <motion.div
                  key={link.href}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link 
                    href={link.href} 
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 relative group flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-gray-400 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Decorative element */}
          <div className="mt-8 flex justify-center">
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full"></div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 opacity-50"></div>
    </footer>
  )
}