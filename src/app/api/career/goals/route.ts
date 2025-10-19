import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProgressService, CareerGoal } from '@/lib/career-map/ProgressService'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const goals = await ProgressService.listGoalsWithProgress(session.user.id)
  return NextResponse.json({ ok: true, data: goals })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const incoming: CareerGoal[] = Array.isArray(body?.goals) ? body.goals : []
  const saved = await ProgressService.saveGoals(session.user.id, incoming)
  return NextResponse.json({ ok: true, data: saved })
}


