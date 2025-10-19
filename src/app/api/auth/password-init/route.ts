import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setTwoFactorMarker } from '@/lib/twofa'
import { cache } from '@/lib/cache'
import { createOtpAndSend } from '@/lib/otp'

// Step 1 of 2FA: verify email+password, then send OTP and set marker in Redis
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ message: 'Email и пароль обязательны' }, { status: 400 })
    }

    // Basic rate limiting (1 min window): max 10/мин по IP и 5/мин по email
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const ipKey = `rl:pwdinit:ip:${ip}`
    const emailKey = `rl:pwdinit:email:${email.toLowerCase().trim()}`
    try {
      const ipCount = await cache.increment(ipKey, 60)
      const emailCount = await cache.increment(emailKey, 60)
      if (ipCount > 10 || emailCount > 5) {
        return NextResponse.json({ message: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 })
      }
    } catch {}

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user || !user.password) {
      return NextResponse.json({ message: 'Неверный email или пароль' }, { status: 401 })
    }
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ message: 'Неверный email или пароль' }, { status: 401 })
    }

    // Send OTP for login
    const ua = request.headers.get('user-agent') || undefined
    await createOtpAndSend({ email, purpose: 'login', ip, userAgent: ua, ttlMinutes: 10, reuseWindowSeconds: 60 })

    // Set Redis marker: allow OTP verify for this email for 10 minutes (if Redis configured)
    await setTwoFactorMarker(email, 600)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('password-init error:', e)
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 })
  }
}


