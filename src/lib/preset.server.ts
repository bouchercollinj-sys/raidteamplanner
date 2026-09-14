import { env } from 'cloudflare:workers'
import { and, desc, eq } from 'drizzle-orm'

import { createDb } from '#/lib/db'
import {
  MAX_PRESETS_PER_USER,
  raidStateFromPreset,
} from '#/lib/presets'
import type { SavedPreset } from '#/lib/presets'
import { isRaidSize } from '#/lib/raid-state'
import { raidPreset } from '#/lib/schema'
import { requireSessionUser } from '#/lib/session.server'

function toSavedPreset(row: typeof raidPreset.$inferSelect): SavedPreset {
  if (!isRaidSize(row.raidSize)) {
    throw new Error('This saved raid has an unsupported size.')
  }

  return {
    id: row.id,
    name: row.name,
    raid: row.raid,
    raidSize: row.raidSize,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  }
}

export async function listPresetsForUser(): Promise<Array<SavedPreset>> {
  const user = await requireSessionUser()
  const db = createDb(env.DB)
  const rows = await db
    .select()
    .from(raidPreset)
    .where(eq(raidPreset.userId, user.id))
    .orderBy(desc(raidPreset.updatedAt))

  return rows.map(toSavedPreset)
}

export async function savePresetForUser(data: {
  name: string
  raid: string
  raidSize: SavedPreset['raidSize']
}): Promise<SavedPreset> {
  const user = await requireSessionUser()
  raidStateFromPreset(data.raid, data.raidSize)

  const db = createDb(env.DB)
  const existing = await db
    .select({ id: raidPreset.id })
    .from(raidPreset)
    .where(eq(raidPreset.userId, user.id))

  if (existing.length >= MAX_PRESETS_PER_USER) {
    throw new Error(
      `You can keep ${MAX_PRESETS_PER_USER} saved raids. Delete one to make room.`,
    )
  }

  const now = new Date()
  const id = crypto.randomUUID()

  await db.insert(raidPreset).values({
    id,
    userId: user.id,
    name: data.name,
    raid: data.raid,
    raidSize: data.raidSize,
    createdAt: now,
    updatedAt: now,
  })

  return {
    id,
    name: data.name,
    raid: data.raid,
    raidSize: data.raidSize,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  }
}

export async function renamePresetForUser(data: {
  id: string
  name: string
}): Promise<SavedPreset> {
  const user = await requireSessionUser()
  const db = createDb(env.DB)
  const [row] = await db
    .select()
    .from(raidPreset)
    .where(and(eq(raidPreset.id, data.id), eq(raidPreset.userId, user.id)))
    .limit(1)

  if (!row) {
    throw new Error('That saved raid could not be found.')
  }

  const updatedAt = new Date()
  await db
    .update(raidPreset)
    .set({ name: data.name, updatedAt })
    .where(and(eq(raidPreset.id, data.id), eq(raidPreset.userId, user.id)))

  return toSavedPreset({ ...row, name: data.name, updatedAt })
}

export async function deletePresetForUser(data: {
  id: string
}): Promise<{ id: string }> {
  const user = await requireSessionUser()
  const db = createDb(env.DB)
  const deleted = await db
    .delete(raidPreset)
    .where(and(eq(raidPreset.id, data.id), eq(raidPreset.userId, user.id)))
    .returning({ id: raidPreset.id })

  if (deleted.length === 0) {
    throw new Error('That saved raid could not be found.')
  }

  return { id: data.id }
}
