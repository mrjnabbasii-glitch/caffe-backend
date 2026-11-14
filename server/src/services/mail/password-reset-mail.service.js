import nodemailer from 'nodemailer'
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fail } from '../../utils/http-error.js'

export function resetOrigin() {
  const configured =
    process.env.APP_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')
  let url
  try {
    url = new URL(configured)
  } catch {
    fail(503, 'تنظیمات بازیابی رمز در سرور کامل نیست.')
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
  )
    fail(503, 'تنظیمات بازیابی رمز در سرور کامل نیست.')
  return url.origin
}
function localDelivery() {
  return (
    process.env.NODE_ENV !== 'production' &&
    (process.env.MAIL_MODE === 'local' || !process.env.SMTP_HOST)
  )
}
export function assertMailConfigured() {
  resetOrigin()
  if (
    !localDelivery() &&
    (!process.env.SMTP_HOST || !process.env.MAIL_FROM || process.env.MAIL_MODE === 'local')
  )
    fail(503, 'سرویس ایمیل بازیابی هنوز در سرور تنظیم نشده است.')
}
export async function sendPasswordResetEmail({ to, url, expiresAt }) {
  assertMailConfigured()
  const message = {
    from: process.env.MAIL_FROM || 'Cafe Aramesh <no-reply@localhost>',
    to: { address: to },
    subject: 'بازیابی رمز عبور کافه آرامش',
    text:
      'برای تعیین رمز جدید از لینک زیر استفاده کنید. این لینک ۱۵ دقیقه اعتبار دارد و فقط یک‌بار قابل استفاده است.\n\n' +
      url +
      '\n\nاگر شما درخواست نداده‌اید، این پیام را نادیده بگیرید.'
  }
  if (localDelivery()) {
    const directory = new URL('../../../.local-mail/', import.meta.url)
    await mkdir(directory, { recursive: true })
    await writeFile(
      new URL(Date.now() + '-' + randomUUID() + '.json', directory),
      JSON.stringify({ ...message, expiresAt }, null, 2),
      { encoding: 'utf8', mode: 0o600 }
    )
    console.info('Local password-recovery message saved in server/.local-mail (development only).')
    return
  }
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  })
  await transport.sendMail(message)
}
