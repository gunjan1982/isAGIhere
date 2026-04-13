# isAGIhere — Project Context
Last updated: 2026-04-13

## What This Is
isagihere.wiki is an AI industry hub — a single interface for tracking the people, content, sources, and communities driving AI forward. It aggregates news feeds, YouTube interviews, and community signals around the key figures in AI (Godfathers, Lab CEOs, Hardware, Builders, Vibe Coders). The target audience is AI enthusiasts, practitioners, and anyone trying to stay at the frontier without drowning in noise.

## Client / Owner
Gunjan Arora (gunjan1982@gmail.com) — sole owner and admin. Presents to no external client. Cares most about accuracy, freshness of content, and a clean terminal-aesthetic UI that feels credible to a technical audience.

## Core Output
A live, auto-refreshing intelligence stream that surfaces the most relevant AI developments — especially YouTube interviews from key figures, news, and community signals — with AI-generated summaries, so users never have to leave the site to stay informed.

## Key Domain Concepts
| Term | Meaning |
|------|---------|
| People | Tracked AI figures. Five categories: GODFATHERS, LAB_CEOS, HARDWARE, BUILDERS, VIBE_CODERS |
| Feed Items | News/articles fetched via RSS from 40+ sources, linked to a person or general source |
| Interviews | YouTube videos from tracked people's own channels or featured on interview channels |
| Sources | Newsletters, podcasts, blogs, YouTube channels curated as high-signal AI content |
| Communities | Discord servers, Reddit subs, X lists in the AI space |
| Spotlight | Boolean flag on a person — shows them in the home page hero strip |
| High Signal | Boolean flag on a source — surfaced in sidebar on home page |
| My Hub | Authenticated user's personalised dashboard: followed people/sources/communities + custom feeds |
| MY AI Journey | Phase 2 community feature: users log AI tool usage and frontier model reviews |
| Submissions | Community-submitted proposals for new people/sources/communities, pending admin approval |

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, TypeScript, Tailwind CSS, shadcn/Radix UI, TanStack Query, Wouter routing |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | PostgreSQL 16, Drizzle ORM, drizzle-zod for schema validation |
| Auth | Clerk (email + Google OAuth), proxied via `/__clerk` |
| Monorepo | pnpm workspaces (NEVER use npm or yarn in this project) |
| Email | Resend — weekly digest + comment reply notifications |
| Logging | Pino |
| Build | esbuild (API), Vite (frontend) |
| API types | OpenAPI spec → Orval codegen → typed React Query hooks in `lib/api-client-react/` |
| Deployment | Replit (primary), portable to Vercel + Railway/Render + Neon |

## Repo Structure
```
isAGIhere/
├── artifacts/
│   ├── ai-hub/                # React + Vite frontend (all pages, components)
│   │   └── src/
│   │       ├── pages/         # One file per route
│   │       ├── components/    # Shared UI components
│   │       ├── data/          # Static data (AGI predictions, constants)
│   │       └── lib/           # Hooks, utilities (useSeo, useAnalytics, agi.ts)
│   └── api-server/            # Express API server
│       └── src/
│           ├── routes/        # One file per route group (16 route files)
│           ├── lib/           # Services: rss-fetcher, youtube-fetcher, email, etc.
│           └── middlewares/   # Clerk proxy middleware
├── lib/
│   ├── db/src/schema/         # Drizzle ORM table definitions (source of truth for DB)
│   ├── api-zod/               # Generated Zod schemas (from OpenAPI spec via Orval)
│   ├── api-spec/              # openapi.yaml — edit this to add new typed routes
│   └── api-client-react/      # Generated React Query hooks (DO NOT edit manually)
├── scripts/src/seed.ts        # Database seeding — adds initial people, sources, communities
├── docs/                      # This documentation system
├── v1/status.md               # Session log for deployed v1 platform work
├── v2/status.md               # Session log for AGI v2.0 feature work
├── CLAUDE.md                  # Hard rules for Claude Code (project-level)
├── AGI v2.0.md                # Feature spec for v2.0 (Copilot implementation guide)
└── replit.md                  # Replit-specific workspace notes
```

## Standing Rules
1. **Always use pnpm.** Never `npm install` or `yarn`. Use `pnpm add --filter @workspace/[package]` to add deps.
2. **Never edit `lib/api-client-react/` directly.** It is generated. Run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`.
3. **Run migrations after every schema change.** `pnpm --filter @workspace/db run generate` then `pnpm --filter @workspace/db run migrate`.
4. **Admin-only routes check email against `gunjan1982@gmail.com`.** Do not change this hardcoded check without explicit instruction.
5. **`scripts/src/seed.ts` is destructive** — it truncates tables. Never run in production without explicit instruction.
6. **Never fabricate data.** If a computation fails, stop and report. Never substitute placeholder values silently.
7. **Design language:** terminal/cyberpunk aesthetic — `font-mono`, SCREAMING_SNAKE_CASE labels, `bg-secondary`, `border-border`, electric amber accents. Match existing component style exactly.

## Where To Go Next
| Task | Read |
|------|------|
| Add a new page or route | `artifacts/ai-hub/src/App.tsx` (routes), `artifacts/ai-hub/src/components/layout.tsx` (nav) |
| Add a new API endpoint | `artifacts/api-server/src/routes/` (create new file, register in `index.ts`) |
| Change DB schema | `lib/db/src/schema/[table].ts` → run generate + migrate |
| Understand current v2.0 build state | `docs/TECH_CONTEXT.md` → Active Workstreams table |
| Pick up where last session left off | `v2/status.md` (last block) |
| Understand what's already built | `docs/TECH_CONTEXT.md` → Key Functions table |
| Find a bug pattern seen before | `docs/precedents/` |
