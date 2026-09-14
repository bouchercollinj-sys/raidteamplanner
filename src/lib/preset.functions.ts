import { createServerFn } from '@tanstack/react-start'

import {
  presetIdSchema,
  renamePresetInputSchema,
  savePresetInputSchema,
} from '#/lib/presets'
import type { SavedPreset } from '#/lib/presets'

export const listPresets = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<SavedPreset>> => {
    const { listPresetsForUser } = await import('#/lib/preset.server')
    return listPresetsForUser()
  },
)

export const savePreset = createServerFn({ method: 'POST' })
  .validator((input) => savePresetInputSchema.parse(input))
  .handler(async ({ data }): Promise<SavedPreset> => {
    const { savePresetForUser } = await import('#/lib/preset.server')
    return savePresetForUser(data)
  })

export const renamePreset = createServerFn({ method: 'POST' })
  .validator((input) => renamePresetInputSchema.parse(input))
  .handler(async ({ data }): Promise<SavedPreset> => {
    const { renamePresetForUser } = await import('#/lib/preset.server')
    return renamePresetForUser(data)
  })

export const deletePreset = createServerFn({ method: 'POST' })
  .validator((input) => presetIdSchema.parse(input))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { deletePresetForUser } = await import('#/lib/preset.server')
    return deletePresetForUser(data)
  })
