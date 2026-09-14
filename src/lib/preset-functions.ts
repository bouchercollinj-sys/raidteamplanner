import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import { ensureSchema, getAuth } from '#/lib/auth'
import {
  PRESET_NAME_MAX_LENGTH,
  createPresetSlug,
  sanitizePresetName,
} from '#/lib/preset-id'
import { decodeRaid } from '#/lib/raid-state'

export type SessionUser = {
  id: string
  name: string
  email: string
}

export type SavedPreset = {
  id: string
  slug: string
  name: string
  raid: string
  createdAt: number
  updatedAt: number
}

export type SavedPresetSummary = Omit<SavedPreset, 'raid'>

async function readSessionUser(): Promise<SessionUser | null> {
  await ensureSchema()
  const session = await getAuth().api.getSession({
    headers: getRequest().headers,
  })

  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  }
}

async function requireUser() {
  const user = await readSessionUser()

  if (!user) {
    throw new Error('Sign in to save and manage raid presets.')
  }

  return user
}

async function listPresetsForUser(userId: string) {
  const result = await env.DB.prepare(
    `SELECT id, slug, name, created_at, updated_at
     FROM raid_preset
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
  )
    .bind(userId)
    .all<{
      id: string
      slug: string
      name: string
      created_at: number
      updated_at: number
    }>()

  return result.results.map(
    (row) =>
      ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }) satisfies SavedPresetSummary,
  )
}

export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async () => readSessionUser(),
)

export const getAccountState = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await readSessionUser()

    if (!user) {
      return { user: null, presets: [] as Array<SavedPresetSummary> }
    }

    return { user, presets: await listPresetsForUser(user.id) }
  },
)

export const listPresets = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireUser()
    return listPresetsForUser(user.id)
  },
)

export const getPresetBySlug = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(32) }))
  .handler(async ({ data }) => {
    await ensureSchema()
    const row = await env.DB.prepare(
      `SELECT id, slug, name, raid, created_at, updated_at
       FROM raid_preset
       WHERE slug = ?`,
    )
      .bind(data.slug)
      .first<{
        id: string
        slug: string
        name: string
        raid: string
        created_at: number
        updated_at: number
      }>()

    if (!row) {
      return null
    }

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      raid: row.raid,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies SavedPreset
  })

export const savePreset = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().min(1).max(PRESET_NAME_MAX_LENGTH),
      raid: z.string().min(1).max(8_192),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser()
    const name = sanitizePresetName(data.name)

    if (!name) {
      throw new Error('Give this raid team a name before saving it.')
    }

    const decoded = decodeRaid(data.raid)
    if (!decoded.ok) {
      throw new Error(decoded.message)
    }

    const now = Date.now()
    let slug = createPresetSlug()

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await env.DB.prepare(
        `SELECT slug FROM raid_preset WHERE slug = ?`,
      )
        .bind(slug)
        .first()

      if (!existing) {
        break
      }

      slug = createPresetSlug()
    }

    const id = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO raid_preset (id, slug, user_id, name, raid, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, slug, user.id, name, data.raid, now, now)
      .run()

    return {
      id,
      slug,
      name,
      createdAt: now,
      updatedAt: now,
    } satisfies SavedPresetSummary
  })

export const updatePreset = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      slug: z.string().min(1).max(32),
      name: z.string().min(1).max(PRESET_NAME_MAX_LENGTH).optional(),
      raid: z.string().min(1).max(8_192),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser()
    const decoded = decodeRaid(data.raid)
    if (!decoded.ok) {
      throw new Error(decoded.message)
    }

    const existing = await env.DB.prepare(
      `SELECT id, name FROM raid_preset WHERE slug = ? AND user_id = ?`,
    )
      .bind(data.slug, user.id)
      .first<{ id: string; name: string }>()

    if (!existing) {
      throw new Error('This saved raid was not found in your account.')
    }

    const name = data.name ? sanitizePresetName(data.name) : existing.name
    const now = Date.now()
    await env.DB.prepare(
      `UPDATE raid_preset
       SET name = ?, raid = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
      .bind(name, data.raid, now, existing.id, user.id)
      .run()

    return {
      id: existing.id,
      slug: data.slug,
      name,
      createdAt: now,
      updatedAt: now,
    } satisfies SavedPresetSummary
  })

export const deletePreset = createServerFn({ method: 'POST' })
  .validator(z.object({ slug: z.string().min(1).max(32) }))
  .handler(async ({ data }) => {
    const user = await requireUser()
    await env.DB.prepare(
      `DELETE FROM raid_preset WHERE slug = ? AND user_id = ?`,
    )
      .bind(data.slug, user.id)
      .run()

    return { slug: data.slug }
  })
