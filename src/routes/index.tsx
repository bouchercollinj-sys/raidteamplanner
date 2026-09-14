import { createFileRoute } from '@tanstack/react-router'

import { RaidPlanner } from '#/components/raid-planner'
import { Button } from '#/components/ui/button'
import {
  DEFAULT_RAID_SIZE,
  decodeRaid,
  encodeRaid,
  getRaidSize,
  isRaidEmpty,
  parseRaidSize,
} from '#/lib/raid-state'
import type { RaidSize, RaidState } from '#/lib/raid-state'

type PlannerSearch = {
  raid?: string
  size?: RaidSize
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): PlannerSearch => {
    const size = parseRaidSize(search.size)

    return {
      raid: typeof search.raid === 'string' ? search.raid : undefined,
      size: size === DEFAULT_RAID_SIZE ? undefined : size,
    }
  },
  pendingComponent: PlannerLoading,
  component: PlannerRoute,
})

function PlannerRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const raidSize = parseRaidSize(search.size)
  const decoded = decodeRaid(search.raid, raidSize)

  const setRaid = (state: RaidState) => {
    const size = getRaidSize(state)

    void navigate({
      search: {
        raid: isRaidEmpty(state) ? undefined : encodeRaid(state),
        size: size === DEFAULT_RAID_SIZE ? undefined : size,
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
              void navigate({
                search: { raid: undefined, size: undefined },
                replace: true,
              })
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
