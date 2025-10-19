import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { planPriceRub } from '@/lib/subscription'

// ЮKassa: требуется указать ключи в переменных окружения
// YKASSA_SHOP_ID, YKASSA_SECRET

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, period = 'monthly', returnUrl = '/employer/pricing' } = await request.json()
    if (!plan || !['BASIC','PREMIUM','ENTERPRISE'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const amount = planPriceRub(plan, period)
    const idempotenceKey = crypto.randomUUID()
    const payload = {
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      capture: true,
      description: `EQWIP ${plan} ${period}`,
      confirmation: { type: 'redirect', return_url: `${process.env.NEXTAUTH_URL || ''}${returnUrl}` },
      metadata: { userId: (session.user as any).id, plan, period },
    }

    const auth = Buffer.from(`${process.env.YKASSA_SHOP_ID}:${process.env.YKASSA_SECRET}`).toString('base64')
    const res = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const error = await res.text()
      return NextResponse.json({ error: 'YooKassa error', details: error }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ paymentId: data.id, confirmationUrl: data.confirmation?.confirmation_url })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


