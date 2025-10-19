import { NextRequest, NextResponse } from 'next/server'
import { MLRecommendationService } from '@/lib/ml-recommendations'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { jobId, limit } = await request.json()

    if (jobId) {
      try {
        const recs = await MLRecommendationService.getCandidateRecommendationsForJob(String(jobId), Math.max(1, Math.min(20, Number(limit) || 10)))
        return NextResponse.json({ success: true, recommendations: recs })
      } catch (e) {
        const fallback = await getDbCandidateFallback(String(jobId), Math.max(1, Math.min(20, Number(limit) || 10)))
        return NextResponse.json({ success: true, recommendations: fallback })
      }
    }

    // Без jobId — быстрый fallback
    const latestCandidates = await db.candidateProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        skills: { include: { skill: true } },
        workExperience: true,
        education: true,
        languages: true
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(20, Number(limit) || 10))
    })
    const mapped = latestCandidates.map((c: any) => ({ candidate: c, score: 0, matchPercentage: 0 }))
    return NextResponse.json({ success: true, recommendations: mapped })
    
  } catch (error) {
    console.error('Error getting recommendations:', error)
    
    // На общей ошибке также пробуем вернуть последних кандидатов
    const latestCandidates = await db.candidateProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        skills: { include: { skill: true } },
        workExperience: true,
        education: true,
        languages: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    const mapped = latestCandidates.map((c: any) => ({ candidate: c, score: 0, matchPercentage: 0 }))
    return NextResponse.json({ success: true, recommendations: mapped })
  }
}

async function getDbCandidateFallback(jobId: string, limit: number) {
  try {
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { skills: { include: { skill: true } }, employer: true }
    })
    if (!job) return []
    const jobSkillNames = job.skills.map((js: any) => String(js.skill?.name || '').toLowerCase()).filter(Boolean)
    const candidates = await db.candidateProfile.findMany({
      where: {
        OR: [
          jobSkillNames.length ? {
            skills: {
              some: { skill: { name: { in: job.skills.map((js: any) => js.skill.name) } } }
            }
          } : {},
          { experience: { not: null } }
        ].filter(Boolean) as any
      },
      include: {
        user: { select: { name: true, email: true } },
        skills: { include: { skill: true } },
        workExperience: true,
        education: true,
        languages: true
      },
      take: Math.max(1, Math.min(50, Number(limit) || 10))
    })
    const order: any = ['INTERN','JUNIOR','MIDDLE','SENIOR','LEAD']
    const toLevel = (years?: number | null) => {
      const y = Number(years || 0)
      if (y < 1) return 'INTERN'
      if (y < 3) return 'JUNIOR'
      if (y < 5) return 'MIDDLE'
      if (y < 8) return 'SENIOR'
      return 'LEAD'
    }
    const recs = candidates.map((c: any) => {
      const candSkills = (c.skills || []).map((cs: any) => String(cs?.skill?.name || '').toLowerCase()).filter(Boolean)
      const matches = jobSkillNames.filter((s) => candSkills.some((h) => h.includes(s) || s.includes(h)))
      const skillScore = jobSkillNames.length || candSkills.length ? (matches.length / Math.max(jobSkillNames.length, candSkills.length || 1)) : 0
      const locScore = (c.location && job.location)
        ? (String(job.location).toLowerCase().includes(String(c.location).toLowerCase()) || String(c.location).toLowerCase().includes(String(job.location).toLowerCase()) ? 1 : 0.3)
        : 0.5
      const candLevel = toLevel(c.experience ?? null)
      const diff = Math.abs(order.indexOf(candLevel) - order.indexOf(String(job.experienceLevel)))
      const expScore = diff === 0 ? 1 : diff === 1 ? 0.8 : diff === 2 ? 0.6 : 0.4
      const score = skillScore * 0.6 + expScore * 0.25 + locScore * 0.15
      return { candidate: c, score, matchPercentage: Math.round(score * 100) }
    })
    return recs.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (e) {
    console.error('DB candidate fallback error:', e)
    return []
  }
}