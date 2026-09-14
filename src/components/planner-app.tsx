import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { RaidPlanner } from '#/components/raid-planner'
import { deletePreset, savePreset, updatePreset } from '#/lib/preset-functions'
import type { SavedPresetSummary, SessionUser } from '#/lib/preset-functions'
import { encodeRaid } from '#/lib/raid-state'
import type { RaidState } from '#/lib/raid-state'

type PlannerAppProps = {
  state: RaidState
  user: SessionUser | null
  presets: Array<SavedPresetSummary>
  currentSlug?: string
  onStateChange: (state: RaidState) => void
}

export function PlannerApp({
  state,
  user,
  presets: initialPresets,
  currentSlug,
  onStateChange,
}: PlannerAppProps) {
  const router = useRouter()
  const [presets, setPresets] = useState(initialPresets)

  return (
    <RaidPlanner
      state={state}
      onStateChange={onStateChange}
      user={user}
      presets={presets}
      currentSlug={currentSlug}
      onPresetsChange={setPresets}
      onOpenPreset={(slug) => {
        void router.navigate({ to: '/p/$slug', params: { slug } })
      }}
      onSavePreset={async (name) => {
        const saved = await savePreset({
          data: { name, raid: encodeRaid(state) },
        })
        await router.navigate({
          to: '/p/$slug',
          params: { slug: saved.slug },
        })
        return saved
      }}
      onUpdatePreset={
        currentSlug
          ? async (name) =>
              updatePreset({
                data: {
                  slug: currentSlug,
                  name,
                  raid: encodeRaid(state),
                },
              })
          : undefined
      }
      onDeletePreset={async (slug) => {
        await deletePreset({ data: { slug } })
        if (slug === currentSlug) {
          void router.navigate({ to: '/', search: { raid: undefined } })
        }
      }}
      onSignedOut={() => {
        setPresets([])
        void router.invalidate()
      }}
    />
  )
}
