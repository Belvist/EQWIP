import { db } from '@/lib/db'
import { sendEmail, renderOtpEmail } from '@/lib/mailer'
import { cache } from '@/lib/cache'
// @ts-ignore
import bcrypt from 'bcryptjs'

export type OtpPurposeStr = 'login' | 'verify' | 'reset'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function toPrismaPurpose(purpose: OtpPurposeStr): 'LOGIN' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' {
  if (purpose === 'login') return 'LOGIN'
  if (purpose === 'verify') return 'EMAIL_VERIFICATION'
  return 'PASSWORD_RESET'
}

export function generateOtpCode(): string {
  // 6-digit numeric code, leading zeros allowed
  try {
    // Prefer WebCrypto if available
    // @ts-ignore
    const cr: Crypto | undefined = globalThis.crypto as any
    if (cr && typeof cr.getRandomValues === 'function') {
      const arr = new Uint32Array(1)
      cr.getRandomValues(arr)
      const n = arr[0] % 1000000
      return n.toString().padStart(6, '0')
    }
  } catch {}
  const n = Math.floor(Math.random() * 1000000)
  return n.toString().padStart(6, '0')
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

interface CreateOtpParams {
  email: string
  purpose: OtpPurposeStr
  ip?: string | null
  userAgent?: string | null
  ttlMinutes?: number
  reuseWindowSeconds?: number
}

export async function createOtpAndSend(params: CreateOtpParams): Promise<{ ok: true; sent: boolean }> {
  const email = normalizeEmail(params.email)
  const purpose = params.purpose
  const prismaPurpose = toPrismaPurpose(purpose)
  const ttl = params.ttlMinutes ?? 10
  const reuseWindow = params.reuseWindowSeconds ?? 60

  // Throttle: if a valid OTP exists within reuseWindow seconds, reuse it (do not spam email)
  // In case the DB table doesn't exist in production yet, gracefully fall back to Redis-only mode.
  let existing: { createdAt: Date } | null = null
  try {
    existing = await db.emailOtp.findFirst({
      where: {
        email,
        purpose: prismaPurpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (e) {
    // Ignore DB errors here (e.g. relation "email_otps" does not exist); proceed without throttling by DB
    existing = null
  }

  let code: string
  let codeHash: string
  let otpId: string | null = null

  const now = Date.now()
  const canReuse = existing && now - new Date(existing.createdAt).getTime() < reuseWindow * 1000
  if (existing && canReuse) {
    // We cannot retrieve original code; generate a new one but avoid sending too frequently.
    // To honor anti-spam, just return ok to caller and do not send mail twice within window.
    return { ok: true, sent: false }
  }

  code = generateOtpCode()
  codeHash = await hashOtpCode(code)

  try {
    const record = await db.emailOtp.create({
      data: {
        email,
        codeHash,
        purpose: prismaPurpose,
        expiresAt: new Date(Date.now() + ttl * 60 * 1000),
        ip: params.ip || undefined,
        userAgent: params.userAgent || undefined,
      },
      select: { id: true },
    })
    otpId = record.id
  } catch (e) {
    // Fallback to Redis if table is missing or DB unavailable
    try {
      const key = `otp:${prismaPurpose}:${email}`
      await cache.set('otp', { email, purpose: prismaPurpose }, { codeHash, expiresAt: Date.now() + ttl * 60 * 1000 }, { ttl: ttl * 60, key })
    } catch {}
  }

  const emailData = renderOtpEmail(code, purpose, email)
  let sent = true
  try {
    await sendEmail({ to: email, subject: emailData.subject, html: emailData.html, text: emailData.text })
  } catch (e) {
    console.error('sendEmail failed:', e)
    sent = false
  }

  return { ok: true, sent }
}

interface VerifyOtpParams {
  email: string
  purpose: OtpPurposeStr
  code: string
}

export async function verifyOtp(params: VerifyOtpParams): Promise<{ valid: boolean; consumed: boolean }> {
  const email = normalizeEmail(params.email)
  const prismaPurpose = toPrismaPurpose(params.purpose)
  const code = params.code.replace(/\D+/g, '').slice(0, 10)
  try {
    const otp = await db.emailOtp.findFirst({
      where: {
        email,
        purpose: prismaPurpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!otp) return { valid: false, consumed: false }
    if (otp.attempts >= 5) return { valid: false, consumed: false }

    const matches = await bcrypt.compare(code, otp.codeHash)
    if (!matches) {
      await db.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
      return { valid: false, consumed: false }
    }

    await db.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
    return { valid: true, consumed: true }
  } catch (e) {
    // Fallback to Redis-backed OTP
    try {
      const key = `otp:${prismaPurpose}:${email}`
      const entry = await cache.get<{ codeHash: string; expiresAt: number }>('otp', {}, { key })
      if (!entry) return { valid: false, consumed: false }
      if (entry.expiresAt <= Date.now()) {
        await cache.expire(key, 1)
        return { valid: false, consumed: false }
      }
      const matches = await bcrypt.compare(code, entry.codeHash)
      if (!matches) return { valid: false, consumed: false }
      await cache.expire(key, 1)
      return { valid: true, consumed: true }
    } catch {
      return { valid: false, consumed: false }
    }
  }
}


