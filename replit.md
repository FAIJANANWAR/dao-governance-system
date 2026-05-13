# Nexus DAO Governance System

A full-stack DAO governance platform built as a Web3 portfolio project. Token-weighted voting, treasury management, and on-chain proposal lifecycle — all in a dark cyberpunk UI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/dao-governance run dev` — run the frontend (port 22415)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite libs (run before api-server typecheck after schema changes)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn/ui + Framer Motion + Wouter + Recharts
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dao-governance/` — React frontend app
  - `src/pages/` — landing, dashboard, proposal-detail, create-proposal, treasury, members
  - `src/components/layout.tsx` — nav + global layout
  - `src/index.css` — cyberpunk dark theme (glassmorphism, neon glows)
- `artifacts/api-server/` — Express API
  - `src/routes/` — proposals, members, treasury, activity, analytics
  - `src/utils/serialize.ts` — DB row coercion (numeric strings→numbers, Dates→ISO strings)
- `lib/db/src/schema/` — Drizzle ORM table definitions (proposals, votes, members, etc.)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-zod/src/generated/` — Zod request/response schemas (auto-generated)
- `lib/api-client-react/src/generated/` — React Query hooks (auto-generated)

## Architecture decisions

- **Contract-first**: All API shapes defined in OpenAPI spec → codegen produces Zod schemas and React Query hooks. Never hand-write these.
- **Serialize utility**: Drizzle returns PostgreSQL `numeric` columns as strings and `timestamp` as Date objects. `src/utils/serialize.ts` handles coercion before Zod response parsing.
- **Always-dark**: Dark mode is forced via `dark` class on `<html>` in App.tsx useEffect.
- **Mock wallet**: `0x7A4b...9C21` is used as the simulated connected wallet for voting, comments, and delegation — no actual Web3 connection needed.
- **Wouter routing**: Link renders as `<a>` natively — do NOT wrap Link in an `<a>` tag.

## Product

- **Landing**: Hero page with live stats, feature overview, and proposal lifecycle timeline
- **Dashboard**: Stats, filterable/searchable proposals list with vote bars, live activity feed
- **Proposal Detail**: Full description, on-chain actions, animated vote breakdown, voter list, comment thread with posting, vote casting sidebar
- **Create Proposal**: 3-step form (details → review → submit) with action builder and voting duration selector
- **Treasury**: Asset allocation pie chart + holdings bars + transaction history
- **Members**: Member grid with voting power bars, role badges, stats, delegate button

## Gotchas

- After editing `lib/db/src/schema/index.ts`, run `pnpm run typecheck:libs` before running `api-server` typecheck
- PostgreSQL `numeric` → string, `timestamp` → Date: always wrap DB results in `serializeRow()`/`serializeRows()` before Zod parse
- `pnpm --filter @workspace/dao-governance run typecheck` (not `build`) for frontend verification
- Orval codegen: do not edit generated files in `lib/api-zod/src/generated/` or `lib/api-client-react/src/generated/`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
