# CyberGov — LLM Development Guide
 
## Project Overview
 
CyberGov is a Work Simplification SaaS application that digitizes the 1940s Bureau of Budget program. It provides two core tools for middle managers:
 
1. **Work Distribution Chart (WDC)** — maps who does what across a team, with hours/week
2. **Process Chart** — documents step-by-step work processes using four symbols: Operation (⬤), Transportation (○), Storage (△), Inspection (□)
 
Target users: first-line supervisors managing 3–10 people in government, utilities, healthcare, and nonprofits.
 
## Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (Vite + Nitro SSR) |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Data Layer | **TanStack DB** (reactive collections + `useLiveQuery`) |
| API | tRPC v11 with superjson transformer |
| Auth | Better Auth with credential provider + Drizzle adapter |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| UI | shadcn/ui + Tailwind CSS v4 + Radix UI primitives |
| AI | Vercel AI SDK (Anthropic, OpenAI, Gemini, Ollama) |
| Testing | Vitest with in-memory SQLite |
 
## Architecture
 
Single-process: frontend (TanStack Router) and backend (tRPC, Better Auth, Drizzle) run in the same Node process.
 
```
Browser → TanStack Router (SSR + SPA)
  ├── /api/trpc/*  → tRPC procedures → Drizzle → SQLite
  └── /api/auth/*  → Better Auth    → Drizzle → SQLite
```
 
### Path Alias
 
`@/` resolves to `./src/` (configured in `vite.config.ts`).
 
## Folder Structure
 
```
src/
├── __tests__/            # Vitest tests & setup
├── components/           # UI components including AppShell
├── db/
│   ├── schema.ts         # All Drizzle table definitions
│   ├── index.ts          # DB instance creation
│   └── seed.ts           # Demo data seed script
├── integrations/
│   ├── trpc/
│   │   ├── init.ts       # Procedure definitions (public/protected/orgScoped)
│   │   ├── router.ts     # Root appRouter merging sub-routers
│   │   ├── context.ts    # Per-request context (req, db, session, user)
│   │   └── routers/      # Domain sub-routers (ws.ts, share.ts)
│   └── ai/               # AI SDK hooks and utilities
├── lib/
│   ├── auth.ts           # Better Auth server config
│   └── env.ts            # Environment validation
├── routes/
│   ├── __root.tsx         # Root route with providers, fonts, devtools
│   ├── _authed.tsx        # Auth guard layout (beforeLoad session check)
│   ├── _authed/           # Protected routes (dashboard, todos, settings, ws/)
│   ├── api/auth/$.ts      # Better Auth catch-all endpoint
│   └── api.trpc.$.tsx     # tRPC catch-all endpoint
└── router.tsx             # Router instance creation
```
 
## Database Schema
 
Defined in `src/db/schema.ts` with three sections:
 
### Better Auth Tables
`users`, `sessions`, `accounts`, `verifications` — managed by Better Auth adapter.
 
### Application Tables
- `organizations` — tenant entities with name, slug
- `organizationMemberships` — links users to orgs with role enum (owner/admin/member)
- `invitations` — pending org invites
- `todos` — sample tenant-scoped CRUD entity
 
### Domain Tables (Work Simplification)
- `wdcCharts` — Work Distribution Charts scoped to org
- `wdcEmployees` — team members on a WDC
- `wdcActivities` — work categories on a WDC
- `wdcTasks` — individual tasks linking employee + activity with hours
- `processCharts` — Process Charts scoped to org
- `processSteps` — steps with symbol type (operation/transportation/storage/inspection), sequence, time/distance
- `stepAnnotations` — "Why" annotations on process steps
- `proposedChanges` — before/after improvement proposals
 
All domain tables use `organizationId` foreign key for tenant isolation. Timestamps use `integer` mode with `sql\`(unixepoch())\``.
 
## tRPC Procedure Stack
 
Three middleware levels in `src/integrations/trpc/init.ts`:
 
1. **`publicProcedure`** — no auth required
2. **`protectedProcedure`** — requires valid session (extends public)
3. **`orgScopedProcedure`** — requires org membership, injects `organizationId` into context (extends protected)
 
Sub-routers in `src/integrations/trpc/router.ts`:
- `me` — session/profile
- `organization` — create/list/manage orgs and memberships
- `todos` — sample tenant-scoped CRUD
- `ws` — Work Simplification domain (WDC + Process Chart CRUD)
- `share` — public read-only sharing

## Data Layer (TanStack DB)

CyberGov uses **TanStack DB** for a reactive, local-first data experience. Instead of raw `useQuery`, most data-fetching views use collections defined in `src/db-collections/index.ts`.

### How it Works (tRPC + React Query + TanStack DB)

The data layer is built as a three-tier stack:

1.  **tRPC (The Pipe)**: Defines the API endpoints and data fetchers. We use dedicated `list` procedures (e.g., `ws.processChart.listSteps`) that return simple arrays, which are compatible with TanStack DB collections.
2.  **React Query (The Cache)**: Acts as the underlying storage. Every TanStack DB collection is mapped to a React Query `queryKey`. When a collection is queried, it checks this cache first.
3.  **TanStack DB (The Reactive Observer)**: Sits on top of the React Query cache. It provides "live" collections that components can subscribe to via `useLiveQuery`.

### Key Patterns

- **Reactivity**: `useLiveQuery` hooks automatically synchronize the UI when the underlying cache is invalidated.
- **Cache Isolation**: To prevent infinite render loops, collection queries use unique keys (backed by dedicated `list` procedures) that are distinct from the full-object metadata queries.
- **Instant Sync**: When a mutation occurs (e.g., `addStep`), we invalidate both the main object query and the specific list collection query. This triggers an immediate background refetch and UI update.

```tsx
// src/db-collections/index.ts
const queryOptions = trpc.ws.processChart.listSteps.queryOptions({ ... })

return createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: queryOptions.queryKey,
    queryFn: (ctx) => queryOptions.queryFn(ctx),
    getKey: (step) => step.id,
  })
)
```

```tsx
// UI Component usage
const stepsCollection = useStepsCollection(orgId, pcId)
const { data: steps = [] } = useLiveQuery(
  (q) => q.from({ step: stepsCollection }).select(({ step }) => step),
  [stepsCollection]
)
```
 
## Auth Flow
 
- Better Auth with credential provider configured in `src/lib/auth.ts`
- Uses `tanstackStartCookies()` plugin for cookie-based sessions
- Auth guard in `src/routes/_authed.tsx` uses `beforeLoad` to check session via tRPC `me.getSession`, redirects to `/signin` if unauthenticated
- All authenticated routes live under `src/routes/_authed/`
 
## How to Add a New Feature
 
1. **Schema**: Add tables to `src/db/schema.ts`, run `npx drizzle-kit push`
2. **tRPC Router**: Add procedures in `src/integrations/trpc/routers/`. Use `orgScopedProcedure` and create dedicated `list` procedures for collection entities.
3. **Collection**: Define a new hook in `src/db-collections/index.ts` using `createCollection` and `queryCollectionOptions`.
4. **Route**: Create `.tsx` in `src/routes/_authed/` and use `useLiveQuery` with your new collection.
5. **Mutation**: Ensure mutations use `invalidateQueries` on both the main object and the list collection.
 
## Key Commands
 
```bash
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Production build
npm run test             # Run Vitest tests
 
npx drizzle-kit push     # Push schema to local SQLite
npx drizzle-kit generate # Generate migration files
npx drizzle-kit migrate  # Run migrations
npx drizzle-kit studio   # Open Drizzle Studio GUI
 
# Seed demo data
node --env-file=.env.local --import tsx src/db/seed.ts
```
 
## Environment Variables
 
See `.env.example`. Required:
- `DATABASE_URL` — SQLite file path (default: `dev.db`)
- `BETTER_AUTH_URL` — App URL (default: `http://localhost:3000`)
- `BETTER_AUTH_SECRET` — Auth secret (generate with `npx @better-auth/cli secret`)
 
Optional AI keys: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OLLAMA_BASE_URL`
 
## Visual Design Direction
 
"New Deal Utilitarian" — inspired by 1940s government documents. Key tokens:
 
```
--bg:           #F5F0E8   (warm off-white / aged paper)
--ink:          #1A1A18   (near-black)
--accent:       #C94A1E   (WPA burnt orange)
--border:       #C8C3B4
```
 
Typography: Bitter (headings), IBM Plex Mono (data/labels), system sans-serif (UI).
Process chart symbols are clean geometric SVGs, not icon library glyphs.
 
## Domain Reference
 
The full product design document is at `projectdocs/worksimplification_design_docs.md`. It covers target users, all 5 features, data models, UX principles, and MVP scope.
 
## Testing
 
Tests use in-memory SQLite for fast isolation:
```bash
npm run test
```
 
Test files live in `src/__tests__/`. The setup creates a fresh DB per test suite.
 
## Conventions
 
- File-based routing: route files auto-generate `routeTree.gen.ts`
- All tenant-scoped data must use `orgScopedProcedure` and filter by `organizationId`
- Prefer editing existing files over creating new ones
- Do not add unnecessary abstractions, comments, or type annotations to unchanged code