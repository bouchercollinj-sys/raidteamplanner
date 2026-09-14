# WoW Forever Planner

A minimal, shareable TBC Classic raid team planner. Choose a 10, 20, 25, or
40 player raid team, name every player, move or swap slots with drag-and-drop,
and review the specialization buffs active in each party.

The complete raid composition is encoded in the URL. Copying the URL is all that
is needed to save or share a setup; there is no account, database, or server-side
state.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

The development server runs at [http://localhost:43127](http://localhost:43127).

## Commands

```bash
npm run dev        # Start the development server
npm run test       # Run state-model tests
npm run test:e2e   # Run the browser interaction test
npm run typecheck  # Check TypeScript
npm run lint       # Run ESLint
npm run check      # Check formatting
npm run build      # Create a production build
```

## Stack

- TanStack Start and file-based TanStack Router
- TanStack Form for inline player-name editing
- dnd-kit for pointer, touch, and keyboard drag-and-drop
- Tailwind CSS with shadcn/ui primitives
- Vitest for URL-state and roster-editing tests
- Playwright for the end-to-end drag, share, and restore flow

Install Playwright's local browser once before running the end-to-end test:

```bash
npx playwright install chromium
```

World of Warcraft and its specialization artwork are trademarks and game assets
of Blizzard Entertainment. This project is not affiliated with or endorsed by
Blizzard Entertainment.
