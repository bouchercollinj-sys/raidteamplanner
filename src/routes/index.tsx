import { createFileRoute } from '@tanstack/react-router'

import { PlannerApp } from '#/components/planner-app'
import { Button } from '#/components/ui/button'
import { getAccountState } from '#/lib/preset-functions'
import { decodeRaid, encodeRaid, shouldPersistRaid } from '#/lib/raid-state'
import type { RaidState } from '#/lib/raid-state'

type PlannerSearch = {
  raid?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): PlannerSearch => ({
    raid: typeof search.raid === 'string' ? search.raid : undefined,
  }),
  loader: () => getAccountState(),
  pendingComponent: PlannerLoading,
  component: PlannerRoute,
})

function PlannerRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const account = Route.useLoaderData()
  const decoded = decodeRaid(search.raid)

  const setRaid = (state: RaidState) => {
    void navigate({
      search: {
        raid: shouldPersistRaid(state) ? encodeRaid(state) : undefined,
      },
      replace: true,
      resetScroll: false,
    })
  }

  if (!decoded.ok) {
    return (
      <main className="route-state">
        <div className="route-state-card" role="alert">
          <p className="eyebrow">Shared setup error</p>
          <h1>We could not open this roster.</h1>
          <p>{decoded.message}</p>
          <Button
            type="button"
            onClick={() => {
              void navigate({ search: { raid: undefined }, replace: true })
            }}
          >
            Start a fresh raid
          </Button>
        </div>
      </main>
    )
  }

  return (
    <PlannerApp
      state={decoded.state}
      user={account.user}
      presets={account.presets}
      onStateChange={setRaid}
    />
  )
}

function PlannerLoading() {
  return (
    <main
      className="route-state"
      aria-busy="true"
      aria-label="Loading raid planner"
    >
      <div className="loading-card">
        <span className="loading-line short" />
        <span className="loading-line title" />
        <span className="loading-line" />
        <div className="loading-grid">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <p>Preparing your raid planner…</p>
      </div>
    </main>
  )
}
