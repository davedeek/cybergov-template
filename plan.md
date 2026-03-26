---
name: unify-saas-starter
overview: Convert the current template into a cohesive single-process TanStack Start SaaS baseline using TanStack client stack + tRPC/Better Auth/Drizzle/SQLite backend with org/workspace multi-tenancy and no billing in v1.
todos: []
isProject: false
---

# Single SaaS Starter Unification Plan

## Target Outcome

Ship one cohesive TanStack Start app where:

- Client state/data/UI uses TanStack libraries consistently.
- Server concerns (auth, API, DB) run in the same Node process.
- Multi-tenant org/workspace foundations (members + roles) are first-class.
- No billing logic is included in v1.

## Current Foundation to Keep

- Existing Start + SSR wiring in `[/Users/derardeek/Development/cybergov-template/src/router.tsx](/Users/derardeek/Development/cybergov-template/src/router.tsx)` and `[/Users/derardeek/Development/cybergov-template/src/routes/__root.tsx](/Users/derardeek/Development/cybergov-template/src/routes/__root.tsx)`.
- Existing API endpoints in `[/Users/derardeek/Development/cybergov-template/src/routes/api.trpc.$.tsx](/Users/derardeek/Development/cybergov-template/src/routes/api.trpc.$.tsx)` and `[/Users/derardeek/Development/cybergov-template/src/routes/api/auth/$.js](/Users/derardeek/Development/cybergov-template/src/routes/api/auth/$.js)`.
- Existing Drizzle baseline in `[/Users/derardeek/Development/cybergov-template/src/db/index.ts](/Users/derardeek/Development/cybergov-template/src/db/index.ts)`, `[/Users/derardeek/Development/cybergov-template/src/db/schema.ts](/Users/derardeek/Development/cybergov-template/src/db/schema.ts)`, and `[/Users/derardeek/Development/cybergov-template/drizzle.config.ts](/Users/derardeek/Development/cybergov-template/drizzle.config.ts)`.

## Architecture (Unified)

```mermaid
flowchart LR
  browserClient[BrowserClient] -->|tanstack db collections| tanstackDB[TanStackDB]
  tanstackDB -->|trpc transport| trpcRoute[/api/trpc/*]
  tanstackDB -->|tanstack query (under the hood)| tanstackQuery[TanStackQuery]
  browserClient -->|better-auth client| authRoute[/api/auth/*]
  trpcRoute --> trpcContext[tRPCContext]
  trpcContext --> authSession[BetterAuthSession]
  trpcContext --> drizzleDB[DrizzleDB]
  authRoute --> betterAuthCore[BetterAuthCore]
  betterAuthCore --> drizzleDB
  drizzleDB --> sqliteDB[(SQLite)]
```



## Implementation Phases

### 1) Normalize backend boundaries and shared context

- Create a single server context module used by tRPC procedures (db + session + request metadata).
- Add `protectedProcedure` middleware in tRPC init layer for authenticated operations.
- Ensure auth session lookup is available consistently from both route handlers and tRPC context.

Primary files:

- `[/Users/derardeek/Development/cybergov-template/src/integrations/trpc/init.js](/Users/derardeek/Development/cybergov-template/src/integrations/trpc/init.js)`
- `[/Users/derardeek/Development/cybergov-template/src/integrations/trpc/router.js](/Users/derardeek/Development/cybergov-template/src/integrations/trpc/router.js)`
- `[/Users/derardeek/Development/cybergov-template/src/routes/api.trpc.$.tsx](/Users/derardeek/Development/cybergov-template/src/routes/api.trpc.$.tsx)`
- `[/Users/derardeek/Development/cybergov-template/src/lib/auth.js](/Users/derardeek/Development/cybergov-template/src/lib/auth.js)`

### 2) Replace demo persistence with SaaS data model (org baseline)

- Expand Drizzle schema from `todos` demo to include:
  - `users` (if not fully owned by Better Auth adapter),
  - `organizations`,
  - `organization_memberships` (role enum: owner/admin/member),
  - optional `invitations`.
- Keep a small app domain entity (e.g., `projects` or `todos`) scoped by `organizationId` for multitenant CRUD.
- Generate and apply migrations; add a deterministic seed script for local dev.

Primary files:

- `[/Users/derardeek/Development/cybergov-template/src/db/schema.ts](/Users/derardeek/Development/cybergov-template/src/db/schema.ts)`
- `[/Users/derardeek/Development/cybergov-template/src/db/index.ts](/Users/derardeek/Development/cybergov-template/src/db/index.ts)`
- `[/Users/derardeek/Development/cybergov-template/drizzle.config.ts](/Users/derardeek/Development/cybergov-template/drizzle.config.ts)`
- `[/Users/derardeek/Development/cybergov-template/package.json](/Users/derardeek/Development/cybergov-template/package.json)` (scripts for seed/migrate flow)

### 3) Build tenant-aware tRPC API surface

- Refactor demo routers into cohesive domains:
  - `organization` router (create/select/list memberships),
  - tenant-scoped app router (CRUD by active org),
  - `me` router (session/profile).
- Enforce org authorization in all tenant-scoped procedures.
- Keep all writes/reads Drizzle-backed (remove in-memory state).

Primary files:

- `[/Users/derardeek/Development/cybergov-template/src/integrations/trpc/router.js](/Users/derardeek/Development/cybergov-template/src/integrations/trpc/router.js)`
- `[/Users/derardeek/Development/cybergov-template/src/integrations/trpc/react.js](/Users/derardeek/Development/cybergov-template/src/integrations/trpc/react.js)`

### 4) Route protection and app-shell unification

- Introduce an authenticated layout route (file-based) for all SaaS pages.
- Use route `beforeLoad` to gate protected sections and redirect unauthenticated users.
- Keep public auth routes separate (signin/signup).
- Add an org-switch context in route/search state and wire it to data loaders/query keys.

Primary files:

- `[/Users/derardeek/Development/cybergov-template/src/routes/__root.tsx](/Users/derardeek/Development/cybergov-template/src/routes/__root.tsx)`
- New app/auth route files under `[/Users/derardeek/Development/cybergov-template/src/routes](/Users/derardeek/Development/cybergov-template/src/routes)`

### 5) TanStack client-layer cohesion

- Standardize data flow to: `TanStack DB` collections as the primary client-side data API, backed by `TanStack Query` via `@tanstack/query-db-collection`, with `tRPC` as the transport.
- Use TanStack Query hooks directly only for edge cases that are not a good fit for collections (e.g. one-off actions, uploads, non-collection-shaped responses).
- Introduce shared query key + invalidation conventions.
- Add a baseline table/form stack (TanStack Table + Form) on one tenant-scoped resource to demonstrate canonical usage.

Primary files:

- `[/Users/derardeek/Development/cybergov-template/src/integrations/trpc/react.js](/Users/derardeek/Development/cybergov-template/src/integrations/trpc/react.js)`
- Feature route/component files in `[/Users/derardeek/Development/cybergov-template/src/routes](/Users/derardeek/Development/cybergov-template/src/routes)`

### 6) Environment and runtime hardening

- Add strict env parsing/validation for required server vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
- Separate server-only env helpers from client-safe config.
- Add startup checks to fail fast in dev/prod.

Primary files:

- New env utility module(s) under `[/Users/derardeek/Development/cybergov-template/src](/Users/derardeek/Development/cybergov-template/src)`
- `[/Users/derardeek/Development/cybergov-template/.env.local](/Users/derardeek/Development/cybergov-template/.env.local)` (example updates)

### 7) Starter quality bar (v1)

- Add minimal tests:
  - auth session check,
  - protected tRPC procedure access,
  - tenant data isolation.
- Add concise docs for local setup, migration/seed flow, and architecture conventions.

Primary files:

- test files under project test locations
- root docs (e.g., `README`) and/or internal starter docs

## Deliverables

- Unified single-process SaaS template with:
  - working Better Auth flows,
  - org + membership model,
  - tenant-scoped CRUD via tRPC + Drizzle + SQLite,
  - protected route layout and coherent TanStack client usage,
  - migration/seed/test baseline.

## Out of Scope (explicit)

- Billing integrations (Stripe checkout/webhooks/entitlements runtime).
- Multi-service split architecture.
- Non-Node deployment targets in v1.

