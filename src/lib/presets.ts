import { z } from 'zod'

import {
  decodeRaid,
  encodeRaid,
  getRaidSize,
  isRaidSize,
  parseRaidSize,
} from '#/lib/raid-state'
import type { RaidSize, RaidState } from '#/lib/raid-state'

export const PRESET_NAME_MIN_LENGTH = 1
export const PRESET_NAME_MAX_LENGTH = 48
export const DISPLAY_NAME_MAX_LENGTH = PRESET_NAME_MAX_LENGTH
export const MAX_PRESETS_PER_USER = 50

export const displayNameSchema = z
  .string()
  .trim()
  .min(PRESET_NAME_MIN_LENGTH, 'Enter a display name.')
  .max(
    DISPLAY_NAME_MAX_LENGTH,
    `Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
  )

export const presetNameSchema = z
  .string()
  .trim()
  .min(PRESET_NAME_MIN_LENGTH, 'Give this raid a name.')
  .max(
    PRESET_NAME_MAX_LENGTH,
    `Use ${PRESET_NAME_MAX_LENGTH} characters or fewer.`,
  )

export const raidSizeSchema = z.union([
  z.literal(10),
  z.literal(20),
  z.literal(25),
])

export const savePresetInputSchema = z.object({
  name: presetNameSchema,
  raid: z.string().min(1).max(8_192),
  raidSize: raidSizeSchema,
})

export const renamePresetInputSchema = z.object({
  id: z.string().min(1),
  name: presetNameSchema,
})

export const presetIdSchema = z.object({
  id: z.string().min(1),
})

export type SavedPreset = {
  id: string
  name: string
  raid: string
  raidSize: RaidSize
  createdAt: number
  updatedAt: number
}

export function parseDisplayName(value: unknown) {
  const parsed = displayNameSchema.safeParse(value)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Enter a display name.')
  }

  return parsed.data
}

export function parsePresetName(value: unknown) {
  const parsed = presetNameSchema.safeParse(value)

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? 'Give this raid a name.',
    )
  }

  return parsed.data
}

export function presetPayloadFromState(state: RaidState) {
  return {
    raid: encodeRaid(state),
    raidSize: getRaidSize(state),
  }
}

export function raidStateFromPreset(
  raid: string,
  raidSize: unknown,
): RaidState {
  const size = isRaidSize(raidSize) ? raidSize : parseRaidSize(raidSize)
  const decoded = decodeRaid(raid, size)

  if (!decoded.ok) {
    throw new Error(
      'This saved raid could not be read. It may be incomplete or outdated.',
    )
  }

  return decoded.state
}
