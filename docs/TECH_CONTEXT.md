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
| v2 — YouTube Interview Monitor (Feature 1) | Backend done, frontend pending | See F1 rows below | **In progress** |
| v2 — AI YouTube Channels Directory (Feature 2) | Source table extension + sourcing seed data | `lib/db/src/schema/sources.ts` | In progress |
| v2 — MY AI Journey (Feature 3) | New tables + API routes + `/my-journey` page | `lib/db/src/schema/journey.ts` | In progress |

## v2.0 Build State — What Is Done vs Pending

### Feature 1 — YouTube Interview Monitor
| Component | File | Status |
|-----------|------|--------|
| DB schema | `lib/db/src/schema/interviews.ts` | ✅ Done (in repo) |
| DB migration | — | ❓ Needs verify — migration may not have run yet |
| YouTube RSS fetcher | `artifacts/api-server/src/lib/youtube-fetcher.ts` | ✅ Done (in repo) |
| AI summarizer | `artifacts/api-server/src/lib/interview-summarizer.ts` | ✅ Done (in repo) |
| API routes | `artifacts/api-server/src/routes/interviews.ts` | ✅ Done (in repo) |
| Route registered | `artifacts/api-server/src/routes/index.ts` line 17, 34 | ✅ Done |
| People table: `youtubeChannelId` + `youtubeHandle` columns | `lib/db/src/schema/people.ts` | ❌ Not added yet |
| `interview-card.tsx` component | `artifacts/ai-hub/src/components/interview-card.tsx` | ❌ Not created |
| `/interviews` page | `artifacts/ai-hub/src/pages/interviews.tsx` | ❌ Not created |
| Person detail: Interviews tab | `artifacts/ai-hub/src/pages/person-detail.tsx` | ❌ Not added |
| Home page: Latest Interviews strip | `artifacts/ai-hub/src/pages/home.tsx` | ❌ Not added |
| Route in App.tsx | `artifacts/ai-hub/src/App.tsx` | ❌ Not added |
| Nav link in layout | `artifacts/ai-hub/src/components/layout.tsx` | ❌ Not added |
| Admin: Channel ID management panel | `artifacts/ai-hub/src/pages/admin.tsx` | ❌ Not added |

### Feature 2 — AI YouTube Channels Directory
| Component | File | Status |
|-----------|------|--------|
| Sources table: `youtubeChannelId`, `isInterviewChannel`, `featuredPeopleIds` | `lib/db/src/schema/sources.ts` | ✅ Created |
| YouTube channel seed data | `artifacts/api-server/src/lib/seed.ts` | ✅ Updated existing sources + added interviewer channels |
| Sources page: YOUTUBE filter | `artifacts/ai-hub/src/pages/sources.tsx` | ✅ YouTube card variant added |
| `fetchInterviewerChannels()` in youtube-fetcher | `artifacts/api-server/src/lib/youtube-fetcher.ts` | ✅ Created |

### Feature 3 — MY AI Journey
| Component | File | Status |
|-----------|------|--------|
| DB schema (3 tables) | `lib/db/src/schema/journey.ts` | ✅ Created |
| Journey constants | `artifacts/ai-hub/src/data/journey-constants.ts` | ✅ Created |
| API routes | `artifacts/api-server/src/routes/journey.ts` | ✅ Created |
| `/my-journey` page | `artifacts/ai-hub/src/pages/my-journey.tsx` | ✅ Created |
| Model review modal | `artifacts/ai-hub/src/pages/my-journey.tsx` | ✅ Implemented inline |
| Tool usage card | `artifacts/ai-hub/src/pages/my-journey.tsx` | ✅ Implemented inline |
| Home page: Community Pulse section | `artifacts/ai-hub/src/pages/home.tsx` | ❌ Not added |
| My Hub integration | `artifacts/ai-hub/src/pages/my-hub.tsx` | ❌ Not added |

## Known Bugs / Open Issues
| # | Description | File | Function | Confidence |
|---|-------------|------|----------|------------|
| 1 | `interviews` table migration status unknown — schema file exists but migration may not have been applied to prod DB | `lib/db/src/schema/interviews.ts` | n/a | Medium — needs verification |
| 2 | People table missing `youtubeChannelId` column — youtube-fetcher queries it but it doesn't exist in schema yet | `lib/db/src/schema/people.ts` | `fetchPersonInterviews()` | High — will throw on runtime |
| 3 | `youtube-fetcher.ts` scheduler is NOT started — no call to `startInterviewScheduler()` in `app.ts` or `index.ts` | `artifacts/api-server/src/app.ts` | startup | High |
| 4 | `interview-summarizer.ts` uses `eq` from drizzle but it's imported but check if ANTHROPIC_API_KEY env var is set | `artifacts/api-server/src/lib/interview-summarizer.ts` | `generateMissingSummaries()` | Medium |

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
1. **2026-04-13** — Cloned repo locally from GitHub to `/Users/gunjan.a/dev/IsAGIhere.wiki`. Set up documentation system per AI Coding Principles guide.
2. **2026-04-13** — Created `AGI v2.0.md` spec covering Feature 1 (YouTube Interview Monitor), Feature 2 (AI YouTube Channels), Feature 3 (MY AI Journey).
3. **Pre-2026-04-13 (on Replit)** — Added `lib/db/src/schema/interviews.ts`, `artifacts/api-server/src/lib/youtube-fetcher.ts`, `artifacts/api-server/src/lib/interview-summarizer.ts`, `artifacts/api-server/src/routes/interviews.ts` — Feature 1 backend complete but not wired to startup or frontend.
4. **Pre-2026-04-13 (on Replit)** — Added SEO structured data (JSON-LD), improved headshots, added live feed status indicator, added analytics.
5. **Pre-2026-04-13 (on Replit)** — Launched with: people directory, RSS feed aggregation, comments, search, submissions, follow system, weekly digest, AGI tracker, analytics.
