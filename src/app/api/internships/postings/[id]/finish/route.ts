import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    const role = String(me?.role || '')
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const posting = await db.internshipPosting.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    // Notify university
    try {
      const full = await db.internshipPosting.findUnique({
        where: { id: posting.id },
        include: { university: { include: { user: true } } }
      })
      const uniUser = full?.university?.user
      if (uniUser?.id) {
        await db.notification.create({
          data: {
            userId: uniUser.id,
            type: 'SYSTEM',
            title: 'Стажировка завершена',
            message: `🏁 Стажировка по объявлению "${posting.title}" завершена.`
          }
        })
        const chatId = uniUser.telegramId as string | null | undefined
        const botToken = process.env.BOT_TOKEN
        if (chatId && botToken) {
          const text = `🏁 Стажировка по объявлению <b>${posting.title}</b> завершена.`
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
          })
        }
      }
    } catch (e) {
      console.error('Internship finish telegram notify error', e)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/internships/postings/[id]/finish error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


