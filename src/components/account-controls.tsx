import { Link } from '@tanstack/react-router'
import { BookmarkPlus, FolderOpen, LogIn, LogOut, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { PRESET_NAME_MAX_LENGTH, presetSharePath } from '#/lib/preset-id'
import type { SavedPresetSummary, SessionUser } from '#/lib/preset-functions'
import type { RaidState } from '#/lib/raid-state'

type AccountControlsProps = {
  user: SessionUser | null
  presets: Array<SavedPresetSummary>
  raid: RaidState
  currentSlug?: string
  onPresetsChange: (presets: Array<SavedPresetSummary>) => void
  onOpenPreset: (slug: string) => void
  onSave: (name: string) => Promise<SavedPresetSummary>
  onUpdate?: (name?: string) => Promise<SavedPresetSummary>
  onDelete: (slug: string) => Promise<void>
  onCopySharePath: (path: string) => Promise<void>
  onSignedOut: () => void
}

export function AccountControls({
  user,
  presets,
  raid,
  currentSlug,
  onPresetsChange,
  onOpenPreset,
  onSave,
  onUpdate,
  onDelete,
  onCopySharePath,
  onSignedOut,
}: AccountControlsProps) {
  const [saveOpen, setSaveOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const memberCount = raid.slots.filter(Boolean).length
  const ownedCurrent = presets.some((preset) => preset.slug === currentSlug)

  if (!user) {
    return (
      <Button variant="outline" asChild>
        <Link to="/sign-in" search={{}}>
          <LogIn />
          Sign in
        </Link>
      </Button>
    )
  }

  const closePanels = () => {
    setSaveOpen(false)
    setLibraryOpen(false)
    setError(null)
  }

  return (
    <div className="account-controls">
      <span className="account-name" title={user.email}>
        {user.name || user.email}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={memberCount === 0}
        onClick={() => {
          setLibraryOpen(false)
          setSaveOpen((open) => !open)
          setError(null)
          setPresetName(
            presets.find((preset) => preset.slug === currentSlug)?.name ?? '',
          )
        }}
      >
        <BookmarkPlus />
        Save preset
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setSaveOpen(false)
          setLibraryOpen((open) => !open)
          setError(null)
        }}
      >
        <FolderOpen />
        Presets
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void authClient.signOut().then(() => {
            closePanels()
            onSignedOut()
          })
        }}
      >
        <LogOut />
        Sign out
      </Button>

      {saveOpen ? (
        <form
          className="account-panel"
          onSubmit={(event) => {
            event.preventDefault()
            setBusy(true)
            setError(null)
            const action =
              ownedCurrent && onUpdate
                ? onUpdate(presetName)
                : onSave(presetName)
            void action
              .then((preset) => {
                const next = [
                  preset,
                  ...presets.filter((item) => item.slug !== preset.slug),
                ]
                onPresetsChange(next)
                setSaveOpen(false)
                setPresetName('')
              })
              .catch((caught: unknown) => {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : 'Could not save this raid team.',
                )
              })
              .finally(() => setBusy(false))
          }}
        >
          <div className="account-panel-heading">
            <strong>
              {ownedCurrent ? 'Update saved raid' : 'Save raid team'}
            </strong>
            <button type="button" onClick={closePanels} aria-label="Close">
              <X />
            </button>
          </div>
          <Label htmlFor="preset-name">Preset name</Label>
          <Input
            id="preset-name"
            value={presetName}
            maxLength={PRESET_NAME_MAX_LENGTH}
            placeholder="Karazhan clear"
            required
            onChange={(event) => setPresetName(event.target.value)}
          />
          <p>
            Signed-in presets are stored for this site and get a shareable
            justraidplanner link.
          </p>
          {error ? <p className="account-error">{error}</p> : null}
          <Button type="submit" disabled={busy || !presetName.trim()}>
            {ownedCurrent ? 'Update preset' : 'Save raid team'}
          </Button>
        </form>
      ) : null}

      {libraryOpen ? (
        <div className="account-panel">
          <div className="account-panel-heading">
            <strong>Saved presets</strong>
            <button type="button" onClick={closePanels} aria-label="Close">
              <X />
            </button>
          </div>
          {presets.length === 0 ? (
            <p>No saved raid teams yet. Build a roster, then save it.</p>
          ) : (
            <ul className="preset-list">
              {presets.map((preset) => (
                <li key={preset.id}>
                  <div>
                    <strong>{preset.name}</strong>
                    <span>{presetSharePath(preset.slug)}</span>
                  </div>
                  <div className="preset-actions">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPreset(preset.slug)
                        setLibraryOpen(false)
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void onCopySharePath(presetSharePath(preset.slug))
                      }}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void onDelete(preset.slug).then(() => {
                          onPresetsChange(
                            presets.filter((item) => item.slug !== preset.slug),
                          )
                        })
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error ? <p className="account-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
