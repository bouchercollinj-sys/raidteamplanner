# justraidplanner

A shareable WoW - Forever raid team planner. Choose a 10, 20, 25, or 40 player
raid team, name every player, move or swap slots with drag-and-drop, and review
the specialization buffs active in each party.

Anyone can copy a URL that encodes the current roster. Signed-in users can also
save named raid presets to the justraidplanner Cloudflare D1 database and share
a short `/p/...` link.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
cp .dev.vars.example .dev.vars
npm install
npm run dev
```

The development server runs at [http://localhost:43127](http://localhost:43127)
and uses a local D1 database through Wrangler.

## Cloudflare D1

Create the production database for this Workers project, then put the id in
`wrangler.jsonc`:

```bash
npx wrangler login
npx wrangler d1 create justraidplanner
npx wrangler secret put BETTER_AUTH_SECRET
npm run deploy
```

Auth tables are created on first request. Raid presets use
`migrations/0001_raid_presets.sql`. Apply that file to the remote database if
you want to provision it before the first save:

```bash
npx wrangler d1 execute justraidplanner --remote --file=./migrations/0001_raid_presets.sql
```

## Commands

```bash
npm run dev             # Start the development server
npm run test            # Run state-model tests
npm run test:e2e        # Run the browser interaction test
npm run typecheck       # Check TypeScript
npm run lint            # Run ESLint
npm run check           # Check formatting
npm run build           # Create a production build
npm run deploy          # Build and deploy to Cloudflare Workers
```

## Stack

- TanStack Start and file-based TanStack Router
- Better Auth for email/password sign-in
- Cloudflare D1 for users, sessions, and saved raid presets
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
