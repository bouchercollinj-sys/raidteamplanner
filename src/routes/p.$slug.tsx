import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PlannerApp } from '#/components/planner-app'
import { Button } from '#/components/ui/button'
import { getAccountState, getPresetBySlug } from '#/lib/preset-functions'
import { decodeRaid } from '#/lib/raid-state'
import type { RaidState } from '#/lib/raid-state'

export const Route = createFileRoute('/p/$slug')({
  loader: async ({ params }) => {
    const [preset, account] = await Promise.all([
      getPresetBySlug({ data: { slug: params.slug } }),
      getAccountState(),
    ])

    return { preset, account }
  },
  pendingComponent: PresetLoading,
  component: SharedPresetRoute,
})

function SharedPresetRoute() {
  const { slug } = Route.useParams()
  const { preset, account } = Route.useLoaderData()

  if (!preset) {
    return (
      <main className="route-state">
        <div className="route-state-card" role="alert">
          <p className="eyebrow">Saved raid</p>
          <h1>This raid team could not be found.</h1>
          <p>
            The share link may be incomplete, or the owner may have deleted this
            preset.
          </p>
          <Button asChild>
            <Link to="/">Start a fresh raid</Link>
          </Button>
        </div>
      </main>
    )
  }

  const decoded = decodeRaid(preset.raid)

  if (!decoded.ok) {
    return (
      <main className="route-state">
        <div className="route-state-card" role="alert">
          <p className="eyebrow">Saved raid</p>
          <h1>This saved roster could not be read.</h1>
          <p>{decoded.message}</p>
          <Button asChild>
            <Link to="/">Start a fresh raid</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <LoadedPreset
      slug={slug}
      initialState={decoded.state}
      user={account.user}
      presets={account.presets}
    />
  )
}

function LoadedPreset({
  slug,
  initialState,
  user,
  presets,
}: {
  slug: string
  initialState: RaidState
  user: ReturnType<typeof Route.useLoaderData>['account']['user']
  presets: ReturnType<typeof Route.useLoaderData>['account']['presets']
}) {
  const [state, setState] = useState(initialState)

  return (
    <PlannerApp
      state={state}
      user={user}
      presets={presets}
      currentSlug={slug}
      onStateChange={setState}
    />
  )
}

function PresetLoading() {
  return (
    <main
      className="route-state"
      aria-busy="true"
      aria-label="Loading saved raid"
    >
      <div className="loading-card">
        <span className="loading-line short" />
        <span className="loading-line title" />
        <span className="loading-line" />
        <p>Opening saved raid team…</p>
      </div>
    </main>
  )
}
