import { specsById } from '#/data/specs'

export const RAID_SIZES = [10, 20, 25, 40] as const
export const DEFAULT_RAID_SIZE = 25
export const GROUP_SIZE = 5
export const MAX_PLAYER_NAME_LENGTH = 24

export type RaidSize = (typeof RAID_SIZES)[number]

export type RaidMember = {
  id: string
  specId: string
  name: string
}

export type RaidState = {
  slots: Array<RaidMember | null>
}

type EncodedRaid = {
  v: 1
  n?: RaidSize
  s: Array<[string, string] | null>
}

export type DecodedRaid =
  | { ok: true; state: RaidState }
  | { ok: false; state: RaidState; message: string }

export function isRaidSize(value: unknown): value is RaidSize {
  return RAID_SIZES.includes(value as RaidSize)
}

export function raidSize(state: RaidState): RaidSize {
  return state.slots.length as RaidSize
}

export function raidSizeLabel(size: RaidSize) {
  return `${size} player raid team`
}

export function groupCount(size: RaidSize) {
  return size / GROUP_SIZE
}

export function createEmptyRaid(size: RaidSize = DEFAULT_RAID_SIZE): RaidState {
  return { slots: Array.from({ length: size }, () => null) }
}

export function isRaidEmpty(state: RaidState) {
  return state.slots.every((slot) => slot === null)
}

export function shouldPersistRaid(state: RaidState) {
  return !isRaidEmpty(state) || raidSize(state) !== DEFAULT_RAID_SIZE
}

export function resizeRaid(state: RaidState, size: RaidSize): RaidState {
  if (state.slots.length === size) {
    return state
  }

  if (size > state.slots.length) {
    return {
      slots: [
        ...state.slots,
        ...Array.from({ length: size - state.slots.length }, () => null),
      ],
    }
  }

  const slots = state.slots.slice(0, size)
  const overflow = state.slots
    .slice(size)
    .filter((slot): slot is RaidMember => slot !== null)

  for (const member of overflow) {
    const openIndex = slots.findIndex((slot) => slot === null)

    if (openIndex === -1) {
      break
    }

    slots[openIndex] = {
      ...member,
      id: memberId(openIndex, member.specId),
    }
  }

  return { slots }
}

export function addSpecToFirstOpenSlot(
  state: RaidState,
  specId: string,
): RaidState | null {
  const openIndex = state.slots.findIndex((slot) => slot === null)

  if (openIndex === -1) {
    return null
  }

  return addSpecToSlot(state, specId, openIndex)
}

export function addSpecToSlot(
  state: RaidState,
  specId: string,
  slotIndex: number,
): RaidState | null {
  if (
    !specsById.has(specId) ||
    !isValidSlotIndex(state, slotIndex) ||
    state.slots[slotIndex]
  ) {
    return null
  }

  const slots = [...state.slots]
  slots[slotIndex] = {
    id: memberId(slotIndex, specId),
    specId,
    name: '',
  }

  return { slots }
}

export function moveMember(
  state: RaidState,
  fromIndex: number,
  toIndex: number,
): RaidState {
  if (
    !isValidSlotIndex(state, fromIndex) ||
    !isValidSlotIndex(state, toIndex) ||
    fromIndex === toIndex ||
    !state.slots[fromIndex]
  ) {
    return state
  }

  const slots = [...state.slots]
  const source = slots[fromIndex]
  const target = slots[toIndex]

  slots[toIndex] = source
    ? { ...source, id: memberId(toIndex, source.specId) }
    : null
  slots[fromIndex] = target
    ? { ...target, id: memberId(fromIndex, target.specId) }
    : null

  return { slots }
}

export function removeMember(state: RaidState, slotIndex: number): RaidState {
  if (!isValidSlotIndex(state, slotIndex) || state.slots[slotIndex] === null) {
    return state
  }

  const slots = [...state.slots]
  slots[slotIndex] = null
  return { slots }
}

export function updateMemberName(
  state: RaidState,
  slotIndex: number,
  name: string,
): RaidState {
  const member = state.slots[slotIndex]

  if (!member) {
    return state
  }

  const slots = [...state.slots]
  slots[slotIndex] = {
    ...member,
    name: name.slice(0, MAX_PLAYER_NAME_LENGTH),
  }

  return { slots }
}

export function encodeRaid(state: RaidState): string {
  const payload: EncodedRaid = {
    v: 1,
    n: raidSize(state),
    s: state.slots.map((member) =>
      member
        ? [member.specId, member.name.slice(0, MAX_PLAYER_NAME_LENGTH)]
        : null,
    ),
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

export function decodeRaid(value?: string): DecodedRaid {
  if (!value) {
    return { ok: true, state: createEmptyRaid() }
  }

  if (value.length > 8_192 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return invalidRaid()
  }

  try {
    const padded = value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    )
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown

    if (!isEncodedRaid(parsed)) {
      return invalidRaid()
    }

    const size = parsed.n ?? DEFAULT_RAID_SIZE
    const slots = Array.from({ length: size }, (_, index) => {
      const encodedMember = parsed.s[index]

      if (!encodedMember) {
        return null
      }

      return {
        id: memberId(index, encodedMember[0]),
        specId: encodedMember[0],
        name: encodedMember[1].slice(0, MAX_PLAYER_NAME_LENGTH),
      }
    })

    return { ok: true, state: { slots } }
  } catch {
    return invalidRaid()
  }
}

function isEncodedRaid(value: unknown): value is EncodedRaid {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('v' in value) ||
    value.v !== 1 ||
    !('s' in value) ||
    !Array.isArray(value.s)
  ) {
    return false
  }

  const size =
    'n' in value && value.n !== undefined ? value.n : DEFAULT_RAID_SIZE

  if (!isRaidSize(size) || value.s.length > size) {
    return false
  }

  return value.s.every(
    (member) =>
      member === null ||
      (Array.isArray(member) &&
        member.length === 2 &&
        typeof member[0] === 'string' &&
        specsById.has(member[0]) &&
        typeof member[1] === 'string'),
  )
}

function memberId(slotIndex: number, specId: string) {
  return `member-${slotIndex}-${specId}`
}

function isValidSlotIndex(state: RaidState, slotIndex: number) {
  return (
    Number.isInteger(slotIndex) &&
    slotIndex >= 0 &&
    slotIndex < state.slots.length
  )
}

function invalidRaid(): DecodedRaid {
  return {
    ok: false,
    state: createEmptyRaid(),
    message:
      'This shared setup could not be read. The link may be incomplete or outdated.',
  }
}
