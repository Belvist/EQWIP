import nodemailer from 'nodemailer'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)')
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  return cachedTransporter
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  // В режиме разработки просто логируем отправку письма
  console.log('📧 Email would be sent:', {
    to: params.to,
    subject: params.subject,
    // Не логируем содержимое для безопасности
  })
  
  // В продакшене можно раскомментировать реальную отправку:
  // const transporter = getTransporter()
  // const fromName = process.env.MAIL_FROM_NAME || 'EQWIP'
  // const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@eqwip.ru'
  // const from = `${fromName} <${fromEmail}>`
  // await transporter.sendMail({ from, ...params })
}

export function renderEqwipBaseLayout(contentHtml: string, title: string): string {
  // Серая минималистичная палитра
  const brandBg = '#F5F5F5'      // светло‑серый фон письма
  const cardBg = '#FFFFFF'       // белая карточка
  const divider = 'rgba(17,17,17,0.06)'
  const textMain = '#111111'     // основной текст — почти чёрный
  const textMuted = '#6B7280'    // приглушённый серый
  const logoText = 'EQWIP'

  return `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${brandBg};font-family:Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji; color:${textMain};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${brandBg}; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="background:${cardBg};border-radius:16px;overflow:hidden;border:0">
            <tr>
              <td style="padding:24px 28px; border-bottom: 1px solid ${divider}">
                <div style="font-size:18px; font-weight:800; letter-spacing:0.4px; color:${textMain};">${logoText}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px">
                <div style="font-size:16px; line-height:26px; color:${textMain}">${contentHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px; border-top: 1px solid ${divider}; color:${textMuted}; font-size:12px; line-height:18px;">
                Вы получили это письмо, потому что был инициирован запрос на сайте eqwip.ru.
                Если это были не вы, просто проигнорируйте письмо.
              </td>
            </tr>
          </table>
          <div style="color:${textMuted}; font-size:12px; margin-top:16px;">© ${new Date().getFullYear()} EQWIP</div>
        </td>
      </tr>
    </table>
  </body>
  </html>`
}

export function renderOtpEmail(code: string, purpose: 'login' | 'verify' | 'reset', email: string): { subject: string; html: string; text: string } {
  const purposeTitle = purpose === 'login' ? 'Код входа' : purpose === 'verify' ? 'Подтверждение email' : 'Сброс пароля'
  const subject = `EQWIP — ${purposeTitle}`
  const digits = String(code).replace(/\D+/g, '').split('')
  const text = `${purposeTitle}: ${code}\nEmail: ${email}\nКод действителен 10 минут.`
  // Серая палитра для OTP
  const textMain = '#111111'
  const textMuted = '#6B7280'
  const frame = '#D1D5DB' // светлая рамка для окна кода
  const circleBg = '#FFFFFF'
  const circleShadow = '0 1px 2px rgba(0,0,0,0.04), inset 0 -1px 0 rgba(0,0,0,0.03)'
  const box = (d: string) => `<span style="display:inline-block;width:44px;height:44px;line-height:44px;margin:0 8px;border-radius:9999px;background:${circleBg};border:1px solid ${frame};box-shadow:${circleShadow};text-align:center;font-weight:800;font-size:22px;color:${textMain};font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;vertical-align:middle;">${escapeHtml(d)}</span>`
  const boxes = digits.map(box).join('')
  const htmlInner = `
    <h1 style="margin:0 0 8px 0; font-size:22px; color:${textMain};">${purposeTitle}</h1>
    <p style="margin:0 0 16px 0; color:${textMuted}">Email: <strong style="color:${textMain}">${escapeHtml(email)}</strong></p>
    <div style=\"display:block; padding:10px 6px; border-radius:14px; background:linear-gradient(#F9FAFB,#F3F4F6); border:1px solid ${frame}; color:${textMain}; text-align:center; font-size:0;\">\n      ${boxes}\n    </div>
    <p style="margin:16px 0 0 0; color:${textMuted}">Код действителен 10 минут. Никому его не сообщайте.</p>
  `
  const html = renderEqwipBaseLayout(htmlInner, subject)
  return { subject, html, text }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}


