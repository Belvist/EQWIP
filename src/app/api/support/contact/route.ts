import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, renderEqwipBaseLayout } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, subject, message, category } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: 'Заполните обязательные поля' }, { status: 400 })
    }

    const safe = (v: unknown) => String(v || '').toString().slice(0, 10000)
    const content = `
      <h2 style="margin:0 0 12px 0">Новое сообщение в поддержку</h2>
      <p><strong>Имя:</strong> ${safe(name)}</p>
      <p><strong>Email:</strong> ${safe(email)}</p>
      ${company ? `<p><strong>Компания:</strong> ${safe(company)}</p>` : ''}
      ${category ? `<p><strong>Тема:</strong> ${safe(category)}</p>` : ''}
      <p style="margin:12px 0 6px 0"><strong>Сообщение:</strong></p>
      <div>${safe(message).replace(/\n/g, '<br/>')}</div>
    `

    const html = renderEqwipBaseLayout(content, `Сообщение с формы контактов — ${safe(subject)}`)

    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@eqwip.ru',
      subject: `Support: ${safe(subject)}`,
      html,
      text: `Имя: ${safe(name)}\nEmail: ${safe(email)}\nКомпания: ${safe(company)}\nТема: ${safe(category)}\n\n${safe(message)}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('support contact error', err)
    const msg = err instanceof Error ? err.message : 'Ошибка сервера'
    if (msg.includes('SMTP')) {
      return NextResponse.json({ message: 'SMTP не настроен' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 })
  }
}


