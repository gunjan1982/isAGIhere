# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Auth**: Clerk (email + Google OAuth, proxy via `/__clerk`)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### `artifacts/ai-hub` — AI Industry Hub (primary web app)
React + Vite frontend deployed at `/`. Dark terminal aesthetic with electric amber accents.
Tracks people, newsletters, blogs, podcasts, YouTube channels, and communities in the AI industry.
Pages: Home (`/`), People (`/people`), Person Detail (`/people/:id`), Sources (`/sources`), Communities (`/communities`), Feed (`/feed`), Learn (`/learn`), AGI Tracker (`/agi`), My Hub (`/my-hub`), Analytics (`/analytics`), Search (`/search`), Admin (`/admin`).
- **Search**: Full-text search across people, sources, communities, and news feed
- **Comments**: Anonymous commenting on person profiles (name+email only, no account needed) with threaded replies
- **Submissions**: Community can suggest people/sources/communities for review via "SUGGEST_" buttons on people/sources pages
- **SEO**: `useSeo` hook for per-page title + OG meta tags on key pages
- **Admin**: `/admin` panel includes submissions review with approve/reject

### `artifacts/api-server` — Express API
Serves at `/api`. Routes: `/healthz`, `/people`, `/people/:id`, `/sources`, `/communities`, `/stats`, `/featured`, `/feed`, `/feed/refresh`, `/people/:id/feed`, `/search`, `/comments`, `/submissions`.

## Live Feed System

- RSS fetcher (`artifacts/api-server/src/lib/rss-fetcher.ts`) fetches Google News RSS per person + curated source feeds.
- `feed_items` table stores articles with: personId (nullable), title, url, description, sourceName, publishedAt, type.
- Feed refreshes on server startup, then every 30 minutes.
- POST `/api/feed/refresh` triggers a manual refresh.
- Frontend: `FeedCard` component, global `/feed` page with pagination, person-level feed in profile pages, feed preview on homepage.

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
- `feed_items` — Live news items fetched from RSS/Google News per tracked person

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
