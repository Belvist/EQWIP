import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const sub = await db.subscription.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ plan: sub?.plan || 'FREE', isActive: sub?.isActive ?? false })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const plan = body?.plan as 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | undefined
    const period = (body?.period as 'monthly' | 'yearly') || 'monthly'
    if (!plan) return NextResponse.json({ error: 'Plan is required' }, { status: 400 })

    // Здесь раньше мы сразу активировали план. Теперь — выдаём ошибку и просим использовать /subscriptions/checkout.
    return NextResponse.json({
      error: 'Use /api/subscriptions/checkout for paid plans',
      next: '/api/subscriptions/checkout'
    }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


