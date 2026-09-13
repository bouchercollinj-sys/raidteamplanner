# WoW Forever Planner

A minimal, shareable TBC Classic raid team planner. Build five groups of five,
name every player, move or swap slots with drag-and-drop, and review the
specialization buffs active in each party.

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

World of Warcraft and its specialization artwork are trademarks and game assets
of Blizzard Entertainment. This project is not affiliated with or endorsed by
Blizzard Entertainment.
