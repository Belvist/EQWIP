import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await db.candidateProfile.findUnique({
      where: { userId: (session.user as any).id },
      select: { preferences: true }
    })

    const notifications = (profile?.preferences as any)?.notifications || {
      email: false,
      push: false,
      sms: false,
      jobMatches: true,
      applicationUpdates: true,
      messages: true,
    }
    return NextResponse.json({ notifications })
  } catch (e) {
    console.error('GET notifications prefs error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const nextNotifications = body?.notifications || {}

    const existing = await db.candidateProfile.findUnique({
      where: { userId: (session.user as any).id },
      select: { preferences: true }
    })

    const prevPrefs = (existing?.preferences as any) || {}
    const merged = {
      ...prevPrefs,
      notifications: {
        email: !!(nextNotifications.email ?? (prevPrefs.notifications?.email ?? false)),
        push: !!(nextNotifications.push ?? (prevPrefs.notifications?.push ?? false)),
        sms: !!(nextNotifications.sms ?? (prevPrefs.notifications?.sms ?? false)),
        jobMatches: !!(nextNotifications.jobMatches ?? (prevPrefs.notifications?.jobMatches ?? true)),
        applicationUpdates: !!(nextNotifications.applicationUpdates ?? (prevPrefs.notifications?.applicationUpdates ?? true)),
        messages: !!(nextNotifications.messages ?? (prevPrefs.notifications?.messages ?? true)),
      }
    }

    await db.candidateProfile.update({
      where: { userId: (session.user as any).id },
      data: { preferences: merged as any }
    })

    return NextResponse.json({ ok: true, notifications: merged.notifications })
  } catch (e) {
    console.error('POST notifications prefs error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


