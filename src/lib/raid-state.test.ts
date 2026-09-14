import { describe, expect, it } from 'vitest'

import {
  addSpecToFirstOpenSlot,
  addSpecToSlot,
  createEmptyRaid,
  decodeRaid,
  encodeRaid,
  getRaidSize,
  moveMember,
  parseRaidSize,
  resizeRaid,
  updateMemberName,
} from './raid-state'

function encodedSlotCount(value: string) {
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { s: unknown[] }
  return parsed.s.length
}

describe('raid URL state', () => {
  it('round-trips composition and Unicode player names', () => {
    const withSpec = addSpecToSlot(createEmptyRaid(), 'shadow-priest', 7)
    expect(withSpec).not.toBeNull()

    const named = updateMemberName(withSpec!, 7, 'Éowyn')
    const decoded = decodeRaid(encodeRaid(named))

    expect(decoded.ok).toBe(true)
    expect(decoded.state.slots[7]).toMatchObject({
      specId: 'shadow-priest',
      name: 'Éowyn',
    })
    expect(decoded.state.slots).toHaveLength(25)
  })

  it('round-trips a 10-man raid when size is encoded in search state', () => {
    const withSpec = addSpecToSlot(createEmptyRaid(10), 'shadow-priest', 7)
    expect(withSpec).not.toBeNull()

    const named = updateMemberName(withSpec!, 7, 'Éowyn')
    const decoded = decodeRaid(encodeRaid(named), 10)

    expect(decoded.ok).toBe(true)
    expect(decoded.state.slots).toHaveLength(10)
    expect(decoded.state.slots[7]).toMatchObject({
      specId: 'shadow-priest',
      name: 'Éowyn',
    })
    expect(encodedSlotCount(encodeRaid(named))).toBe(10)
  })

  it('defaults omitted size to 25 for existing shared links', () => {
    const withSpec = addSpecToSlot(createEmptyRaid(), 'holy-priest', 0)
    const decoded = decodeRaid(encodeRaid(withSpec!))

    expect(decoded.ok).toBe(true)
    expect(decoded.state.slots).toHaveLength(25)
    expect(parseRaidSize(undefined)).toBe(25)
    expect(parseRaidSize('10')).toBe(10)
    expect(parseRaidSize(20)).toBe(20)
    expect(parseRaidSize('99')).toBe(25)
  })

  it('rejects malformed and unknown compositions', () => {
    expect(decodeRaid('not-a-valid-raid').ok).toBe(false)

    const unknownSpec = btoa(
      JSON.stringify({
        v: 1,
        s: [['bard', 'Leeroy']],
      }),
    ).replace(/=+$/, '')

    expect(decodeRaid(unknownSpec).ok).toBe(false)
  })
})

describe('raid editing', () => {
  it('adds a spec to the first open slot', () => {
    const state = addSpecToFirstOpenSlot(createEmptyRaid(), 'arcane-mage')

    expect(state?.slots[0]).toMatchObject({
      specId: 'arcane-mage',
      name: '',
    })
  })

  it('moves a member into an open slot', () => {
    const state = addSpecToSlot(createEmptyRaid(), 'feral-druid', 0)
    expect(state).not.toBeNull()

    const moved = moveMember(state!, 0, 6)

    expect(moved.slots[0]).toBeNull()
    expect(moved.slots[6]?.specId).toBe('feral-druid')
  })

  it('swaps occupied slots without losing names', () => {
    const first = addSpecToSlot(createEmptyRaid(), 'protection-paladin', 0)
    const second = addSpecToSlot(first!, 'elemental-shaman', 5)
    const namedFirst = updateMemberName(second!, 0, 'Aegis')
    const namedBoth = updateMemberName(namedFirst, 5, 'Storm')

    const swapped = moveMember(namedBoth, 0, 5)

    expect(swapped.slots[0]).toMatchObject({
      specId: 'elemental-shaman',
      name: 'Storm',
    })
    expect(swapped.slots[5]).toMatchObject({
      specId: 'protection-paladin',
      name: 'Aegis',
    })
  })

  it('does not add players beyond the selected raid size', () => {
    let state = createEmptyRaid(10)

    for (let index = 0; index < 10; index += 1) {
      state = addSpecToFirstOpenSlot(state, 'arcane-mage')!
    }

    expect(addSpecToFirstOpenSlot(state, 'fire-mage')).toBeNull()
    expect(addSpecToSlot(state, 'fire-mage', 10)).toBeNull()
  })
})

describe('raid size', () => {
  it('keeps remaining slots intact when shrinking', () => {
    const first = addSpecToSlot(createEmptyRaid(), 'protection-warrior', 0)
    const laterGroup = addSpecToSlot(first!, 'restoration-shaman', 9)
    const dropped = addSpecToSlot(laterGroup!, 'shadow-priest', 10)
    const named = updateMemberName(dropped!, 9, 'KeepMe')

    const resized = resizeRaid(named, 10)

    expect(resized.slots).toHaveLength(10)
    expect(getRaidSize(resized)).toBe(10)
    expect(resized.slots[0]).toMatchObject({ specId: 'protection-warrior' })
    expect(resized.slots[9]).toMatchObject({
      specId: 'restoration-shaman',
      name: 'KeepMe',
    })
    expect(resized.slots[1]).toBeNull()
  })

  it('pads empty slots when growing without moving existing players', () => {
    const filled = addSpecToSlot(createEmptyRaid(10), 'holy-priest', 3)
    const grown = resizeRaid(filled!, 20)

    expect(grown.slots).toHaveLength(20)
    expect(grown.slots[3]).toMatchObject({ specId: 'holy-priest' })
    expect(grown.slots.slice(10).every((slot) => slot === null)).toBe(true)
  })
})
