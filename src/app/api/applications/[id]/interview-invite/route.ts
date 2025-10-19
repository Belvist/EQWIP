import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    if (role !== 'EMPLOYER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const applicationId = params.id
    if (!applicationId) return NextResponse.json({ error: 'application id required' }, { status: 400 })

    // Ownership check for EMPLOYER
    if (role === 'EMPLOYER') {
      const employer = await db.employerProfile.findUnique({ where: { userId: (session.user as any).id } })
      if (!employer) return NextResponse.json({ error: 'Employer not found' }, { status: 400 })
      const app = await db.application.findUnique({ where: { id: applicationId }, include: { job: true } })
      if (!app || app.job.employerId !== employer.id) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
      }
    }

    const appFull = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { include: { user: true } }
      }
    })
    if (!appFull) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // Create in-app notification
    await db.notification.create({
      data: {
        userId: appFull.candidate.userId,
        type: 'INTERVIEW_INVITE',
        title: 'Приглашение на интервью',
        message: `📩 Приглашение на интервью по вакансии "${appFull.job.title}"`
      }
    })

    // Telegram notification
    try {
      const chatId = appFull.candidate.user.telegramId as string | null | undefined
      const botToken = process.env.BOT_TOKEN
      if (chatId && botToken) {
        const text = `📩 Приглашение на интервью по вакансии <b>${appFull.job.title}</b>.`
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        })
      }
    } catch (e) {
      console.error('Telegram interview invite error', e)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/applications/[id]/interview-invite error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


