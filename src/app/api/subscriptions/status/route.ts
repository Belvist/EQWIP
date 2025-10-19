import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { paymentId } = await request.json()
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

    const auth = Buffer.from(`${process.env.YKASSA_SHOP_ID}:${process.env.YKASSA_SECRET}`).toString('base64')
    const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    })
    if (!res.ok) {
      const error = await res.text()
      return NextResponse.json({ error: 'YooKassa error', details: error }, { status: 502 })
    }
    const data = await res.json()
    if (data.status === 'succeeded') {
      const plan = data.metadata?.plan as 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
      const userId = data.metadata?.userId as string
      await db.subscription.upsert({
        where: { userId },
        update: { plan, isActive: true },
        create: { userId, plan, isActive: true }
      })
      return NextResponse.json({ ok: true, plan })
    }
    return NextResponse.json({ ok: false, status: data.status })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


