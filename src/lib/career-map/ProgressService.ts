import { db } from '@/lib/db'

export type CareerGoal = {
  id: string
  title: string
  targetLevel: 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD'
  requiredSkills?: string[]
  deadline?: string | null
  milestones: Array<{ id: string; title: string; done: boolean; weight?: number; due?: string | null }>
  createdAt: string
  updatedAt: string
}

export type CareerGoalWithProgress = CareerGoal & { progress: number }

function normalizeSkills(list: Array<{ level: number; skill: { name: string } }> = []) {
  const map: Record<string, number> = {}
  for (const item of list) {
    const name = (item?.skill?.name || '').toLowerCase()
    if (!name) continue
    map[name] = Math.max(map[name] || 0, item.level || 0)
  }
  return map
}

function computeSkillMatch(required: string[] | undefined, userSkillLevels: Record<string, number>): number {
  const req = (required || []).map((s) => (s || '').toLowerCase()).filter(Boolean)
  if (req.length === 0) return 1
  let matched = 0
  for (const r of req) {
    if ((userSkillLevels[r] || 0) >= 3) matched += 1
  }
  return matched / req.length
}

function computeMilestonesProgress(milestones: CareerGoal['milestones']): number {
  if (!milestones || milestones.length === 0) return 0
  const totalWeight = milestones.reduce((acc, m) => acc + (typeof m.weight === 'number' ? Math.max(m.weight, 0) : 1), 0)
  if (totalWeight <= 0) return 0
  const earned = milestones.reduce((acc, m) => acc + ((typeof m.weight === 'number' ? Math.max(m.weight, 0) : 1) * (m.done ? 1 : 0)), 0)
  return earned / totalWeight
}

export class ProgressService {
  static async getCandidateProfileByUserId(userId: string) {
    return db.candidateProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        preferences: true,
        skills: { select: { level: true, skill: { select: { name: true } } } },
      },
    })
  }

  static readGoalsFromPreferences(prefs: any): CareerGoal[] {
    const raw = prefs && typeof prefs === 'object' ? prefs.careerGoals : undefined
    if (!Array.isArray(raw)) return []
    return raw
      .map((g: any) => ({
        id: String(g?.id || ''),
        title: String(g?.title || ''),
        targetLevel: (g?.targetLevel || 'JUNIOR').toUpperCase(),
        requiredSkills: Array.isArray(g?.requiredSkills) ? g.requiredSkills.map(String) : [],
        deadline: g?.deadline ? String(g.deadline) : null,
        milestones: Array.isArray(g?.milestones)
          ? g.milestones.map((m: any) => ({ id: String(m?.id || ''), title: String(m?.title || ''), done: !!m?.done, weight: typeof m?.weight === 'number' ? m.weight : undefined, due: m?.due ? String(m.due) : null }))
          : [],
        createdAt: String(g?.createdAt || new Date().toISOString()),
        updatedAt: String(g?.updatedAt || new Date().toISOString()),
      }))
      .filter((g: CareerGoal) => !!g.id && !!g.title)
  }

  static writeGoalsToPreferences(prefs: any, goals: CareerGoal[]) {
    const out = prefs && typeof prefs === 'object' ? { ...prefs } : {}
    out.careerGoals = goals
    return out
  }

  static computeProgressForGoal(goal: CareerGoal, userSkillLevels: Record<string, number>): number {
    const skillMatch = computeSkillMatch(goal.requiredSkills, userSkillLevels) // 0..1
    const milestoneProgress = computeMilestonesProgress(goal.milestones) // 0..1
    const combined = 0.6 * skillMatch + 0.4 * milestoneProgress
    return Math.round(combined * 100)
  }

  static async listGoalsWithProgress(userId: string): Promise<CareerGoalWithProgress[]> {
    const profile = await this.getCandidateProfileByUserId(userId)
    if (!profile) return []
    const goals = this.readGoalsFromPreferences(profile.preferences)
    const userSkills = normalizeSkills(profile.skills as any)
    return goals.map((g) => ({ ...g, progress: this.computeProgressForGoal(g, userSkills) }))
  }

  static async saveGoals(userId: string, goals: CareerGoal[]): Promise<CareerGoalWithProgress[]> {
    const profile = await this.getCandidateProfileByUserId(userId)
    if (!profile) throw new Error('Candidate profile not found')
    const updatedPrefs = this.writeGoalsToPreferences(profile.preferences, goals)
    await db.candidateProfile.update({ where: { id: profile.id }, data: { preferences: updatedPrefs } })
    const userSkills = normalizeSkills(profile.skills as any)
    return goals.map((g) => ({ ...g, progress: this.computeProgressForGoal(g, userSkills) }))
  }
}


