import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp, normalizeEmail } from '@/lib/otp'
import { db } from '@/lib/db'
import { addSecurityHeaders } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, code, purpose } = await request.json()
    if (!email || !code) {
      return NextResponse.json({ message: 'Email и код обязательны' }, { status: 400 })
    }

    const { valid } = await verifyOtp({ email, code, purpose: purpose || 'login' })
    if (!valid) {
      return NextResponse.json({ message: 'Неверный или просроченный код' }, { status: 400 })
    }

    const emailNorm = normalizeEmail(email)
    let user = await db.user.findUnique({ where: { email: emailNorm } })
    if (!user) {
      user = await db.user.create({ data: { email: emailNorm, emailVerified: true } })
    } else if (!user.emailVerified) {
      await db.user.update({ where: { id: user.id }, data: { emailVerified: true } })
    }

    const res = NextResponse.json({ ok: true })
    return addSecurityHeaders(res)
  } catch (err) {
    console.error('OTP verify error:', err)
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 })
  }
}


