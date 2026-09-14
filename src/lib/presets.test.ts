import { describe, expect, it } from 'vitest'

import {
  addSpecToSlot,
  createEmptyRaid,
  decodeRaid,
  updateMemberName,
} from './raid-state'
import {
  parseDisplayName,
  parsePresetName,
  presetPayloadFromState,
  raidStateFromPreset,
} from './presets'

describe('preset names', () => {
  it('trims and accepts a usable name', () => {
    expect(parsePresetName('  Kara 25  ')).toBe('Kara 25')
  })

  it('rejects blank and oversized names', () => {
    expect(() => parsePresetName('   ')).toThrow('Give this raid a name.')
    expect(() => parsePresetName('x'.repeat(49))).toThrow(
      'Use 48 characters or fewer.',
    )
  })
})

describe('display names', () => {
  it('uses a profile-specific empty-name message', () => {
    expect(parseDisplayName('  Collin  ')).toBe('Collin')
    expect(() => parseDisplayName(' ')).toThrow('Enter a display name.')
  })
})

describe('preset raid payload', () => {
  it('round-trips through encode and decode', () => {
    const withSpec = addSpecToSlot(createEmptyRaid(10), 'shadow-priest', 3)
    const named = updateMemberName(withSpec!, 3, 'Tenman')
    const payload = presetPayloadFromState(named)
    const loaded = raidStateFromPreset(payload.raid, payload.raidSize)

    expect(payload.raidSize).toBe(10)
    expect(loaded.slots).toHaveLength(10)
    expect(loaded.slots[3]).toMatchObject({
      specId: 'shadow-priest',
      name: 'Tenman',
    })
    expect(decodeRaid(payload.raid, payload.raidSize).ok).toBe(true)
  })

  it('rejects an invalid stored raid', () => {
    expect(() => raidStateFromPreset('not-a-valid-raid', 25)).toThrow(
      'This saved raid could not be read',
    )
  })
})
