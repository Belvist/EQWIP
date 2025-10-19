import { db } from '@/lib/db'
import { cache, cacheKeys, cachedFetch } from './cache'
import { ExperienceLevel, EmploymentType, WorkFormat, Currency } from '@prisma/client'

// Типы для рекомендаций
export interface RecommendationScore {
  jobId: string
  score: number
  reasons: string[]
  matchPercentage: number
}

export interface UserPreferences {
  experienceLevel: ExperienceLevel[]
  employmentTypes: EmploymentType[]
  workFormats: WorkFormat[]
  locations: string[]
  salaryRange: {
    min: number
    max: number
    currency: Currency
  }
  skills: string[]
  industries: string[]
  companies: string[]
}

export interface JobRecommendation {
  job: any
  score: number
  matchPercentage: number
  reasons: string[]
  similarJobs: any[]
}

// Сервис ML-рекомендаций
export class MLRecommendationService {

  // Получение рекомендаций для пользователя
  static async getRecommendationsForUser(
    userId: string, 
    limit: number = 10,
    useAI: boolean = true
  ): Promise<JobRecommendation[]> {
    const cacheKey = { userId, limit, useAI }
    
    return await cachedFetch(
      'user-recommendations',
      cacheKey,
      async () => {
        // Получаем профиль пользователя
        const user = await db.user.findUnique({
          where: { id: userId },
          include: {
            candidateProfile: {
              include: {
                skills: {
                  include: {
                    skill: true
                  }
                },
                workExperience: true,
                applications: {
                  include: {
                    job: true
                  }
                },
                resumes: true
              }
            },
            savedJobs: {
              include: {
                job: true
              }
            },
            searchHistory: {
              orderBy: { createdAt: 'desc' },
              take: 20
            }
          }
        })

        if (!user?.candidateProfile) {
          return []
        }

        // Анализируем предпочтения пользователя
        const preferences = await this.analyzeUserPreferences(user)
        
        // Получаем кандидатов вакансий
        const candidateJobs = await this.getCandidateJobs(preferences, userId)
        
        // Рассчитываем рейтинги
        const scoredJobs = await this.calculateJobScores(candidateJobs, preferences, user)
        
        // Используем AI для улучшения рекомендаций
        if (useAI && scoredJobs.length > 0) {
          
        }
        
        // Сортируем и ограничиваем результат
        const recommendations = scoredJobs
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
        
        // Добавляем похожие вакансии
        for (let i = 0; i < recommendations.length; i++) {
          const rec = recommendations[i] as any
          rec.similarJobs = await this.getSimilarJobs(rec.jobId, 3)
        }
        
        return recommendations
      },
      { ttl: 1800 } // 30 минут
    )
  }

  // Анализ предпочтений пользователя
  private static async analyzeUserPreferences(user: any): Promise<UserPreferences> {
    const profile = user.candidateProfile

    // 1) Если есть резюме по умолчанию — предпочтительно используем его
    const defaultResume: any | undefined = Array.isArray(profile?.resumes)
      ? profile.resumes.find((r: any) => r?.isDefault)
      : undefined
    const resumeData: any = defaultResume?.data || null

    // Вытаскиваем навыки из резюме (структура: skills: [{ items: [...] }, ...])
    const extractSkillsFromResume = (data: any): string[] => {
      try {
        const out: string[] = []
        const skillsBlocks = Array.isArray(data?.skills) ? data.skills : []
        for (const block of skillsBlocks) {
          const items = Array.isArray(block?.items) ? block.items : []
          for (const it of items) {
            if (typeof it === 'string' && it.trim()) out.push(it.trim())
          }
        }
        return Array.from(new Set(out))
      } catch {
        return []
      }
    }

    // Примерная оценка лет опыта по резюме (берём от первой даты до последней)
    const computeExperienceYearsFromResume = (data: any): number | null => {
      try {
        const exp = Array.isArray(data?.experience) ? data.experience : []
        const dates: number[] = []
        for (const e of exp) {
          if (e?.startDate) {
            const t = Date.parse(String(e.startDate))
            if (!Number.isNaN(t)) dates.push(t)
          }
          const endStr = e?.endDate || e?.end || null
          const endT = endStr ? Date.parse(String(endStr)) : Date.now()
          if (!Number.isNaN(endT)) dates.push(endT)
        }
        if (dates.length < 2) return null
        const min = Math.min(...dates)
        const max = Math.max(...dates)
        const years = (max - min) / (1000 * 60 * 60 * 24 * 365)
        return Math.max(0, Math.round(years))
      } catch {
        return null
      }
    }
    
    // Базовые предпочтения: ПРИОРИТЕТ — РЕЗЮМЕ ПО УМОЛЧАНИЮ
    const resumeSkills = resumeData ? extractSkillsFromResume(resumeData) : []
    const resumeLocation = resumeData?.personal?.location || null
    const resumeYears = resumeData ? computeExperienceYearsFromResume(resumeData) : null

    const preferences: UserPreferences = {
      experienceLevel: [
        resumeYears != null
          ? this.mapExperienceToLevel(resumeYears)
          : (profile.experience ? this.mapExperienceToLevel(profile.experience) : 'MIDDLE')
      ],
      employmentTypes: [],
      workFormats: [],
      locations: (resumeLocation ? [resumeLocation] : (profile.location ? [profile.location] : [])),
      salaryRange: {
        min: profile.salaryMin || 0,
        max: profile.salaryMax || 1000000,
        currency: profile.currency
      },
      skills: (resumeSkills.length ? resumeSkills : profile.skills.map((s: any) => s.skill.name)),
      industries: [],
      companies: []
    }

    // Анализ истории поиска
    const searchTerms = user.searchHistory.map((sh: any) => {
      try {
        return JSON.parse(sh.filters)
      } catch {
        return {}
      }
    })

    searchTerms.forEach((filters: any) => {
      if (filters.employmentType && !preferences.employmentTypes.includes(filters.employmentType)) {
        preferences.employmentTypes.push(filters.employmentType)
      }
      if (filters.workFormat && !preferences.workFormats.includes(filters.workFormat)) {
        preferences.workFormats.push(filters.workFormat)
      }
      if (filters.location && !preferences.locations.includes(filters.location)) {
        preferences.locations.push(filters.location)
      }
    })

    // Анализ сохраненных вакансий
    user.savedJobs.forEach((savedJob: any) => {
      const job = savedJob.job
      if (!preferences.companies.includes(job.employer.companyName)) {
        preferences.companies.push(job.employer.companyName)
      }
      if (job.employmentType && !preferences.employmentTypes.includes(job.employmentType)) {
        preferences.employmentTypes.push(job.employmentType)
      }
      if (job.workFormat && !preferences.workFormats.includes(job.workFormat)) {
        preferences.workFormats.push(job.workFormat)
      }
    })

    // Анализ откликов
    const successfulApplications = user.candidateProfile.applications.filter((app: any) => 
      app.status === 'SHORTLISTED' || app.status === 'HIRED'
    )

    successfulApplications.forEach((app: any) => {
      const job = app.job
      if (!preferences.companies.includes(job.employer.companyName)) {
        preferences.companies.push(job.employer.companyName)
      }
      if (job.employmentType && !preferences.employmentTypes.includes(job.employmentType)) {
        preferences.employmentTypes.push(job.employmentType)
      }
    })

    return preferences
  }

  // Маппинг опыта в уровень
  private static mapExperienceToLevel(experience: number): ExperienceLevel {
    if (experience < 1) return 'INTERN'
    if (experience < 3) return 'JUNIOR'
    if (experience < 5) return 'MIDDLE'
    if (experience < 8) return 'SENIOR'
    return 'LEAD'
  }

  // Получение кандидатов вакансий
  private static async getCandidateJobs(preferences: UserPreferences, userId: string) {
    const where: any = {
      isActive: true
    }

    // Фильтры по предпочтениям
    if (preferences.employmentTypes.length > 0) {
      where.employmentType = { in: preferences.employmentTypes }
    }
    
    if (preferences.workFormats.length > 0) {
      where.workFormat = { in: preferences.workFormats }
    }
    
    if (preferences.locations.length > 0) {
      where.location = { in: preferences.locations }
    }
    
    if (preferences.salaryRange.min > 0) {
      where.salaryMin = { gte: preferences.salaryRange.min }
    }
    
    if (preferences.salaryRange.max > 0) {
      where.salaryMax = { lte: preferences.salaryRange.max }
    }

    // Исключаем вакансии, на которые пользователь уже откликался
    const appliedJobs = await db.application.findMany({
      where: {
        candidate: { userId }
      },
      select: { jobId: true }
    })

    if (appliedJobs.length > 0) {
      where.id = { notIn: appliedJobs.map(a => a.jobId) }
    }

    return await db.job.findMany({
      where,
      include: {
        employer: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        _count: {
          select: {
            applications: true,
            savedJobs: true
          }
        }
      },
      orderBy: [
        { isPromoted: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100 // Ограничиваем количество кандидатов
    })
  }

  // Расчет рейтингов вакансий
  private static async calculateJobScores(jobs: any[], preferences: UserPreferences, user: any) {
    const scoredJobs: RecommendationScore[] = []

    for (const job of jobs) {
      let score = 0
      const reasons: string[] = []

      // Совпадение по навыкам (40% веса)
      const skillMatch = this.calculateSkillMatch(job.skills, preferences.skills)
      score += skillMatch * 0.4
      if (skillMatch > 0.5) {
        reasons.push(`Отличное совпадение по навыкам (${Math.round(skillMatch * 100)}%)`)
      }

      // Совпадение по опыту (20% веса)
      const experienceMatch = this.calculateExperienceMatch(job.experienceLevel, preferences.experienceLevel[0])
      score += experienceMatch * 0.2
      if (experienceMatch > 0.8) {
        reasons.push(`Подходит по уровню опыта`)
      }

      // Совпадение по зарплате (15% веса)
      const salaryMatch = this.calculateSalaryMatch(job, preferences.salaryRange)
      score += salaryMatch * 0.15
      if (salaryMatch > 0.8) {
        reasons.push(`Зарплата в вашем диапазоне`)
      }

      // Совпадение по локации (10% веса)
      const locationMatch = this.calculateLocationMatch(job.location, preferences.locations)
      score += locationMatch * 0.1
      if (locationMatch > 0.8) {
        reasons.push(`Удобная локация`)
      }

      // Популярность компании (10% веса)
      const companyPopularity = this.calculateCompanyPopularity(job.employer.companyName, preferences.companies)
      score += companyPopularity * 0.1
      if (companyPopularity > 0.7) {
        reasons.push(`Популярная компания`)
      }

      // Свежесть вакансии (5% веса)
      const freshnessScore = this.calculateFreshnessScore(job.createdAt)
      score += freshnessScore * 0.05
      if (freshnessScore > 0.8) {
        reasons.push(`Свежая вакансия`)
      }

      scoredJobs.push({
        jobId: job.id,
        score,
        reasons,
        matchPercentage: Math.round(score * 100)
      })
    }

    return scoredJobs
  }

  // Расчет совпадения по навыкам
  private static calculateSkillMatch(jobSkills: any[], userSkills: string[]): number {
    if (userSkills.length === 0) return 0

    const jobSkillNames = jobSkills.map(js => js.skill.name)
    const matchingSkills = jobSkillNames.filter(skill => 
      userSkills.some(userSkill => 
        skill.toLowerCase().includes(userSkill.toLowerCase()) || 
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    )

    return matchingSkills.length / Math.max(jobSkillNames.length, userSkills.length)
  }

  // Расчет совпадения по опыту
  private static calculateExperienceMatch(jobLevel: ExperienceLevel, userLevel: ExperienceLevel): number {
    const levels = ['INTERN', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD']
    const jobIndex = levels.indexOf(jobLevel)
    const userIndex = levels.indexOf(userLevel)
    
    if (jobIndex === -1 || userIndex === -1) return 0
    
    const diff = Math.abs(jobIndex - userIndex)
    return Math.max(0, 1 - diff * 0.3)
  }

  // Расчет совпадения по зарплате
  private static calculateSalaryMatch(job: any, userRange: { min: number; max: number }): number {
    if (!job.salaryMin && !job.salaryMax) return 0.5
    
    const jobMin = job.salaryMin || 0
    const jobMax = job.salaryMax || Infinity
    
    if (userRange.min >= jobMin && userRange.max <= jobMax) {
      return 1.0 // Идеальное совпадение
    }
    
    if (userRange.max < jobMin) {
      return Math.max(0, 1 - (jobMin - userRange.max) / jobMin)
    }
    
    if (userRange.min > jobMax) {
      return Math.max(0, 1 - (userRange.min - jobMax) / userRange.min)
    }
    
    return 0.8 // Частичное совпадение
  }

  // Расчет совпадения по локации
  private static calculateLocationMatch(jobLocation: string, userLocations: string[]): number {
    if (!jobLocation || userLocations.length === 0) return 0.5
    
    return userLocations.some(loc => 
      jobLocation.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(jobLocation.toLowerCase())
    ) ? 1.0 : 0.2
  }

  // Расчет популярности компании
  private static calculateCompanyPopularity(companyName: string, preferredCompanies: string[]): number {
    if (preferredCompanies.includes(companyName)) {
      return 1.0
    }
    
    // Здесь можно добавить логику анализа популярности компании
    // на основе количества вакансий, отзывов и т.д.
    return 0.5
  }

  // Расчет свежести вакансии
  private static calculateFreshnessScore(createdAt: Date): number {
    const now = new Date()
    const daysDiff = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff <= 1) return 1.0
    if (daysDiff <= 7) return 0.8
    if (daysDiff <= 30) return 0.6
    return 0.3
  }

  // Улучшение рекомендаций с помощью AI
  private static async enhanceWithAI(scoredJobs: RecommendationScore[], preferences: UserPreferences, user: any) {
    try {
      // Подготавливаем данные для AI
      const topJobs = scoredJobs.slice(0, 10)
      const jobDescriptions = topJobs.map((job, index) => 
        `${index + 1}. ${job.jobId}: ${job.reasons.join(', ')} (score: ${job.score.toFixed(2)})`
      ).join('\n')

      const userProfile = `
      User Skills: ${preferences.skills.join(', ')}
      Experience Level: ${preferences.experienceLevel[0]}
      Preferred Locations: ${preferences.locations.join(', ')}
      Salary Range: ${preferences.salaryRange.min} - ${preferences.salaryRange.max} ${preferences.salaryRange.currency}
      `

      const aiResp = await safeChat({
        messages: [
          {
            role: 'system',
            content: `You are an expert job recommendation AI. Analyze the user profile and job recommendations below. Return STRICT JSON: {"<jobId>": <adjustment in -0.1..0.1>, ...}. No prose.`
          },
          {
            role: 'user',
            content: `User Profile:\n${userProfile}\n\nJob Recommendations:\n${jobDescriptions}`
          }
        ],
        temperature: 0.2,
        max_tokens: 400
      }, { timeoutMs: 2500, retries: 1 })

      const raw = aiResp.choices[0]?.message?.content || ''
      // Robust JSON parse (extract first JSON object if needed)
      let adjustments: Record<string, number> = {}
      try {
        adjustments = JSON.parse(raw)
      } catch {
        const start = raw.indexOf('{')
        const end = raw.lastIndexOf('}')
        if (start >= 0 && end > start) {
          try {
            adjustments = JSON.parse(raw.slice(start, end + 1))
          } catch {}
        }
      }

      // Применяем AI-корректировки, если удалось распарсить
      if (adjustments && typeof adjustments === 'object') {
        scoredJobs.forEach(job => {
          const adjustment = Number(adjustments[job.jobId]) || 0
          if (!Number.isFinite(adjustment)) return
          job.score = Math.max(0, Math.min(1, job.score + adjustment))
          job.matchPercentage = Math.round(job.score * 100)
          if (adjustment > 0.01) {
            job.reasons.push('AI рекомендует эту вакансию')
          }
        })
      }
    } catch (error) {
      console.error('Error enhancing with AI:', error)
    }
  }

  // Получение похожих вакансий
  private static async getSimilarJobs(jobId: string, limit: number = 3) {
    try {
      const job = await db.job.findUnique({
        where: { id: jobId },
        include: {
          skills: {
            include: {
              skill: true
            }
          }
        }
      })
      
      if (!job) return []
      
      // Находим вакансии с похожими навыками
      const similarJobs = await db.job.findMany({
        where: {
          id: { not: jobId },
          isActive: true,
          skills: {
            some: {
              skill: {
                name: {
                  in: job.skills.map(js => js.skill.name)
                }
              }
            }
          },
          OR: [
            { experienceLevel: job.experienceLevel },
            { employmentType: job.employmentType },
            { workFormat: job.workFormat }
          ]
        },
        include: {
          employer: {
            select: {
              companyName: true,
              logo: true
            }
          }
        },
        take: limit
      })
      
      return similarJobs
    } catch (error) {
      console.error('Error getting similar jobs:', error)
      return []
    }
  }

  // Рекомендации для работодателей (поиск кандидатов)
  static async getCandidateRecommendationsForJob(jobId: string, limit: number = 10) {
    const cacheKey = { jobId, limit }
    
    return await cachedFetch(
      'candidate-recommendations',
      cacheKey,
      async () => {
        const job = await db.job.findUnique({
          where: { id: jobId },
          include: {
            skills: {
              include: {
                skill: true
              }
            },
            employer: true
          }
        })
        
        if (!job) return []
        
        // Находим кандидатов с подходящими навыками
        const candidates = await db.candidateProfile.findMany({
          where: {
            OR: [
              {
                skills: {
                  some: {
                    skill: {
                      name: {
                        in: job.skills.map(js => js.skill.name)
                      }
                    }
                  }
                }
              },
              {
                experience: job.experienceLevel
              }
            ]
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                lastSeenAt: true
              }
            },
            skills: {
              include: {
                skill: true
              }
            },
            workExperience: true,
            education: true,
            languages: true
          },
          take: 50
        })
        
        // Рассчитываем рейтинги кандидатов
        const scoredCandidates = candidates.map(candidate => {
          let score = 0
          
          // Совпадение по навыкам
          const candidateSkills = candidate.skills.map(cs => cs.skill.name)
          const jobSkills = job.skills.map(js => js.skill.name)
          const skillMatches = jobSkills.filter(skill => 
            candidateSkills.some(candidateSkill => 
              skill.toLowerCase().includes(candidateSkill.toLowerCase()) ||
              candidateSkill.toLowerCase().includes(skill.toLowerCase())
            )
          )
          score += (skillMatches.length / Math.max(jobSkills.length, candidateSkills.length)) * 0.5
          
          // Совпадение по опыту
          if (candidate.experience === this.mapExperienceToLevel(job.experienceLevel)) {
            score += 0.3
          }
          
          // Совпадение по локации
          if (candidate.location && job.location && 
              candidate.location.toLowerCase().includes(job.location.toLowerCase())) {
            score += 0.2
          }
          
          return {
            candidate,
            score,
            matchPercentage: Math.round(score * 100)
          }
        })
        
        return scoredCandidates
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
      },
      { ttl: 1800 }
    )
  }
}