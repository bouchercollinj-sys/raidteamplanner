import { describe, expect, it } from 'vitest'

import {
  addSpecToFirstOpenSlot,
  addSpecToSlot,
  createEmptyRaid,
  decodeRaid,
  encodeRaid,
  moveMember,
  updateMemberName,
} from './raid-state'

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
})
