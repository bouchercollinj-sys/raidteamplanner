import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from 'cloudflare:workers'

import { createDb } from '#/lib/db'
import * as schema from '#/lib/schema'

function readAuthEnv() {
  const secret = env.BETTER_AUTH_SECRET
  const baseURL = env.BETTER_AUTH_URL

  if (!secret || secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set to at least 32 characters in .dev.vars.',
    )
  }

  if (!baseURL) {
    throw new Error('BETTER_AUTH_URL must be set in .dev.vars.')
  }

  return { secret, baseURL }
}

let cachedAuth: ReturnType<typeof createAuthInstance> | undefined

function createAuthInstance() {
  const { secret, baseURL } = readAuthEnv()
  const db = createDb(env.DB)

  return betterAuth({
    appName: 'justraidplanner',
    baseURL,
    secret,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const { sendResetPasswordEmail } = await import('#/lib/email.server')
        try {
          await sendResetPasswordEmail({
            to: user.email,
            name: user.name,
            url,
          })
          console.info('Password reset email sent')
        } catch (error: unknown) {
          console.error('Failed to send password reset email', error)
          throw error
        }
      },
    },
    trustedOrigins: [
      baseURL,
      'http://localhost:43127',
      'https://justanotherplanner.com',
    ],
    plugins: [tanstackStartCookies()],
  })
}

export function createAuth() {
  cachedAuth ??= createAuthInstance()
  return cachedAuth
}

type Auth = ReturnType<typeof createAuth>

export const auth = new Proxy({} as Auth, {
  get(_target, property) {
    const instance = createAuth()
    const value = instance[property as keyof Auth]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
