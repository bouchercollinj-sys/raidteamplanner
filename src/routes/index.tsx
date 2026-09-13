import { createFileRoute } from '@tanstack/react-router'

import { RaidPlanner } from '#/components/raid-planner'
import { Button } from '#/components/ui/button'
import {
  decodeRaid,
  encodeRaid,
  isRaidEmpty,
  type RaidState,
} from '#/lib/raid-state'

type PlannerSearch = {
  raid?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): PlannerSearch => ({
    raid: typeof search.raid === 'string' ? search.raid : undefined,
  }),
  pendingComponent: PlannerLoading,
  component: PlannerRoute,
})

function PlannerRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const decoded = decodeRaid(search.raid)

  const setRaid = (state: RaidState) => {
    void navigate({
      search: isRaidEmpty(state) ? {} : { raid: encodeRaid(state) },
      replace: true,
      resetScroll: false,
    })
  }

  if (!decoded.ok) {
    return (
      <main className="route-state">
        <div className="route-state-card" role="alert">
          <span className="brand-mark" aria-hidden="true">
            WF
          </span>
          <p className="eyebrow">Shared setup error</p>
          <h1>We could not open this roster.</h1>
          <p>{decoded.message}</p>
          <Button
            type="button"
            onClick={() => {
              void navigate({ search: {}, replace: true })
            }}
          >
            Start a fresh raid
          </Button>
        </div>
      </main>
    )
  }

  return <RaidPlanner state={decoded.state} onStateChange={setRaid} />
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
