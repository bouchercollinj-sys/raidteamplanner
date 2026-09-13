import { specsById } from '#/data/specs'

export const RAID_SIZE = 25
export const GROUP_SIZE = 5
export const MAX_PLAYER_NAME_LENGTH = 24

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
  s: Array<[string, string] | null>
}

export type DecodedRaid =
  | { ok: true; state: RaidState }
  | { ok: false; state: RaidState; message: string }

export function createEmptyRaid(): RaidState {
  return { slots: Array.from({ length: RAID_SIZE }, () => null) }
}

export function isRaidEmpty(state: RaidState) {
  return state.slots.every((slot) => slot === null)
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
    !isValidSlotIndex(slotIndex) ||
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
    !isValidSlotIndex(fromIndex) ||
    !isValidSlotIndex(toIndex) ||
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
  if (!isValidSlotIndex(slotIndex) || state.slots[slotIndex] === null) {
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

    const slots = Array.from({ length: RAID_SIZE }, (_, index) => {
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
    !Array.isArray(value.s) ||
    value.s.length > RAID_SIZE
  ) {
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

function isValidSlotIndex(slotIndex: number) {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < RAID_SIZE
}

function invalidRaid(): DecodedRaid {
  return {
    ok: false,
    state: createEmptyRaid(),
    message:
      'This shared setup could not be read. The link may be incomplete or outdated.',
  }
}
