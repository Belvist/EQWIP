import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProgressService, CareerGoal } from '@/lib/career-map/ProgressService'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = params?.id
  const body = await request.json().catch(() => ({}))

  const current = await ProgressService.listGoalsWithProgress(session.user.id)
  const base: CareerGoal[] = current.map(({ progress, ...g }) => g)
  const idx = base.findIndex((g) => g.id === id)
  if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = { ...base[idx], ...(body || {}) }
  base[idx] = updated
  const saved = await ProgressService.saveGoals(session.user.id, base)
  return NextResponse.json({ ok: true, data: saved.find((g) => g.id === id) })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = params?.id
  const current = await ProgressService.listGoalsWithProgress(session.user.id)
  const base: CareerGoal[] = current.map(({ progress, ...g }) => g)
  const next = base.filter((g) => g.id !== id)
  const saved = await ProgressService.saveGoals(session.user.id, next)
  return NextResponse.json({ ok: true, data: saved })
}


