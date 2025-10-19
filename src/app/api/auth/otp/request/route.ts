import { NextRequest, NextResponse } from 'next/server'
import { createOtpAndSend, OtpPurposeStr } from '@/lib/otp'
import { getClientIp, addSecurityHeaders } from '@/lib/auth-utils'
import { cache } from '@/lib/cache'
import { hasTwoFactorMarker } from '@/lib/twofa'

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json()
    if (!email) {
      return NextResponse.json({ message: 'Email обязателен' }, { status: 400 })
    }
    const purposeNorm: OtpPurposeStr = ['login', 'verify', 'reset'].includes(purpose) ? purpose : 'login'

    const ip = getClientIp(request as any)
    // Only allow explicit verification purpose, or login when 2FA marker is present
    if (purposeNorm === 'login') {
      const allowed = await hasTwoFactorMarker(email)
      if (!allowed) return NextResponse.json({ message: 'Требуется проверка пароля перед отправкой кода' }, { status: 403 })
    }
    const emailKey = `otp:req:email:${(email as string).toLowerCase()}`
    const ipKey = `otp:req:ip:${ip}`
    const ipCount = await cache.increment(ipKey, 60) // 1-minute window
    const emailCount = await cache.increment(emailKey, 60)
    if (ipCount > 10 || emailCount > 5) {
      return NextResponse.json({ message: 'Слишком много запросов. Попробуйте позже.' }, { status: 429 })
    }
    const ua = request.headers.get('user-agent') || undefined

    const result = await createOtpAndSend({ email, purpose: purposeNorm, ip, userAgent: ua, ttlMinutes: 10, reuseWindowSeconds: 60 })
    const res = NextResponse.json({ ok: true, sent: result.sent })
    return addSecurityHeaders(res)
  } catch (err) {
    console.error('OTP request error:', err)
    const msg = err instanceof Error ? err.message : 'Ошибка сервера'
    // Try to expose common misconfigures
    if (msg.includes('SMTP') || msg.includes('nodemailer')) {
      return NextResponse.json({ message: 'SMTP недоступен или не настроен' }, { status: 503 })
    }
    if (msg.includes('email_otps')) {
      return NextResponse.json({ message: 'Требуется миграция БД (таблица email_otps)' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 })
  }
}


