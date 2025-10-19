'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building,
  DollarSign,
  Calendar,
  Edit3,
  Download,
  Share2,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Award,
  BookOpen,
  Code,
  Target,
  TrendingUp,
  CheckCircle,
  Star,
  Plus,
  X,
  Camera,
  Upload,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/contexts/UserContext'

import Footer from '@/components/Footer'

interface UserProfile {
  name: string
  email: string
  phone: string
  location: string
  title: string
  company: string
  salary: string
  experience: string
  bio: string
  skills: string[]
  languages: string[]
  socialLinks: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  avatar: string
  stats: {
    profileViews: number
    applicationsSent: number
    interviews: number
    savedJobs: number
  }
  recentActivity: Array<{
    type: 'application' | 'save' | 'view' | 'interview'
    title: string
    company: string
    timestamp: string
  }>
}

export default function ProfilePage() {
  const { userRole, isLoggedIn } = useUser()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    company: '',
    salary: '',
    experience: '',
    bio: '',
    skills: [],
    languages: [],
    socialLinks: {},
    avatar: '',
    stats: {
      profileViews: 0,
      applicationsSent: 0,
      interviews: 0,
      savedJobs: 0
    },
    recentActivity: []
  })

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/profile/candidate')
        if (response.ok) {
          const profileData = await response.json()
          if (profileData) {
            setProfile({
              name: profileData.user?.name || '',
              email: profileData.user?.email || '',
              phone: profileData.phone || '',
              location: profileData.location || '',
              title: profileData.title || '',
              company: profileData.company || '',
              salary: profileData.salaryMin && profileData.salaryMax 
                ? `${profileData.currency || '$'}${profileData.salaryMin.toLocaleString()} - ${profileData.currency || '$'}${profileData.salaryMax.toLocaleString()}`
                : 'Зарплата не указана',
              experience: profileData.experience ? `${profileData.experience}+ лет` : '',
              bio: profileData.bio || '',
              skills: profileData.skills?.map((skill: any) => skill.skill.name) || [],
              languages: profileData.languages || [],
              socialLinks: {
                github: profileData.github || '',
                linkedin: profileData.linkedin || '',
                twitter: profileData.twitter || '',
                website: profileData.website || ''
              },
              avatar: profileData.user?.avatar || '',
              stats: {
                profileViews: profileData.profileViews || 0,
                applicationsSent: profileData.applicationsSent || 0,
                interviews: profileData.interviews || 0,
                savedJobs: profileData.savedJobs || 0
              },
              recentActivity: profileData.recentActivity || []
            })
          }
        } else if (response.status === 401) {
          // Redirect to login if not authenticated
          window.location.href = '/auth/signin'
          return
        } else {
          console.error('Failed to fetch profile')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        // If there's an error, redirect to login
        window.location.href = '/auth/signin'
        return
      } finally {
        setLoading(false)
      }
    }
    
    if (isLoggedIn && userRole === 'jobseeker') {
      fetchProfile()
    }
  }, [isLoggedIn, userRole])

  // Check if user is authenticated and has the correct role
  if (!isLoggedIn || userRole !== 'jobseeker') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Профиль соискателя
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Войдите как соискатель, чтобы просмотреть и редактировать свой профиль
          </p>
          <Button 
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/auth/signin'}
          >
            Войти как соискатель
          </Button>
        </div>
      </div>
    )
  }

  const handleAvatarUpload = () => {
    // Placeholder for avatar upload functionality
    alert('Загрузка аватара будет добавлена в следующем обновлении')
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile/candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: profile.title,
          bio: profile.bio,
          location: profile.location,
          phone: profile.phone,
          website: profile.socialLinks.website,
          linkedin: profile.socialLinks.linkedin,
          github: profile.socialLinks.github,
          twitter: profile.socialLinks.twitter,
          skills: profile.skills.map(skill => ({ skill: { name: skill } })),
          experience: parseInt(profile.experience) || null,
          salaryMin: profile.salary.includes('$') ? parseInt(profile.salary.split('$')[1].split(' - ')[0]) : null,
          salaryMax: profile.salary.includes('$') ? parseInt(profile.salary.split('$')[2]) : null,
          currency: profile.salary.includes('$') ? 'USD' : 'RUB'
        })
      })

      if (response.ok) {
        setEditing(false)
        alert('Профиль успешно обновлен!')
      } else {
        alert('Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Ошибка при сохранении профиля')
    }
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !profile.skills.includes(skill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const getActivityIcon = (type: UserProfile['recentActivity'][0]['type']) => {
    switch (type) {
      case 'application':
        return <Briefcase className="w-4 h-4" />
      case 'save':
        return <Star className="w-4 h-4" />
      case 'interview':
        return <Calendar className="w-4 h-4" />
      case 'view':
        return <Eye className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: UserProfile['recentActivity'][0]['type']) => {
    switch (type) {
      case 'application':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
      case 'save':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'interview':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
      case 'view':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка профиля...
              </h3>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 mb-8">
            <Button
              variant="outline"
              onClick={() => setEditing(!editing)}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" />
              {editing ? 'Отменить' : 'Редактировать'}
            </Button>
            
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Скачать резюме
            </Button>
            
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center relative">
                      <User className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                      {editing && (
                        <button
                          onClick={handleAvatarUpload}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-gray-600 dark:bg-gray-400 rounded-full flex items-center justify-center text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {editing ? (
                            <Input
                              value={profile.name}
                              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                              className="text-2xl font-bold mb-2"
                            />
                          ) : (
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                              {profile.name}
                            </h2>
                          )}
                          
                          {editing ? (
                            <Input
                              value={profile.title}
                              onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                              className="text-lg text-gray-600 dark:text-gray-400 mb-1"
                            />
                          ) : (
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                              {profile.title}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Building className="w-4 h-4 mr-2" />
                            {editing ? (
                              <Input
                                value={profile.company}
                                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                                className="w-48"
                              />
                            ) : (
                              <span>{profile.company}</span>
                            )}
                          </div>
                        </div>
                        
                        {editing && (
                          <Button onClick={handleSave} className="gap-2">
                            <Save className="w-4 h-4" />
                            Сохранить
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="gap-2">
                          <MapPin className="w-3 h-3" />
                          {profile.location}
                        </Badge>
                        <Badge variant="outline" className="gap-2">
                          <Briefcase className="w-3 h-3" />
                          {profile.experience}
                        </Badge>
                        <Badge variant="outline" className="gap-2">
                          <DollarSign className="w-3 h-3" />
                          {profile.salary}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        {profile.socialLinks.github && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {profile.socialLinks.linkedin && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {profile.socialLinks.twitter && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                              <Twitter className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {profile.socialLinks.website && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bio */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      О себе
                    </h3>
                    {editing ? (
                      <Textarea
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {profile.bio || "Пример: Опытный Full Stack разработчик с 5+ годами опыта в создании веб-приложений. Специализируюсь на React, Node.js и Python. Интересуюсь машинным обучением и анализом данных."}
                      </p>
                    )}
                  </div>
                  
                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Навыки
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="gap-2">
                          {skill}
                          {editing && (
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    
                    {editing && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Добавить навык (например: React, Node.js, Python)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addSkill((e.target as HTMLInputElement).value)
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Добавить навык (например: React, Node.js, Python)"]') as HTMLInputElement
                            if (input) {
                              addSkill(input.value)
                              input.value = ''
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </main>
        <Footer />
      </div>
    )
}