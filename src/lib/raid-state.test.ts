import { describe, expect, it } from 'vitest'

import {
  addSpecToFirstOpenSlot,
  addSpecToSlot,
  createEmptyRaid,
  decodeRaid,
  encodeRaid,
  moveMember,
  raidSize,
  resizeRaid,
  shouldPersistRaid,
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
    expect(raidSize(decoded.state)).toBe(25)
  })

  it('round-trips chosen raid sizes in the URL payload', () => {
    const tenPlayer = addSpecToSlot(createEmptyRaid(10), 'shadow-priest', 7)
    expect(tenPlayer).not.toBeNull()

    const decodedTen = decodeRaid(encodeRaid(tenPlayer!))
    expect(decodedTen.ok).toBe(true)
    expect(decodedTen.state.slots).toHaveLength(10)
    expect(decodedTen.state.slots[7]).toMatchObject({
      specId: 'shadow-priest',
    })

    const fortyPlayer = addSpecToSlot(createEmptyRaid(40), 'feral-druid', 38)
    expect(fortyPlayer).not.toBeNull()

    const decodedForty = decodeRaid(encodeRaid(fortyPlayer!))
    expect(decodedForty.ok).toBe(true)
    expect(decodedForty.state.slots).toHaveLength(40)
    expect(decodedForty.state.slots[38]?.specId).toBe('feral-druid')
  })

  it('reads legacy share links that omit raid size as 25-player raids', () => {
    const legacy = btoa(
      JSON.stringify({
        v: 1,
        s: [null, ['arcane-mage', 'Kael']],
      }),
    ).replace(/=+$/, '')

    const decoded = decodeRaid(legacy)

    expect(decoded.ok).toBe(true)
    expect(decoded.state.slots).toHaveLength(25)
    expect(decoded.state.slots[1]).toMatchObject({
      specId: 'arcane-mage',
      name: 'Kael',
    })
  })

  it('rejects raid sizes that are not 10, 20, 25, or 40', () => {
    const invalidSize = btoa(
      JSON.stringify({
        v: 1,
        n: 15,
        s: [['arcane-mage', 'Kael']],
      }),
    ).replace(/=+$/, '')

    expect(decodeRaid(invalidSize).ok).toBe(false)
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

  it('resizes between 10, 20, 25, and 40 player raids', () => {
    const started = addSpecToSlot(createEmptyRaid(10), 'shadow-priest', 9)
    const expanded = resizeRaid(started!, 40)

    expect(expanded.slots).toHaveLength(40)
    expect(expanded.slots[9]?.specId).toBe('shadow-priest')
    expect(expanded.slots[39]).toBeNull()

    const shrunk = resizeRaid(expanded, 20)
    expect(shrunk.slots).toHaveLength(20)
    expect(shrunk.slots[9]?.specId).toBe('shadow-priest')
  })

  it('moves overflow members into open slots when shrinking', () => {
    const withLateMember = addSpecToSlot(
      createEmptyRaid(25),
      'restoration-druid',
      24,
    )
    const shrunk = resizeRaid(withLateMember!, 10)

    expect(shrunk.slots).toHaveLength(10)
    expect(shrunk.slots[0]).toMatchObject({
      specId: 'restoration-druid',
    })
  })

  it('drops members who cannot fit the smaller raid', () => {
    let state = createEmptyRaid(10)

    for (let index = 0; index < 10; index += 1) {
      state = addSpecToSlot(state, 'arcane-mage', index)!
    }

    const overflowed = addSpecToSlot(resizeRaid(state, 20), 'shadow-priest', 15)
    const shrunk = resizeRaid(overflowed!, 10)

    expect(shrunk.slots).toHaveLength(10)
    expect(shrunk.slots.every((slot) => slot?.specId === 'arcane-mage')).toBe(
      true,
    )
  })

  it('persists empty raids when the size is not the 25-player default', () => {
    expect(shouldPersistRaid(createEmptyRaid())).toBe(false)
    expect(shouldPersistRaid(createEmptyRaid(10))).toBe(true)
    expect(shouldPersistRaid(createEmptyRaid(40))).toBe(true)
  })
})
