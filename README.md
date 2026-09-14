# WoW Forever Planner

A minimal, shareable TBC Classic raid team planner. Build five groups of five,
name every player, move or swap slots with drag-and-drop, and review the
specialization buffs active in each party.

The complete raid composition is encoded in the URL, so copying the URL is
enough to share a setup. Signed-in users can also save named raid presets and
load them later.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
cp .env.example .dev.vars
# Put a 32+ character secret in BETTER_AUTH_SECRET
openssl rand -base64 32
npm run db:migrate:local
npm run dev
```

`.dev.vars` is what Wrangler reads in local development (`BETTER_AUTH_SECRET`
and `BETTER_AUTH_URL=http://localhost:43127`). The development server runs at
[http://localhost:43127](http://localhost:43127).

Password reset emails are sent from `reset@lastminute.technology` through
Google Workspace SMTP. Create that mailbox (or an alias), turn on 2-Step
Verification, generate an [App Password](https://support.google.com/accounts/answer/185833),
and set it as `SMTP_PASSWORD` in `.dev.vars`. For production:

```bash
npx wrangler secret put SMTP_PASSWORD
```

If `SMTP_PASSWORD` is unset, reset requests still succeed but the email is not
sent; the reset URL is written to the server log instead.

Local D1 uses the `DB` binding in `wrangler.jsonc`. Remote D1 is optional: the
checked-in `database_id` is a placeholder until you run
`npx wrangler d1 create raidteamplanner` and replace it.

## Commands

```bash
npm run dev              # Start the development server
npm run db:migrate:local # Apply D1 migrations to the local database
npm run test             # Run state-model tests
npm run test:e2e         # Run the browser interaction test
npm run typecheck        # Check TypeScript
npm run lint             # Run ESLint
npm run check            # Check formatting
npm run build            # Create a production build
```

## Stack

- TanStack Start and file-based TanStack Router
- Better Auth (email and password) on Cloudflare D1
- Drizzle ORM for auth tables and raid presets
- TanStack Form for inline player-name editing
- dnd-kit for pointer, touch, and keyboard drag-and-drop
- Tailwind CSS with shadcn/ui primitives
- Vitest for URL-state, roster-editing, and preset tests
- Playwright for the end-to-end drag, share, and restore flow

Install Playwright's local browser once before running the end-to-end test:

```bash
npx playwright install chromium
```

World of Warcraft and its specialization artwork are trademarks and game assets
of Blizzard Entertainment. This project is not affiliated with or endorsed by
Blizzard Entertainment.
