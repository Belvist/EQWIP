import { db } from '@/lib/db'

export type PaidPlan = 'BASIC' | 'PREMIUM' | 'ENTERPRISE'

export async function getUserSubscription(userId: string) {
  const sub = await db.subscription.findUnique({ where: { userId } })
  return sub || { plan: 'FREE', isActive: false }
}

export function hasFeature(plan: 'FREE' | PaidPlan, feature: 'candidates' | 'analytics' | 'unlimitedJobs') {
  // Temporary override: make analytics free for everyone by default.
  // Can be disabled by setting ANALYTICS_FREE=0/false in env.
  const analyticsFreeFlag = (() => {
    const raw = String(process.env.ANALYTICS_FREE ?? '1').toLowerCase()
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
  })()
  switch (feature) {
    case 'candidates':
      return plan !== 'FREE'
    case 'analytics':
      if (analyticsFreeFlag) return true
      return plan === 'PREMIUM' || plan === 'ENTERPRISE'
    case 'unlimitedJobs':
      return plan === 'ENTERPRISE'
    default:
      return false
  }
}

export function planPriceRub(plan: PaidPlan, period: 'monthly' | 'yearly') {
  const monthly: Record<PaidPlan, number> = { BASIC: 9999, PREMIUM: 24999, ENTERPRISE: 49999 }
  const base = monthly[plan]
  return period === 'yearly' ? base * 10 : base
}


