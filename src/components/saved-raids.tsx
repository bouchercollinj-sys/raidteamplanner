import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  deletePreset,
  listPresets,
  renamePreset,
} from '#/lib/preset.functions'
import { PRESET_NAME_MAX_LENGTH, parsePresetName } from '#/lib/presets'
import type { SavedPreset } from '#/lib/presets'
import { DEFAULT_RAID_SIZE } from '#/lib/raid-state'

export function SavedRaidsSection() {
  const [presets, setPresets] = useState<Array<SavedPreset> | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setPending(true)
      setError(null)

      try {
        const nextPresets = await listPresets()

        if (!cancelled) {
          setPresets(nextPresets)
        }
      } catch (cause) {
        if (!cancelled) {
          setError(messageFrom(cause, 'Your saved raids could not be loaded.'))
        }
      } finally {
        if (!cancelled) {
          setPending(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleRename = async (id: string) => {
    setPending(true)
    setError(null)

    try {
      const parsedName = parsePresetName(renameValue)
      const updated = await renamePreset({
        data: { id, name: parsedName },
      })
      setPresets(
        (current) =>
          current?.map((preset) => (preset.id === id ? updated : preset)) ??
          null,
      )
      setRenamingId(null)
      setNotice(`Renamed to “${parsedName}”.`)
    } catch (cause) {
      setError(messageFrom(cause, 'That raid could not be renamed.'))
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (preset: SavedPreset) => {
    setPending(true)
    setError(null)

    try {
      await deletePreset({ data: { id: preset.id } })
      setPresets(
        (current) => current?.filter((item) => item.id !== preset.id) ?? null,
      )
      setNotice(`Deleted “${preset.name}”.`)
    } catch (cause) {
      setError(messageFrom(cause, 'That raid could not be deleted.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="saved-raids-section" aria-labelledby="saved-raids-title">
      <p className="eyebrow">Your library</p>
      <h2 id="saved-raids-title">Saved raids</h2>

      {notice ? (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="preset-list">
        {pending && presets === null ? (
          <p className="preset-empty">Loading your saved raids…</p>
        ) : presets?.length ? (
          <ul>
            {presets.map((preset) => (
              <li key={preset.id}>
                {renamingId === preset.id ? (
                  <form
                    className="preset-rename"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void handleRename(preset.id)
                    }}
                  >
                    <Input
                      value={renameValue}
                      maxLength={PRESET_NAME_MAX_LENGTH}
                      aria-label="New preset name"
                      onChange={(event) => setRenameValue(event.target.value)}
                    />
                    <Button type="submit" size="sm" disabled={pending}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRenamingId(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <div>
                      <strong>{preset.name}</strong>
                      <span>{preset.raidSize}-player</span>
                    </div>
                    <div className="preset-actions">
                      <Button size="sm" asChild>
                        <Link
                          to="/"
                          search={{
                            raid: preset.raid,
                            size:
                              preset.raidSize === DEFAULT_RAID_SIZE
                                ? undefined
                                : preset.raidSize,
                          }}
                        >
                          Load
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRenamingId(preset.id)
                          setRenameValue(preset.name)
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDelete(preset)}
                        disabled={pending}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="preset-empty">
            <strong>No saved raids yet.</strong>
          </div>
        )}
      </div>
    </section>
  )
}

function messageFrom(cause: unknown, fallback: string) {
  if (cause instanceof Error && cause.message) {
    return cause.message
  }

  if (
    typeof cause === 'object' &&
    cause !== null &&
    'message' in cause &&
    typeof cause.message === 'string' &&
    cause.message
  ) {
    return cause.message
  }

  return fallback
}
