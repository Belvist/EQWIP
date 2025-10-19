import { db } from '@/lib/db'
import { ExperienceLevel } from '@prisma/client'

// Карьерные уровни
type CareerLevelKey = 'intern' | 'junior' | 'middle' | 'senior' | 'lead'

export interface CareerPath {
  level: CareerLevelKey
  title: string
  requiredSkills: string[]
  averageSalary: number
  experienceYears: number
  description: string
}

export interface SkillGap {
  skill: string
  currentLevel: number
  requiredLevel: number
  priority: 'high' | 'medium' | 'low'
  learningResources: string[]
}

export interface CareerRecommendation {
  targetRole: string
  careerPath: CareerPath[]
  skillGaps: SkillGap[]
  estimatedTimeToTarget: number
  marketDemand: number
  salaryProgression: number[]
}

class CareerMapEngine {
  private careerLevels = ['intern', 'junior', 'middle', 'senior', 'lead'] as const

  // Normalize industry names across languages and synonyms
  private normalizeIndustry(industry?: string): string | undefined {
    if (!industry) return undefined
    const s = industry.toLowerCase()
    if (s.includes('тех')) return 'Technology'
    if (s.includes('айти') || s === 'it') return 'Technology'
    if (s.includes('data')) return 'Data'
    if (s.includes('аналит')) return 'Data'
    return industry
  }

  // Lightweight web search fallback (no API keys required)
  private async webSearchExcerpts(query: string): Promise<string[]> {
    try {
      if (process.env.AI_OFFLINE_ONLY === '1') return []
      const url = `https://r.jina.ai/http://www.bing.com/search?q=${encodeURIComponent(query)}`
      const r = await fetch(url as any, { cache: 'no-store' as any })
      const html = await r.text()
      const urlMatches = html.match(/https?:\/\/[^\s"')]+/g) || []
      const valid = urlMatches.filter(u => {
        try {
          const uo = new URL(u)
          const host = uo.hostname
          return host !== 'localhost' && host !== '127.0.0.1' && !host.includes('bing.com') && !host.includes('microsoft.com') && !host.includes('r.jina.ai')
        } catch {
          return false
        }
      }).slice(0, 5)
      const out: string[] = []
      for (const u of valid) {
        try {
          const proxy = `https://r.jina.ai/http://${u.replace(/^https?:\/\//, '')}`
          const r2 = await fetch(proxy as any, { cache: 'no-store' as any })
          if (r2.ok) out.push((await r2.text()).slice(0, 2000))
        } catch {}
      }
      return out
    } catch {
      return []
    }
  }

  private extractTopSkillsFromTexts(texts: string[], maxSkills: number = 10): string[] {
    const skills: string[] = []
    const techWhitelist = new Set<string>([
      'react','api','python','python3','sql','mysql','bash','linux','docker','kubernetes','terraform','git','jira','selenium','excel','tableau','power bi','figma','html','css','typescript','node.js','node','postgres','postgresql','stripe','angular','vue','go','java','spring','c#','.net','aws','gcp','azure','ci/cd','cicd','mongodb','redis','graphql','next.js','nextjs','nuxt','kotlin','swift','android','ios','django','flask','pandas','numpy','spark'
    ])
    const addFrom = (text: string) => {
      const tokens = String(text || '')
        .toLowerCase()
        .replace(/[^a-zа-я0-9+.#\-\s]/g, ' ')
        .split(/[,;\n\t\|\/]+|\s{2,}/)
        .map(t => t.trim())
        .filter(Boolean)
      for (const t of tokens) {
        if (techWhitelist.has(t)) skills.push(t === 'python3' ? 'python' : t)
      }
    }
    for (const t of texts) addFrom(t)
    const counter = new Map<string, number>()
    for (const s of skills) counter.set(s, (counter.get(s) || 0) + 1)
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxSkills)
      .map(([name]) => name)
  }

  private async buildPathsFromWeb(industry?: string): Promise<CareerPath[]> {
    const ruLevel: Record<CareerLevelKey, string> = {
      intern: 'стажер',
      junior: 'junior',
      middle: 'middle',
      senior: 'senior',
      lead: 'тимлид',
    }
    const label = industry || 'IT'
    const paths: CareerPath[] = []
    for (const levelKey of this.careerLevels) {
      const query = `${ruLevel[levelKey]} вакансии ${label} Россия требования навыки`
      const texts = await this.webSearchExcerpts(query)
      const requiredSkills = this.extractTopSkillsFromTexts(texts, 10)
      paths.push({
        level: levelKey,
        title: `${levelKey.charAt(0).toUpperCase() + levelKey.slice(1)} Role`,
        requiredSkills,
        averageSalary: 0,
        experienceYears: this.mapLevelKeyToYears(levelKey),
        description: `Карьерная ступень: ${levelKey} (на основе веб-поиска)`,
      })
    }
    return paths
  }

  private mapExperienceLevelToKey(level: ExperienceLevel): (typeof this.careerLevels)[number] {
    switch (level) {
      case 'INTERN':
        return 'intern'
      case 'JUNIOR':
        return 'junior'
      case 'MIDDLE':
        return 'middle'
      case 'SENIOR':
        return 'senior'
      case 'LEAD':
      default:
        return 'lead'
    }
  }

  private mapLevelKeyToYears(key: (typeof this.careerLevels)[number]): number {
    switch (key) {
      case 'intern':
        return 0
      case 'junior':
        return 1
      case 'middle':
        return 3
      case 'senior':
        return 5
      case 'lead':
        return 8
      default:
        return 0
    }
  }

  private midpointSalary(min?: number | null, max?: number | null): number | null {
    if (min == null && max == null) return null
    if (min != null && max != null) return Math.round((min + max) / 2)
    return (min ?? max) ?? null
  }

  /**
   * Извлекает сигналы из последнего (или дефолтного) резюме пользователя:
   * - список навыков (skills)
   * - целевая роль/должность (targetRole)
   */
  private async getResumeInsights(userId: string): Promise<{ skills: string[]; targetRole?: string } | null> {
    try {
      const profile = await db.candidateProfile.findUnique({ where: { userId }, select: { id: true, resumeUrl: true } })
      if (!profile) return null

      const resume = await db.resume.findFirst({
        where: { candidateId: profile.id },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      })
      if (!resume) return null

      const raw: any = resume.data as any
      const skills: string[] = []

      // Утилиты
      const techWhitelist = new Set<string>([
        'react','api','python','python3','sql','mysql','bash','linux','docker','kubernetes','terraform','git','jira','selenium','excel','tableau','power bi','figma','html','css','typescript','node.js','node','postgres','postgresql','stripe'
      ])
      const softStop = new Set<string>(['добрый','отзывчивый','позитивный','миролюбивый','доброжелательный'])
      const extractFromText = (text: string) => {
        const tokens = String(text || '')
          .toLowerCase()
          .replace(/[^a-zа-я0-9+.#\-\s]/g, ' ')
          .split(/[,;\n\t\|\/]+|\s{2,}/)
          .map(t => t.trim())
          .filter(Boolean)
        for (const t of tokens) {
          if (softStop.has(t)) continue
          if (techWhitelist.has(t)) skills.push(t === 'python3' ? 'python' : t)
        }
      }

      // 1) Структурированные поля
      if (raw) {
        if (Array.isArray(raw.skills)) {
          for (const s of raw.skills) {
            if (s && Array.isArray(s.items)) {
              for (const n of s.items) {
                if (typeof n === 'string' && n.trim()) skills.push(n.trim().toLowerCase())
              }
            } else if (typeof s === 'string' && s.trim()) {
              skills.push(s.trim().toLowerCase())
            }
          }
        }
        if (Array.isArray(raw.personal?.skills)) {
          for (const n of raw.personal.skills) {
            if (typeof n === 'string' && n.trim()) skills.push(n.trim().toLowerCase())
          }
        }
      }

      // 2) Свободный текст из резюме
      const textFields = [raw?.plainText, raw?.text, raw?.content, raw?.summary]
      for (const f of textFields) {
        if (typeof f === 'string' && f.length > 0) extractFromText(f)
      }

      // 3) Текст из файла резюме/ссылки (PDF/HTML) через r.jina.ai, если мало сигналов
      const fetchText = async (url?: string | null): Promise<string> => {
        try {
          if (!url) return ''
          if (url.includes('localhost') || url.includes('127.0.0.1')) return ''
          const proxy = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`
          const r = await fetch(proxy, { cache: 'no-store' as any })
          if (!r.ok) return ''
          return (await r.text()).slice(0, 8000)
        } catch { return '' }
      }
      if (skills.length < 3) {
        const fromFile = await fetchText(resume.fileUrl)
        if (fromFile) extractFromText(fromFile)
      }
      if (skills.length < 3) {
        const fromProfile = await fetchText((profile as any).resumeUrl)
        if (fromProfile) extractFromText(fromProfile)
      }

      // 4) Опыты работы как дополнительный источник
      if (skills.length < 5) {
        try {
          const exps = await db.experience.findMany({ where: { candidateId: profile.id }, orderBy: { startDate: 'desc' } })
          for (const e of exps) {
            extractFromText(e.title)
            if (e.description) extractFromText(e.description)
          }
        } catch {}
      }

      // Возможная целевая роль
      const targetRole: string | undefined =
        (raw?.targetJob?.title && String(raw.targetJob.title)) ||
        (typeof raw?.targetRole === 'string' ? raw.targetRole : undefined)

      const out = Array.from(new Set(skills.map(s => s.trim()).filter(Boolean)))
      return { skills: out, targetRole }
    } catch (error) {
      console.error('CareerMapEngine.getResumeInsights', error)
      return null
    }
  }

  async getUserSkills(userId: string): Promise<{ name: string; level: number }[]> {
    try {
      const profile = await db.candidateProfile.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: true } },
        },
      })
      if (!profile) return []

      // Базовые навыки из профиля кандидата
      const base: { name: string; level: number }[] = profile.skills.map((cs) => ({
        name: cs.skill.name,
        level: cs.level ?? 1,
      }))

      // Дополняем навыками из последнего резюме
      const resume = await this.getResumeInsights(userId)
      if (!resume) return base

      const levelByName = new Map<string, number>()
      for (const s of base) levelByName.set(s.name.toLowerCase(), s.level)

      for (const rs of resume.skills) {
        const key = rs.toLowerCase()
        const has = levelByName.has(key)
        // Навыки из резюме считаем уверенным сигналом (минимум 3),
        // если в профиле ниже — поднимаем до 3, если нет — добавляем с уровнем 3
        if (has) {
          const current = levelByName.get(key) || 1
          const nextLevel = Math.max(current, 3)
          levelByName.set(key, nextLevel)
        } else {
          levelByName.set(key, 3)
        }
      }

      // Сливаем обратно в массив
      const merged: { name: string; level: number }[] = []
      for (const [k, lvl] of levelByName.entries()) {
        // Восстанавливаем оригинальное имя (первую встреченную форму)
        const original = base.find((b) => b.name.toLowerCase() === k)?.name ||
          resume.skills.find((s) => s.toLowerCase() === k) || k
        merged.push({ name: original, level: lvl })
      }
      return merged
    } catch (error) {
      console.error('CareerMapEngine.getUserSkills', error)
      return []
    }
  }

  async getIndustryCareerPaths(industry?: string): Promise<CareerPath[]> {
    try {
      const normalized = this.normalizeIndustry(industry)
      let jobs = await db.job.findMany({
        where: {
          isActive: true,
          ...(normalized
            ? { employer: { industry: { contains: normalized, mode: 'insensitive' as const } } }
            : {}),
        },
        include: {
          employer: true,
          skills: { include: { skill: true } },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Fallbacks: (1) no filter, (2) build from web if DB is empty
      if (jobs.length === 0) {
        jobs = await db.job.findMany({
          where: { isActive: true },
          include: { employer: true, skills: { include: { skill: true } } },
          orderBy: { createdAt: 'asc' },
        })
        if (jobs.length === 0) {
          // Last resort: approximate paths from web
          return await this.buildPathsFromWeb(normalized || industry)
        }
      }

      const paths: CareerPath[] = []

      for (const levelKey of this.careerLevels) {
        const levelJobs = jobs.filter((j) => this.mapExperienceLevelToKey(j.experienceLevel) === levelKey)
        if (levelJobs.length === 0) continue

        const salaries: number[] = []
        const skillCounts = new Map<string, number>()
        const titleCounts = new Map<string, number>()

        for (const job of levelJobs) {
          const mid = this.midpointSalary(job.salaryMin ?? null, job.salaryMax ?? null)
          if (mid != null) salaries.push(mid)
          for (const js of job.skills) {
            const name = js.skill.name
            skillCounts.set(name, (skillCounts.get(name) || 0) + 1)
          }
          // Нормализуем названия ролей для заголовка
          const title = (job.title || '').trim()
          if (title) {
            titleCounts.set(title, (titleCounts.get(title) || 0) + 1)
          }
        }

        const averageSalary = salaries.length ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0
        const requiredSkills = Array.from(skillCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name]) => name)

        // Наиболее частая должность на этой ступени
        const topTitle = (() => {
          const arr = Array.from(titleCounts.entries()).sort((a, b) => b[1] - a[1])
          if (arr.length > 0) return arr[0][0]
          // Фолбэк — осмысленное имя уровня
          const pretty = `${levelKey.charAt(0).toUpperCase() + levelKey.slice(1)}`
          return `${pretty} Role`
        })()

        paths.push({
          level: levelKey,
          title: topTitle,
          requiredSkills,
          averageSalary,
          experienceYears: this.mapLevelKeyToYears(levelKey),
          description: `Карьерная ступень: ${levelKey}`,
        })
      }

      return paths
    } catch (error) {
      console.error('CareerMapEngine.getIndustryCareerPaths', error)
      return []
    }
  }

  async analyzeSkillGaps(
    userSkills: { name: string; level: number }[],
    targetRoleSkills: string[],
  ): Promise<SkillGap[]> {
    try {
      const skillGaps: SkillGap[] = []
      for (const target of targetRoleSkills) {
        const user = userSkills.find((us) => us.name.toLowerCase() === target.toLowerCase())
        const currentLevel = user ? user.level : 0
        const requiredLevel = 3
        if (currentLevel < requiredLevel) {
          const gap = requiredLevel - currentLevel
          const priority: SkillGap['priority'] = gap > 2 ? 'high' : gap > 1 ? 'medium' : 'low'
          skillGaps.push({
            skill: target,
            currentLevel,
            requiredLevel,
            priority,
            learningResources: await this.getLearningResources(target),
          })
        }
      }
      const order = { high: 3, medium: 2, low: 1 }
      return skillGaps.sort((a, b) => order[b.priority] - order[a.priority])
    } catch (error) {
      console.error('CareerMapEngine.analyzeSkillGaps', error)
      return []
    }
  }

  private async getLearningResources(skillName: string): Promise<string[]> {
    // Формируем рекомендации на основе данных из БД:
    // 1) последние активные вакансии, где требуется этот навык
    // 2) часто совместно встречающиеся навыки в этих вакансиях
    try {
      const skill = await db.skill.findUnique({
        where: { name: skillName },
        select: { id: true },
      })
      if (!skill) return []

      const jobs = await db.job.findMany({
        where: {
          isActive: true,
          skills: { some: { skillId: skill.id } },
        },
        include: {
          employer: true,
          skills: { include: { skill: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      const recommendations: string[] = []

      // 1) Конкретные вакансии как практический ориентир
      for (const job of jobs) {
        const company = job.employer?.companyName || 'Компания'
        recommendations.push(`Посмотрите вакансию: ${job.title} — ${company}`)
      }

      // 2) Часто встречающиеся сопутствующие навыки
      const coOccurrence = new Map<string, number>()
      for (const job of jobs) {
        for (const js of job.skills) {
          const name = js.skill.name
          if (name.toLowerCase() === skillName.toLowerCase()) continue
          coOccurrence.set(name, (coOccurrence.get(name) || 0) + 1)
        }
      }
      const related = Array.from(coOccurrence.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name)

      if (related.length) {
        recommendations.push(`Смежные навыки для усиления: ${related.join(', ')}`)
      }

      return recommendations
    } catch (error) {
      console.error('CareerMapEngine.getLearningResources(db)', error)
      return []
    }
  }

  private deriveIndustryFromResumeHints(hints?: { skills: string[]; targetRole?: string } | null): string | undefined {
    if (!hints) return undefined
    const role = (hints.targetRole || '').toLowerCase()
    const bag = new Set(hints.skills.map((s) => s.toLowerCase()))
    const has = (s: string) => role.includes(s) || bag.has(s)

    // Data science / ML
    if (has('ml') || has('machine learning') || has('data') || has('ai') || has('tensorflow') || has('pytorch')) {
      return 'Data Science'
    }
    // Технологии (общая категория из seed)
    if (has('react') || has('frontend') || has('node') || has('typescript') || has('devops') || has('kubernetes') || has('aws')) {
      return 'Технологии'
    }
    return undefined
  }

  async generateCareerRecommendation(userId: string, targetIndustry?: string): Promise<CareerRecommendation | null> {
    try {
      const userSkills = await this.getUserSkills(userId)

      // Если индустрия не задана, пытаемся вывести её из резюме
      const resumeHints = await this.getResumeInsights(userId)
      const derived = this.deriveIndustryFromResumeHints(resumeHints)
      const industry = targetIndustry || derived || undefined
      const careerPaths = await this.getIndustryCareerPaths(industry)
      if (!careerPaths.length) return null

      const currentLevel = userSkills.length > 0 ? this.getCurrentLevel(userSkills) : 'intern'

      // Попытка учесть целевую роль из резюме, если она указана
      let preferred: CareerPath | undefined
      if (resumeHints?.targetRole) {
        const token = String(resumeHints.targetRole).split(/\s+/)[0]?.toLowerCase()
        if (token) {
          preferred = careerPaths.find((p) => p.title.toLowerCase().includes(token))
        }
      }
      const targetRole = preferred || careerPaths.find((p) => p.level === currentLevel) || careerPaths[0]

      const skillGaps = await this.analyzeSkillGaps(userSkills, targetRole.requiredSkills)
      const estimatedTime = this.calculateEstimatedTime(skillGaps, targetRole.level)
      const marketDemand = await this.calculateMarketDemand(targetRole.title, industry)
      const salaryProgression = careerPaths.map((p) => p.averageSalary)

      return {
        targetRole: targetRole.title,
        careerPath: careerPaths,
        skillGaps,
        estimatedTimeToTarget: estimatedTime,
        marketDemand,
        salaryProgression,
      }
    } catch (error) {
      console.error('CareerMapEngine.generateCareerRecommendation', error)
      return null
    }
  }

  private getCurrentLevel(userSkills: { name: string; level: number }[]): (typeof this.careerLevels)[number] {
    const avg = userSkills.reduce((s, i) => s + (i.level || 1), 0) / Math.max(1, userSkills.length)
    if (avg < 1.5) return 'intern'
    if (avg < 2.5) return 'junior'
    if (avg < 3.5) return 'middle'
    if (avg < 4.5) return 'senior'
    return 'lead'
  }

  private calculateEstimatedTime(
    skillGaps: SkillGap[],
    targetLevelKey: (typeof this.careerLevels)[number],
  ): number {
    const high = skillGaps.filter((g) => g.priority === 'high').length
    const medium = skillGaps.filter((g) => g.priority === 'medium').length
    let months = 6 + high * 3 + medium * 2
    const targetIdx = this.careerLevels.indexOf(targetLevelKey)
    if (targetIdx > 0) months += targetIdx * 6
    return months
  }

  private async calculateMarketDemand(roleTitle: string, industry?: string): Promise<number> {
    try {
      const where: any = {
        isActive: true,
        title: { contains: roleTitle.split(' ')[0], mode: 'insensitive' },
      }
      const normalized = this.normalizeIndustry(industry)
      if (normalized) {
        where.employer = { industry: { contains: normalized, mode: 'insensitive' } }
      }
      const jobsCount = await db.job.count({ where })
      return Math.min(100, jobsCount * 10)
    } catch (error) {
      console.error('CareerMapEngine.calculateMarketDemand', error)
      return 50
    }
  }

  async getCareerProgression(userId: string): Promise<CareerPath[]> {
    try {
      const userSkills = await this.getUserSkills(userId)
      const currentLevel = this.getCurrentLevel(userSkills)
      const hints = await this.getResumeInsights(userId)
      const industry = this.deriveIndustryFromResumeHints(hints)
      const paths = await this.getIndustryCareerPaths(industry)
      const idx = Math.max(0, paths.findIndex((p) => p.level === currentLevel))
      return paths.slice(idx)
    } catch (error) {
      console.error('CareerMapEngine.getCareerProgression', error)
      return []
    }
  }

  async getSkillDevelopmentPlan(userId: string): Promise<SkillGap[]> {
    try {
      const userSkills = await this.getUserSkills(userId)
      if (!userSkills.length) return []
      const currentLevel = this.getCurrentLevel(userSkills)
      const nextIdx = Math.min(this.careerLevels.length - 1, this.careerLevels.indexOf(currentLevel) + 1)
      const nextKey = this.careerLevels[nextIdx]
      const hints = await this.getResumeInsights(userId)
      const industry = this.deriveIndustryFromResumeHints(hints)
      const paths = await this.getIndustryCareerPaths(industry)
      const nextPath = paths.find((p) => p.level === nextKey)
      if (!nextPath) return []
      return await this.analyzeSkillGaps(userSkills, nextPath.requiredSkills)
    } catch (error) {
      console.error('CareerMapEngine.getSkillDevelopmentPlan', error)
      return []
    }
  }
}

export default CareerMapEngine