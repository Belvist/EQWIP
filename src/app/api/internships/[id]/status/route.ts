import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status } = await request.json().catch(() => ({}))
    if (!status || !['PENDING', 'ACCEPTED', 'REJECTED'].includes(String(status))) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Only ADMIN, MODERATOR, or the employer that owns the application can update
    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    const role = String(me?.role || '')

    const app = await db.internshipApplication.findUnique({
      where: { id: params.id },
      include: {
        employer: { select: { userId: true, companyName: true } },
        posting: { include: { university: { include: { user: true } }, } },
      }
    })
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      const employer = await db.employerProfile.findUnique({ where: { userId: (session.user as any).id } })
      if (!employer || employer.id !== app.employerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await db.internshipApplication.update({ where: { id: app.id }, data: { status } })

    // Notify university representative via in-app + Telegram
    try {
      const uniUser = app.posting.university.user
      if (uniUser?.id) {
        await db.notification.create({
          data: {
            userId: uniUser.id,
            type: 'APPLICATION_STATUS',
            title: 'Статус стажировки',
            message: status === 'ACCEPTED'
              ? `🎓 Студент принят на стажировку в ${app.employer.companyName || 'компанию'}`
              : status === 'REJECTED'
              ? `❌ Заявка на стажировку отклонена`
              : `Заявка на стажировку обновлена`
          }
        })

        const chatId = uniUser.telegramId as string | null | undefined
        const botToken = process.env.BOT_TOKEN
        if (chatId && botToken) {
          const text = status === 'ACCEPTED' 
            ? `🎓 Студент принят на стажировку в <b>${app.employer.companyName || 'компанию'}</b>.`
            : status === 'REJECTED'
            ? `❌ Заявка на стажировку отклонена.`
            : `ℹ️ Заявка на стажировку обновлена.`
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
          })
        }
      }
    } catch (e) {
      console.error('Internship status telegram notify error', e)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/internships/[id]/status error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


