import { env } from 'cloudflare:workers'
import { WorkerMailer } from 'worker-mailer'

export const RESET_FROM_EMAIL = 'reset@lastminute.technology'

export async function sendResetPasswordEmail({
  to,
  name,
  url,
}: {
  to: string
  name: string
  url: string
}) {
  const password = env.SMTP_PASSWORD

  if (!password) {
    console.warn(
      'SMTP_PASSWORD is not set. Password reset email was not sent.',
      { to, url },
    )
    return
  }

  const safeName = name.trim() || 'there'
  const safeUrl = escapeHtml(url)

  await WorkerMailer.send(
    {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      startTls: false,
      credentials: {
        username: RESET_FROM_EMAIL,
        password,
      },
      authType: ['login', 'plain'],
      socketTimeoutMs: 20_000,
      responseTimeoutMs: 20_000,
    },
    {
      from: { name: 'justraidplanner', email: RESET_FROM_EMAIL },
      to: { name: safeName, email: to },
      subject: 'Reset your justraidplanner password',
      text: [
        `Hi ${safeName},`,
        '',
        'Use this link to choose a new password for your justraidplanner profile:',
        url,
        '',
        'If you did not ask for this, you can ignore this email.',
      ].join('\n'),
      html: [
        `<p>Hi ${escapeHtml(safeName)},</p>`,
        '<p>Use this link to choose a new password for your justraidplanner profile:</p>',
        `<p><a href="${safeUrl}">Reset your password</a></p>`,
        `<p>${safeUrl}</p>`,
        '<p>If you did not ask for this, you can ignore this email.</p>',
      ].join(''),
    },
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
