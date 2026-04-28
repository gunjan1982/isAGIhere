# isAGIhere — Technical Context
Last updated: 2026-04-13

## Deployed State
| Environment | URL | Code path | Status |
|-------------|-----|-----------|--------|
| Production | https://isagihere.wiki | `artifacts/ai-hub/` (frontend) + `artifacts/api-server/` (API) | Live on Replit autoscale |
| GitHub | https://github.com/gunjan1982/isAGIhere | `main` branch | Deployed from Replit, pushed to GitHub |

## Active Workstreams
| Track | Goal | Key file | Status |
|-------|------|----------|--------|
| v1 — Platform maintenance | Keep deployed site stable; seed/data updates, minor fixes | `scripts/src/seed.ts` | Stable |
| v2 — YouTube Interview Monitor (Feature 1) | All code complete — pending GCloud deploy | See F1 rows below | **Pending deploy** |
| v2 — AI YouTube Channels Directory (Feature 2) | All code complete — pending GCloud deploy + codegen | `lib/db/src/schema/sources.ts` | **Pending deploy** |
| v2 — MY AI Journey (Feature 3) | All code complete — pending GCloud deploy | `lib/db/src/schema/journey.ts` | **Pending deploy** |
| GCloud migration | Move off Replit → Cloud Run + Cloud SQL; swap Anthropic → Gemini | `docs/GCLOUD_MIGRATION_PLAN.md` | **In progress — Phase 1 next** |

## v2.0 Build State — What Is Done vs Pending

### Feature 1 — YouTube Interview Monitor
| Component | File | Status |
|-----------|------|--------|
| DB schema | `lib/db/src/schema/interviews.ts` | ✅ Done |
| DB migration | — | ⏳ Run `pnpm --filter @workspace/db run push` in Replit |
| YouTube RSS fetcher | `artifacts/api-server/src/lib/youtube-fetcher.ts` | ✅ Done |
| AI summarizer | `artifacts/api-server/src/lib/interview-summarizer.ts` | ✅ Done |
| API routes | `artifacts/api-server/src/routes/interviews.ts` | ✅ Done |
| Route registered | `artifacts/api-server/src/routes/index.ts` | ✅ Done |
| People table: `youtubeChannelId` + `youtubeHandle` columns | `lib/db/src/schema/people.ts` | ✅ Done |
| `startInterviewScheduler()` wired at startup | `artifacts/api-server/src/index.ts` line 48 | ✅ Done |
| `interview-card.tsx` component | `artifacts/ai-hub/src/components/interview-card.tsx` | ✅ Done |
| `/interviews` page | `artifacts/ai-hub/src/pages/interviews.tsx` | ✅ Done |
| Person detail: Interviews tab | `artifacts/api-server/src/pages/person-detail.tsx` | ✅ Done |
| Home page: Latest Interviews strip | `artifacts/ai-hub/src/pages/home.tsx` | ✅ Done |
| Route in App.tsx | `artifacts/ai-hub/src/App.tsx` | ✅ Done |
| Nav link in layout | `artifacts/ai-hub/src/components/layout.tsx` | ✅ Done |
| `youtubeChannelId` seed values | `artifacts/api-server/src/lib/seed.ts` | ⏳ Needs manual research + population |

### Feature 2 — AI YouTube Channels Directory
| Component | File | Status |
|-----------|------|--------|
| Sources table: `youtubeChannelId`, `isInterviewChannel`, `featuredPeopleIds` | `lib/db/src/schema/sources.ts` | ✅ Done |
| YouTube channel seed data | `artifacts/api-server/src/lib/seed.ts` | ✅ Updated + 4 new interviewer channels |
| Sources page: YOUTUBE filter + card variant | `artifacts/ai-hub/src/pages/sources.tsx` | ✅ Done |
| `fetchInterviewerChannels()` in youtube-fetcher | `artifacts/api-server/src/lib/youtube-fetcher.ts` | ✅ Done |
| Codegen (new Source fields visible to frontend) | `lib/api-client-react/` | ⏳ Run `pnpm --filter @workspace/api-spec run codegen` in Replit |

### Feature 3 — MY AI Journey
| Component | File | Status |
|-----------|------|--------|
| DB schema (3 tables) | `lib/db/src/schema/journey.ts` | ✅ Done |
| Journey constants | `artifacts/ai-hub/src/data/journey-constants.ts` | ✅ Done |
| API routes | `artifacts/api-server/src/routes/journey.ts` | ✅ Done |
| Journey router registered | `artifacts/api-server/src/routes/index.ts` | ✅ Done |
| `/my-journey` page | `artifacts/ai-hub/src/pages/my-journey.tsx` | ✅ Done |
| Route in App.tsx + nav link | `artifacts/ai-hub/src/App.tsx` | ✅ Done |
| Home page: Community Pulse section | `artifacts/ai-hub/src/pages/home.tsx` | ✅ Done |
| My Hub: MY_AI_JOURNEY section | `artifacts/ai-hub/src/pages/my-hub.tsx` | ✅ Done |

## Known Bugs / Open Issues
| # | Description | File | Function | Confidence |
|---|-------------|------|----------|------------|
| 1 | All v2 schema changes not yet applied to Replit DB — run `pnpm --filter @workspace/db run push` | `lib/db/src/schema/` | n/a | High — required before any v2 feature works |
| 2 | `ANTHROPIC_API_KEY` not yet set in Replit Secrets — summarizer will silently skip summaries | `artifacts/api-server/src/lib/interview-summarizer.ts` | `generateMissingSummaries()` | Medium — interviews fetch fine but no AI summaries |
| 3 | `youtubeChannelId` seed values not populated for tracked people — fetcher is a no-op until at least a few are set | `artifacts/api-server/src/lib/seed.ts` | `fetchPersonInterviews()` | High — no interviews until populated |
| 4 | Existing seeded sources won't have `youtubeChannelId` set (seedIfEmpty skips non-empty DB) — must reset+reseed or run manual UPDATE | `artifacts/api-server/src/lib/seed.ts` | sources seed | High — Feature 2 dead until fixed |

## Key Functions / Entry Points
| Function | File | What it does |
|----------|------|-------------|
| `refreshFeeds()` | `artifacts/api-server/src/lib/rss-fetcher.ts` | Fetches all RSS sources + Bing News per person, upserts feed_items |
| `fetchPersonInterviews()` | `artifacts/api-server/src/lib/youtube-fetcher.ts` | Fetches YouTube RSS per person's channel, filters for interview-like videos |
| `generateMissingSummaries()` | `artifacts/api-server/src/lib/interview-summarizer.ts` | Calls Claude Haiku to generate aiSummary + keyTakeaways for unsummarized interviews |
| `computeComposite()` | `artifacts/ai-hub/src/lib/agi.ts` | Weighted consensus AGI arrival date from expert predictions |
| `startInterviewScheduler()` | `artifacts/api-server/src/lib/youtube-fetcher.ts` | Starts hourly interval for interview fetching — **NOT YET CALLED AT STARTUP** |
| seed script | `scripts/src/seed.ts` | Truncates + repopulates people, sources, communities tables |
| `clerkProxyMiddleware` | `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` | Proxies Clerk auth requests so frontend/backend share one domain |

## Recent Significant Changes
(rolling window — edit in-place, keep last 5)
1. **2026-04-14** — Feature 3 finalized: added Community Pulse section (`home.tsx` — model ratings + CTA) and MY_AI_JOURNEY section (`my-hub.tsx` — profile preview + setup CTA). All v2 code now complete locally.
2. **2026-04-13** — Feature 3 (MY AI Journey): `journey.ts` schema, `journey.ts` routes, `my-journey.tsx` page, constants, App.tsx route, nav link — all by Copilot.
3. **2026-04-13** — Feature 2 (AI YouTube Channels): sources schema extended, seed data updated (7 existing + 4 new), `sources.tsx` YouTube card variant, `fetchInterviewerChannels()`.
4. **2026-04-13** — Feature 1 (YouTube Interview Monitor): all frontend built by Copilot — interview-card.tsx, interviews.tsx page, person-detail tabs, home page strip, App.tsx + layout wired.
5. **2026-04-13** — Created `AGI v2.0.md` spec + documentation system (PROJECT_CONTEXT.md, TECH_CONTEXT.md, status logs, precedents).
