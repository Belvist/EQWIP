import { db } from '@/lib/db'
import { ExperienceLevel } from '@prisma/client'

export interface RecommendationWeights {
  skills: number
  experience: number
  location: number
  salary: number
  industry: number
}

interface UserProfile {
  candidateId: string
  userId: string
  skills: string[]
  experienceLevel: ExperienceLevel | null
  location: string | null
  expectedSalaryMid?: number | null
  preferredIndustry?: string | null
}

export interface JobRecommendation {
  jobId: string
  title: string
  company: string
  score: number
  reasons: string[]
}

class JobRecommendationEngine {
  private defaultWeights: RecommendationWeights = {
    skills: 0.5,
    experience: 0.2,
    location: 0.1,
    salary: 0.1,
    industry: 0.1,
  }

  private midpointSalary(min?: number | null, max?: number | null): number | null {
    if (min == null && max == null) return null
    if (min != null && max != null) return Math.round((min + max) / 2)
    return (min ?? max) ?? null
  }

  private mapYearsToExperienceLevel(years?: number | null): ExperienceLevel | null {
    if (years == null) return null
    if (years < 1) return 'INTERN'
    if (years < 2) return 'JUNIOR'
    if (years < 4) return 'MIDDLE'
    if (years < 7) return 'SENIOR'
    return 'LEAD'
  }

  private levelToIndex(level?: ExperienceLevel | null): number {
    if (!level) return 0
    switch (level) {
      case 'INTERN':
        return 0
      case 'JUNIOR':
        return 1
      case 'MIDDLE':
        return 2
      case 'SENIOR':
        return 3
      case 'LEAD':
        return 4
      default:
        return 0
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await db.candidateProfile.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: true } },
        },
      })
      if (!profile) return null

      const skills = profile.skills.map((cs) => cs.skill.name)
      const expectedMid = this.midpointSalary(profile.salaryMin ?? null, profile.salaryMax ?? null)

      const experienceLevel = this.mapYearsToExperienceLevel(profile.experience ?? null)
      const preferredIndustry = await this.deducePreferredIndustry(profile.id)

      return {
        candidateId: profile.id,
        userId,
        skills,
        experienceLevel: experienceLevel,
        location: profile.location ?? null,
        expectedSalaryMid: expectedMid,
        preferredIndustry,
      }
    } catch (error) {
      console.error('JobRecommendationEngine.getUserProfile', error)
      return null
    }
  }

  private async getExcludedJobIds(userId: string, candidateId: string): Promise<string[]> {
    try {
      const [applications, saved] = await Promise.all([
        db.application.findMany({ where: { candidateId }, select: { jobId: true } }),
        db.savedJob.findMany({ where: { userId }, select: { jobId: true } }),
      ])
      const ids = new Set<string>()
      for (const a of applications) ids.add(a.jobId)
      for (const s of saved) ids.add(s.jobId)
      return Array.from(ids)
    } catch (error) {
      console.error('JobRecommendationEngine.getExcludedJobIds', error)
      return []
    }
  }

  async getAvailableJobs(excludeJobIds: string[] = []): Promise<any[]> {
    try {
      const jobs = await db.job.findMany({
        where: { isActive: true, ...(excludeJobIds.length ? { id: { notIn: excludeJobIds } } : {}) },
        include: {
          employer: true,
          skills: { include: { skill: true } },
        },
        orderBy: [{ isPromoted: 'desc' }, { createdAt: 'desc' }],
        take: 200,
      })
      return jobs
    } catch (error) {
      console.error('JobRecommendationEngine.getAvailableJobs', error)
      return []
    }
  }

  calculateSkillMatch(userSkills: string[], jobSkills: { skill: { name: string } }[]): number {
    if (!userSkills.length || !jobSkills.length) return 0
    const jobSkillNames = jobSkills.map((js) => js.skill.name.toLowerCase())
    const matches = userSkills.filter((s) => jobSkillNames.includes(s.toLowerCase()))
    return matches.length / Math.max(jobSkillNames.length, userSkills.length)
  }

  calculateExperienceMatch(userLevel: ExperienceLevel | null, jobLevel: ExperienceLevel): number {
    const u = this.levelToIndex(userLevel)
    const j = this.levelToIndex(jobLevel)
    const diff = Math.abs(u - j)
    if (diff === 0) return 1
    if (diff === 1) return 0.8
    if (diff === 2) return 0.6
    return 0.4
  }

  calculateLocationMatch(userLocation?: string | null, jobLocation?: string | null): number {
    if (!userLocation || !jobLocation) return 0.5
    return userLocation.toLowerCase() === jobLocation.toLowerCase() ? 1 : 0.4
  }

  calculateSalaryMatch(userExpected?: number | null, jobMin?: number | null, jobMax?: number | null): number {
    const jobMid = this.midpointSalary(jobMin ?? null, jobMax ?? null)
    if (!userExpected || !jobMid) return 0.6
    const diff = Math.abs(userExpected - jobMid)
    const tol = userExpected * 0.2
    if (diff <= tol) return 1
    if (diff <= tol * 2) return 0.8
    return 0.5
  }

  calculateIndustryMatch(userPreferred?: string | null, jobIndustry?: string | null): number {
    if (!userPreferred || !jobIndustry) return 0.6
    return userPreferred === jobIndustry ? 1 : 0.6
  }

  async generateRecommendations(userId: string, weights?: Partial<RecommendationWeights>): Promise<JobRecommendation[]> {
    const finalWeights = { ...this.defaultWeights, ...(weights || {}) }

    const user = await this.getUserProfile(userId)
    if (!user) return []

    const excludeJobIds = await this.getExcludedJobIds(user.userId, user.candidateId)
    const jobs = await this.getAvailableJobs(excludeJobIds)
    if (!jobs.length) return []

    const recs: JobRecommendation[] = []

    for (const job of jobs) {
      const skillMatch = this.calculateSkillMatch(user.skills, job.skills)
      const experienceMatch = this.calculateExperienceMatch(user.experienceLevel, job.experienceLevel)
      const locationMatch = this.calculateLocationMatch(user.location, job.location)
      const salaryMatch = this.calculateSalaryMatch(user.expectedSalaryMid ?? null, job.salaryMin ?? null, job.salaryMax ?? null)
      const industryMatch = this.calculateIndustryMatch(user.preferredIndustry ?? null, job.employer?.industry ?? null)

      const score =
        skillMatch * finalWeights.skills +
        experienceMatch * finalWeights.experience +
        locationMatch * finalWeights.location +
        salaryMatch * finalWeights.salary +
        industryMatch * finalWeights.industry

      const reasons: string[] = []
      if (skillMatch > 0.7) reasons.push('Сильное совпадение по навыкам')
      if (experienceMatch > 0.8) reasons.push('Опыт соответствует уровню')
      if (locationMatch === 1) reasons.push('Локация совпадает')
      if (salaryMatch > 0.8) reasons.push('Зарплата соответствует ожиданиям')
      if (industryMatch === 1) reasons.push('Предпочитаемая отрасль')

      recs.push({
        jobId: job.id,
        title: job.title,
        company: job.employer?.companyName || 'Компания',
        score,
        reasons,
      })
    }

    return recs.sort((a, b) => b.score - a.score).slice(0, 20)
  }

  async getPersonalizedRecommendations(userId: string): Promise<JobRecommendation[]> {
    // Пока как generateRecommendations — историю откликов можно подключить позже
    return this.generateRecommendations(userId)
  }

  private async deducePreferredIndustry(candidateId: string): Promise<string | null> {
    try {
      const applications = await db.application.findMany({
        where: { candidateId },
        select: { job: { select: { employer: { select: { industry: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      const counts = new Map<string, number>()
      for (const a of applications) {
        const industry = a.job?.employer?.industry
        if (industry) counts.set(industry, (counts.get(industry) || 0) + 1)
      }
      let best: string | null = null
      let bestCount = 0
      for (const [k, v] of counts.entries()) {
        if (v > bestCount) { best = k; bestCount = v }
      }
      return best
    } catch (error) {
      console.error('JobRecommendationEngine.deducePreferredIndustry', error)
      return null
    }
  }
}

export default JobRecommendationEngine