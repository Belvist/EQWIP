import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, renderEqwipBaseLayout } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 })
    }

    const name = String(body.name || '').trim().slice(0, 200)
    const email = String(body.email || '').trim().slice(0, 200)
    const subject = String(body.subject || '').trim().slice(0, 200)
    const message = String(body.message || '').trim().slice(0, 5000)

    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Заполните имя, email и сообщение' }, { status: 400 })
    }

    const support = 'support@eqwip.ru'
    const safeSubject = `EQWIP — Обращение с сайта${subject ? `: ${subject}` : ''}`

    const htmlInner = `
      <h1 style="margin:0 0 12px 0; font-size:20px;">Новое обращение с сайта</h1>
      <p style="margin:0 0 4px 0;"><strong>Имя:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 12px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${subject ? `<p style=\"margin:0 0 12px 0;\"><strong>Тема:</strong> ${escapeHtml(subject)}</p>` : ''}
      <div style="margin-top:12px; padding:12px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; white-space:pre-wrap;">${escapeHtml(message)}</div>
    `
    const html = renderEqwipBaseLayout(htmlInner, safeSubject)
    const text = `Новое обращение с сайта\nИмя: ${name}\nEmail: ${email}\nТема: ${subject}\n\n${message}`

    await sendEmail({ to: support, subject: safeSubject, html, text })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    const msg = String(err?.message || err)
    if (msg.includes('SMTP')) {
      return NextResponse.json({ message: 'Почтовый сервер не настроен' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Не удалось отправить сообщение' }, { status: 500 })
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}


