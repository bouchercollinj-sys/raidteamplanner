import { Link } from '@tanstack/react-router'
import { BookmarkPlus, X } from 'lucide-react'
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { savePreset } from '#/lib/preset.functions'
import {
  PRESET_NAME_MAX_LENGTH,
  parsePresetName,
  presetPayloadFromState,
} from '#/lib/presets'
import { getRaidSize } from '#/lib/raid-state'
import type { RaidState } from '#/lib/raid-state'
import type { AuthUser } from '#/lib/session'

const PresetMenuContext = createContext<{
  openSave: () => void
} | null>(null)

function usePresetMenu() {
  const context = useContext(PresetMenuContext)

  if (!context) {
    throw new Error('Preset menu controls must be used inside PresetMenu.')
  }

  return context
}

export function SaveRaidButton() {
  const { openSave } = usePresetMenu()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="save-raid-button"
      aria-label="Save raid"
      onClick={openSave}
    >
      <BookmarkPlus />
    </Button>
  )
}

export function PresetMenu({
  user,
  state,
  children,
}: {
  user: AuthUser | null
  state: RaidState
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const close = () => {
    setOpen(false)
    setError(null)
    setNotice(null)
  }

  const openSave = () => {
    setName('')
    setError(null)
    setNotice(null)
    setOpen(true)
  }

  const handleSave = async () => {
    if (!user) {
      return
    }

    setPending(true)
    setError(null)
    setNotice(null)

    try {
      const parsedName = parsePresetName(name)
      const payload = presetPayloadFromState(state)
      await savePreset({
        data: {
          name: parsedName,
          raid: payload.raid,
          raidSize: payload.raidSize,
        },
      })
      setNotice(`Saved “${parsedName}”.`)
      setName('')
    } catch (cause) {
      setError(messageFrom(cause, 'This raid could not be saved.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <PresetMenuContext.Provider value={{ openSave }}>
      {children}

      {open ? (
        <div
          className="planner-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close()
            }
          }}
        >
          <div
            className="planner-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preset-dialog-title"
          >
            <div className="planner-modal-header">
              <div>
                <p className="eyebrow">Keep this roster</p>
                <h2 id="preset-dialog-title">Save raid</h2>
              </div>
              <button
                type="button"
                className="planner-modal-close"
                onClick={close}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

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

            {!user ? (
              <div className="preset-gate">
                <p>
                  Sign in or create a profile to save this raid and load it
                  later from your account. The share URL still works without an
                  account.
                </p>
                <div className="header-account">
                  <Button variant="outline" asChild>
                    <Link to="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/sign-up">Create profile</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="auth-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSave()
                }}
              >
                <div className="auth-field">
                  <Label htmlFor="preset-name">Preset name</Label>
                  <Input
                    id="preset-name"
                    value={name}
                    maxLength={PRESET_NAME_MAX_LENGTH}
                    placeholder={`${getRaidSize(state)}-player raid`}
                    autoComplete="off"
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Saving…' : 'Save this raid'}
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </PresetMenuContext.Provider>
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
