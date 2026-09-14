import { betterAuth } from 'better-auth'
import { getMigrations } from 'better-auth/db/migration'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from 'cloudflare:workers'

import { getRequest } from '@tanstack/react-start/server'

const authByOrigin = new Map<string, ReturnType<typeof createAuth>>()

export function getRequestOrigin() {
  return new URL(getRequest().url).origin
}

function createAuth(origin: string) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: origin,
    trustedOrigins: [
      origin,
      'http://localhost:43127',
      'http://127.0.0.1:43127',
    ],
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      database: {
        validateSchema: false,
      },
    },
    plugins: [tanstackStartCookies()],
  })
}

export function getAuth() {
  const origin = getRequestOrigin()
  const cached = authByOrigin.get(origin)

  if (cached) {
    return cached
  }

  const auth = createAuth(origin)
  authByOrigin.set(origin, auth)
  return auth
}

let schemaReady = false

export async function ensureSchema() {
  if (schemaReady) {
    return
  }

  const auth = getAuth()
  const existing = await env.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user'`,
  ).first<{ name: string }>()

  if (!existing) {
    const { runMigrations } = await getMigrations(auth.options)
    await runMigrations()
  }

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS raid_preset (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      raid TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ).run()
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS raid_preset_user_id_idx ON raid_preset (user_id)`,
  ).run()
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS raid_preset_slug_idx ON raid_preset (slug)`,
  ).run()

  schemaReady = true
}
