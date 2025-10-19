import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function createLinkToken(userId: string, ttlSeconds: number, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds)
  const base = `${userId}.${exp}`
  const crypto = require('crypto') as typeof import('crypto')
  const sig = crypto.createHmac('sha256', secret).update(base).digest('hex')
  return `${userId}.${exp}.${sig}`
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve bot username: use env if present, otherwise query Telegram getMe via BOT_TOKEN
    let botUsername = process.env.BOT_USERNAME
    let secret = process.env.TELEGRAM_LINK_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ''
    const botToken = process.env.BOT_TOKEN || ''

    if (!botUsername) {
      if (!botToken) {
        return NextResponse.json({ error: 'Telegram is not configured' }, { status: 500 })
      }
      try {
        const resp = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
        const data = await resp.json().catch(() => null as any)
        const username = data?.ok ? (data.result?.username as string | undefined) : undefined
        if (username) botUsername = username
      } catch {}
    }

    if (!secret) {
      // derive deterministic fallback from BOT_TOKEN
      const crypto = require('crypto') as typeof import('crypto')
      if (botToken) {
        secret = crypto.createHash('sha256').update(botToken).digest('hex').slice(0, 32)
      }
    }

    if (!botUsername || !secret) {
      return NextResponse.json({ error: 'Telegram is not configured' }, { status: 500 })
    }

    const token = createLinkToken(String((session.user as any).id), 600, secret)
    const deepLink = `https://t.me/${botUsername}?start=link_${encodeURIComponent(token)}`
    return NextResponse.json({ deepLink })
  } catch (e) {
    console.error('GET /api/telegram/link/start error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


