# QuickBiz ERP

A modular, multi-tenant ERP platform. This is the **foundation build**: platform core, tenancy,
authentication, RBAC, module-activation architecture, billing/plan structure, design system, and
a dashboard shell — all reading and writing a real local Postgres database through Supabase, with
Row Level Security enforcing tenant isolation. No business modules (Sales, Inventory, POS, ...)
ship yet; the Module Store shows the real catalog they'll plug into.

## Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4, hand-built
  component library (no UI framework)
- **Backend**: Supabase (PostgreSQL, Auth, Storage), Row Level Security, SQL functions for
  privileged operations (org creation, invitations, permission checks)
- **Monorepo**: pnpm workspaces — `apps/web` (the Next.js app), `packages/supabase` (typed
  Supabase clients), `packages/config` (shared TypeScript config)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- [Supabase CLI](https://supabase.com/docs/guides/cli) (invoked here via `npx supabase`, no
  separate install required)

## Getting started

```bash
pnpm install

# Boots local Postgres, Auth, Storage, Studio in Docker
pnpm db:start

# Applies every migration in supabase/migrations, then supabase/seed.sql
pnpm db:reset

# Generates apps/web-visible TypeScript types from the live schema
pnpm db:types

# Copy env template and fill in the anon/service-role keys printed by `pnpm db:start`
cp .env.example apps/web/.env.local

pnpm dev
```

Open http://localhost:4000 (this project is pinned to port 4000, not the usual 3000, since this
machine runs several projects at once). Sign up to create your own organization, or sign in with the seeded
demo account:

- **Email**: `demo@quickbiz.local`
- **Password**: `Demo1234!`
- **Org**: Demo Company (Pvt) Ltd — Head Office (Harare) + Bulawayo Branch

Supabase Studio (inspect the database directly) is at http://127.0.0.1:54323 while `pnpm db:start`
is running.

## Project structure

```
supabase/
  migrations/     one file per schema change, applied in order
  seed.sql        local/demo data only — never run against staging or production
packages/
  supabase/       typed browser/server/service-role Supabase clients + generated DB types
  config/         shared tsconfig base
apps/web/
  src/app/        Next.js routes — (auth) for login/signup, (dashboard) for the authenticated shell
  src/components/ shared UI primitives (Button, Modal, DataTable pieces, Sidebar, TopBar, ...)
  src/services/   domain logic wrapping Supabase queries, reused by Server Components and Server Actions
  src/lib/        session/permission helpers
  src/config/     design tokens, nav registry
```

## Database changes

Every schema change is a new file in `supabase/migrations/`, numbered sequentially. Never edit
the Supabase dashboard directly — the migrations are the source of truth. After adding a
migration:

```bash
pnpm db:reset   # re-applies everything from scratch, including seed.sql
pnpm db:types   # keeps apps/web's TypeScript types in sync with the schema
```

## What's real vs. not yet built

Everything in this build talks to real Postgres tables through RLS-enforced queries — there is no
mock data or fake success state. What's genuinely out of scope for this pass, and honestly marked
as such in the UI:

- Business modules (Sales, Inventory, POS, Finance, HR, ...) — the Module Store shows the real
  catalog and activation architecture, but every "Install" action is disabled rather than faked.
- Payment collection / billing checkout — the plan/subscription data model exists
  (`plans`, `plan_modules`, `org_subscriptions`), but no payment gateway is wired up yet, so plan
  changes are staff-assisted, not self-serve.
- Custom field builder UI, workflow engine, integration hub — schema/architecture only.
