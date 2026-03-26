# CyberGov — SaaS Starter Template

A unified, single-process, full-stack SaaS starter template built with [TanStack Start](https://tanstack.com/start).

## Features

- **Auth**: Built-in credential authentication via [Better Auth](https://better-auth.com/) backed by Drizzle SQLite adapter.
- **Database**: SQLite data persistence using [Drizzle ORM](https://orm.drizzle.team/).
- **Multi-Tenancy**: Built-in tenant isolation with `organizationMemberships`.
- **API**: End-to-end type-safe RPC via [tRPC](https://trpc.io/) and `orgScopedProcedure` middleware.
- **Client Cache**: Unified data fetching and optimistic updates via [TanStack Query](https://tanstack.com/query).
- **Navigation**: Full type-safe routing, layout guards, search parsing, and SSR rendering via [TanStack Router](https://tanstack.com/router).
- **AI Integration**: Out-of-the-box support for Vercel AI SDK, structured LLM outputs, image generation, Whisper transcription, and TTS.
- **UI & Layout**: Mobile-responsive `AppShell`, Lucide react icons, and built-in components (Dashboard, Settings, Profile, Todos).
- **Testing**: Pre-configured for `vitest` with fast in-memory database tooling.

## Prerequisites

- Node.js 20+
- `npm` or `pnpm`

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Generate your BETTER_AUTH_SECRET inside .env.local
   # (npx @better-auth/cli secret)
   ```

3. **Initialize the local database**
   ```bash
   # Push schema to SQLite DB
   npx drizzle-kit push
   
   # Run the seed script to create a demo organization and user
   node --env-file=.env.local --import tsx src/db/seed.ts
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Architecture

**Single-Process execution**: Both the frontend (TanStack Router) and the backend (tRPC, API endpoints, Drizzle) run inside the same Node process (via Vite/Vinz in dev, or a standard Node server in prod). 

### Folder Structure

```
.
├── drizzle/                  # Drizzle ORM migrations
├── src/
│   ├── __tests__/            # Vitest integration tests & setup
│   ├── components/           # Reusable UI components including `AppShell`
│   ├── db/                   # Drizzle schema, instance creation, seed script
│   ├── integrations/         # tRPC setup, Better Auth, AI hooks
│   ├── lib/                  # Utilities (env validation, globals)
│   ├── router.tsx            # Global TanStack Router definition
│   └── routes/               # File-based routing (pages & api routes)
│       ├── _authed.tsx       # Authentication guard layout
│       ├── _authed/          # Authenticated routes (dashboard, todos, settings)
│       ├── api/auth/         # Better Auth POST/GET endpoints
│       └── api.trpc.$.tsx    # Universal tRPC endpoint
├── .env.local                # Local secrets (Database URL, AI Keys)
└── drizzle.config.ts         # Drizzle CLI mappings
```

## Creating new features

1. **Schema**: Add your new tables to `src/db/schema.ts` and run `npx drizzle-kit migrate` (or `drizzle-kit push` locally).
2. **tRPC Router**: Create a new procedure or sub-router in `src/integrations/trpc/router.ts`. Use `orgScopedProcedure` if the entity is tenant-isolated.
3. **Route**: Create a new `.tsx` file inside `src/routes/_authed/` (if it requires login) and `npm run dev` to let the router auto-generate bindings.
4. **Client code**: Use `const trpc = useTRPC()` to fire mutations or the standard `@tanstack/react-query` to execute queries!

## Testing

Run tests against the isolated in-memory DB:
```bash
npm run test
```
