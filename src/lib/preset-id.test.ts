import { describe, expect, it } from 'vitest'

import {
  PRESET_NAME_MAX_LENGTH,
  createPresetSlug,
  presetSharePath,
  sanitizePresetName,
} from './preset-id'

describe('preset identifiers', () => {
  it('creates unique 16-character slugs', () => {
    const slugs = new Set(Array.from({ length: 20 }, () => createPresetSlug()))

    expect(slugs.size).toBe(20)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[0-9a-f]{16}$/)
    }
  })

  it('builds a share path on this site', () => {
    expect(presetSharePath('a1b2c3d4e5f60718')).toBe('/p/a1b2c3d4e5f60718')
  })

  it('trims and truncates preset names', () => {
    expect(sanitizePresetName('  Karazhan  ')).toBe('Karazhan')
    expect(
      sanitizePresetName('x'.repeat(PRESET_NAME_MAX_LENGTH + 8)),
    ).toHaveLength(PRESET_NAME_MAX_LENGTH)
  })
})
