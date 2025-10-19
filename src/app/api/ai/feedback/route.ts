import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Simple feedback schema without new tables: log to notifications table as system note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    const body = await request.json().catch(() => ({}))
    const { jobId, reason, note } = body || {}
    if (!userId || !jobId || !reason) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    // Persist as notification for quick analytics; in real app use dedicated table
    await db.notification.create({
      data: {
        userId,
        type: 'SYSTEM' as any,
        title: 'AI_FEEDBACK',
        message: JSON.stringify({ jobId, reason, note: note || '' }).slice(0, 1000),
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('AI feedback error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


