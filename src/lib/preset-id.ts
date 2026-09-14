export const PRESET_NAME_MAX_LENGTH = 80

export function createPresetSlug() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
}

export function presetSharePath(slug: string) {
  return `/p/${slug}`
}

export function sanitizePresetName(name: string) {
  return name.trim().slice(0, PRESET_NAME_MAX_LENGTH)
}
