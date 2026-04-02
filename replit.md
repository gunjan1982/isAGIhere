# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### `artifacts/ai-hub` — AI Industry Hub (primary web app)
React + Vite frontend deployed at `/`. Dark terminal aesthetic with electric amber accents.
Tracks people, newsletters, blogs, podcasts, YouTube channels, and communities in the AI industry.
Pages: Home (`/`), People (`/people`), Person Detail (`/people/:id`), Sources (`/sources`), Communities (`/communities`).

### `artifacts/api-server` — Express API
Serves at `/api`. Routes: `/healthz`, `/people`, `/people/:id`, `/sources`, `/communities`, `/stats`, `/featured`.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── ai-hub/             # React + Vite frontend (AI Industry Hub)
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed.ts         # Database seed script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `people` — AI industry figures (godfathers, lab_ceos, hardware, builders, vibe_coders)
- `sources` — Newsletters, blogs, podcasts, YouTube channels, news sites
- `communities` — Reddit subreddits, Discord servers

## Seeding

```bash
pnpm --filter @workspace/scripts run seed
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck; JS bundling is handled by esbuild/vite
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Codegen

Run after editing `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```

## Portability

Designed to be portable. No Replit-proprietary features used.
Can be migrated to Vercel (frontend) + Railway/Render (API) + Neon/Supabase (Postgres).
See `attached_assets/replit-portability_1775107761619.md` for migration checklist.
