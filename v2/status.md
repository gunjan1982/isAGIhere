# v2 — Session Log (AGI v2.0 Features)
Workstream: AGI v2.0 — YouTube Interview Monitor, AI YouTube Channels, MY AI Journey.
Append one block per session. Never edit old blocks.
Full spec: `AGI v2.0.md` (Copilot implementation guide).
Live build status: `docs/TECH_CONTEXT.md` → v2.0 Build State tables.

---
date: 2026-04-13 IST
tool: Claude Code
model: claude-sonnet-4-5
gate: skipped — planning + docs session, no code produced
---
**Objective:** Write full implementation spec (AGI v2.0.md) for three features and set up the documentation system to enable cold-start development.

**Status:** complete

**Changes made:**
- `AGI v2.0.md` — created; full Copilot implementation guide for Feature 1 (YouTube Interview Monitor), Feature 2 (AI YouTube Channels Directory), Feature 3 (MY AI Journey). Contains exact file paths, DB schema code, API route signatures, and 12-step implementation order.

**Key decisions:**
- Feature 1 backend (schema, routes, youtube-fetcher, interview-summarizer) was found to already exist in the repo from Replit-based development. Planning doc updated to reflect this — frontend work is the immediate next step.
- No YouTube Data API key required — using public YouTube RSS feeds (`/feeds/videos.xml?channel_id=`) which are free and unauthenticated. This removes a dependency blocker.
- AI summaries use Claude Haiku (fastest/cheapest) not Opus — latency and cost appropriate for background batch job.
- MY AI Journey scoped to Phase 1 only: profile + tool usage + model reviews. Social/comparison features deferred to later phases.

**Open loops:**
- `youtubeChannelId` values for the people table: these need to be researched and added. None are seeded yet. Feature 1 will be a no-op until at least some are populated.
- ANTHROPIC_API_KEY must be set as a Replit Secret for `interview-summarizer.ts` to work.
- `startInterviewScheduler()` must be called in `app.ts` — currently missing.

**Next actions:**
- [ ] Fix Bug #2: add `youtubeChannelId` and `youtubeHandle` columns to `lib/db/src/schema/people.ts`
- [ ] Fix Bug #3: add `startInterviewScheduler()` call to `artifacts/api-server/src/app.ts` (after existing scheduler starts)
- [ ] Implement Feature 1 frontend step 1: create `artifacts/ai-hub/src/components/interview-card.tsx`
- [ ] Implement Feature 1 frontend step 2: create `artifacts/ai-hub/src/pages/interviews.tsx`
- [ ] Implement Feature 1 frontend step 3: add Interviews tab to `artifacts/ai-hub/src/pages/person-detail.tsx`
- [ ] Implement Feature 1 frontend step 4: add Latest Interviews strip to `artifacts/ai-hub/src/pages/home.tsx`
- [ ] Implement Feature 1 frontend step 5: add route to `artifacts/ai-hub/src/App.tsx` and nav link to `artifacts/ai-hub/src/components/layout.tsx`
- [ ] After all above: begin Feature 3 DB schema (`lib/db/src/schema/journey.ts`)

**Evidence paths:**
- `artifacts/api-server/src/routes/index.ts` — confirms interviewsRouter already registered (lines 17, 34)
- `lib/db/src/schema/interviews.ts` — confirms schema already exists
- `artifacts/api-server/src/lib/youtube-fetcher.ts` — confirms fetcher already written

---
date: 2026-04-13 IST
tool: GitHub Copilot (Claude Sonnet 4.6)
gate: passed — Feature 1 fully implemented
---
**Objective:** Implement Feature 1 (YouTube Interview Monitor) end-to-end per AGI v2.0.md spec.

**Status:** complete — pending Replit push (schema + dependency install)

**Changes made:**
- `lib/db/src/schema/interviews.ts` — created; `interviewsTable` with all spec columns
- `lib/db/src/schema/people.ts` — added `youtubeChannelId` + `youtubeHandle` columns
- `lib/db/src/schema/index.ts` — added `export * from "./interviews"`
- `artifacts/api-server/package.json` — added `@anthropic-ai/sdk ^0.39.0`
- `artifacts/api-server/src/lib/youtube-fetcher.ts` — created; RSS-based fetcher, keyword filter, `startInterviewScheduler()`
- `artifacts/api-server/src/lib/interview-summarizer.ts` — created; Anthropic Haiku batch summarizer
- `artifacts/api-server/src/routes/interviews.ts` — created; 4 routes: `GET /interviews`, `GET /people/:id/interviews`, `GET /interviews/:id/transcript`, `POST /interviews/refresh`
- `artifacts/api-server/src/routes/index.ts` — registered `interviewsRouter`
- `artifacts/api-server/src/index.ts` — added `startInterviewScheduler()` call at startup, imported from youtube-fetcher
- `artifacts/ai-hub/src/components/interview-card.tsx` — created; thumbnail, topics chips, expandable AI summary + takeaways, WATCH + TRANSCRIPT buttons, compact mode
- `artifacts/ai-hub/src/pages/interviews.tsx` — created; `/interviews` page with person + topic filter pills, 2-col grid, load-more pagination
- `artifacts/ai-hub/src/pages/person-detail.tsx` — added ACTIVITY / INTERVIEWS tab bar; interviews tab fetches `GET /api/people/:id/interviews`
- `artifacts/ai-hub/src/pages/home.tsx` — added `LATEST_INTERVIEWS` horizontal scroll strip (6 cards, skeleton loading)
- `artifacts/ai-hub/src/App.tsx` — added `/interviews` route
- `artifacts/ai-hub/src/components/layout.tsx` — added Interviews nav item (Film icon)

**Key decisions:**
- Used `Film` icon (not Youtube) for nav — avoids brand trademark issues
- `interview-summarizer.ts` uses `claude-haiku-4-5` model name (current Haiku)
- Person detail page uses tab UI rather than separate scroll section — cleaner when both feed and interviews are present
- Home page strip is conditionally rendered — hidden if no interviews data yet (avoids empty section on first load)

**Open loops (must do in Replit to go live):**
- [ ] `pnpm --filter @workspace/db run push` — applies schema (interviews table + people columns)
- [ ] `pnpm add @anthropic-ai/sdk --filter @workspace/api-server` — installs SDK
- [ ] Add `ANTHROPIC_API_KEY` to Replit Secrets
- [ ] Seed `youtubeChannelId` values for tracked people (currently none set — fetcher is a no-op until populated)

**Next actions:**
- [ ] Feature 2: extend `sourcesTable`, seed interviewer channels, add `fetchInterviewerChannels()`
- [ ] Feature 2 frontend: YOUTUBE filter on Sources page
- [ ] Feature 3: `lib/db/src/schema/journey.ts` + all backend routes + my-journey.tsx page

---
date: 2026-04-13 IST
tool: GitHub Copilot (Claude Sonnet 4.6)
gate: passed — Feature 2 fully implemented
---
**Objective:** Implement Feature 2 (AI YouTube Channels Directory) per AGI v2.0.md spec.

**Status:** complete — pending Replit push (schema + codegen)

**Changes made:**
- `lib/db/src/schema/sources.ts` — added 3 columns: `youtubeChannelId text`, `isInterviewChannel boolean default false`, `featuredPeopleIds text`
- `lib/api-spec/openapi.yaml` — added `youtubeChannelId`, `isInterviewChannel`, `featuredPeopleIds` to `Source` schema object
- `artifacts/api-server/src/lib/seed.ts` — updated 7 existing sources with `youtubeChannelId` + `isInterviewChannel`; added 4 new sources (Yannic Kilcher, AI Explained, ML Street Talk, Eye on AI); TWIML AI Podcast added as new entry; Lex Fridman + Dwarkesh + No Priors + ML Street Talk + Eye on AI flagged as `isInterviewChannel: true`
- `artifacts/api-server/src/lib/youtube-fetcher.ts` — added `fetchInterviewerChannels()`: queries sources where `isInterviewChannel=true` AND `youtubeChannelId IS NOT NULL`, parses RSS, matches person names from titles using people table lookup, inserts to `interviewsTable` with `isOriginalSource: false`; also updated imports to include `sourcesTable`, `eq`, `and`
- `artifacts/api-server/src/lib/youtube-fetcher.ts` — updated `startInterviewScheduler()` to run both `fetchPersonInterviews()` and `fetchInterviewerChannels()` in parallel via `Promise.all`
- `artifacts/api-server/src/routes/interviews.ts` — updated `POST /interviews/refresh` to call both fetchers in parallel and return `{ fetched, fetchedChannels, summarized }`
- `artifacts/ai-hub/src/pages/sources.tsx` — added YouTube card variant: channel thumbnail (grayscale→color on hover), `INTERVIEW_CHANNEL` badge (rose/pink colour), `YOUTUBE` type badge (rose/pink), `SUBSCRIBE` button (rose coloured), `VIEW_INTERVIEWS →` link for interview channels; generic card variant unchanged; added `Youtube` + `Users` icons from lucide-react

**Key decisions:**
- Channel thumbnail uses `https://i.ytimg.com/vi/${youtubeChannelId}/default.jpg` — same domain as interview card thumbnails; works without API key
- `INTERVIEW_CHANNEL` badge uses rose-500 palette to distinguish from green `HIGH_SIGNAL` badge
- `VIEW_INTERVIEWS →` link to `/interviews` — currently shows all interviews; no per-channel filter yet (acceptable for Phase 1)
- `featuredPeopleIds` column added to schema but not yet used in UI — reserved for Phase 2
- Type cast in sources.tsx: `src = source as typeof source & { youtubeChannelId?, isInterviewChannel? }` — safe since codegen output doesn't include new fields yet; will be removed after Replit codegen

**Open loops (must do in Replit to go live):**
- [ ] `pnpm --filter @workspace/db run push` — applies sources schema changes (3 new columns)
- [ ] `pnpm --filter @workspace/api-spec run codegen` — regenerates typed API client with new Source fields (removes type cast in sources.tsx)
- [ ] Existing seeded sources won't have `youtubeChannelId` set (seedIfEmpty skips non-empty DB) — must run a one-time UPDATE or reset + reseed

**Next actions:**
- [ ] Before Feature 3: read `INPUTS/my-ai-journey.md` (hard gate — user instruction)
- [ ] Feature 3: `lib/db/src/schema/journey.ts` + backend routes + my-journey.tsx page

---
date: 2026-04-13 IST
tool: GitHub Copilot (Raptor mini)
gate: passed — Feature 3 started
---
**Objective:** Begin Feature 3 (MY AI Journey) implementation per `AGI v2.0.md` and `INPUTS/my-ai-journey.md`.

**Status:** in progress

**Changes made:**
- `lib/db/src/schema/journey.ts` — created AI Journey schema with `ai_journey_profiles`, `ai_tool_usage`, and `frontier_model_reviews` tables
- `artifacts/api-server/src/routes/journey.ts` — created backend routes for public feed, authenticated profile CRUD, tool usage CRUD, public model ratings, model review CRUD
- `artifacts/ai-hub/src/data/journey-constants.ts` — created constants for frontier models, tool categories, use cases, experience levels, and frequency options
- `artifacts/ai-hub/src/pages/my-journey.tsx` — created `/my-journey` page with signed-in profile editor, tool usage manager, frontier model review manager, and community feed section
- `artifacts/ai-hub/src/App.tsx` — added `MyJourney` route
- `artifacts/ai-hub/src/components/layout.tsx` — added `My Journey` navigation item
- `lib/db/src/schema/index.ts` — exported journey schema
- `artifacts/api-server/src/routes/index.ts` — registered journey router
- `lib/api-spec/openapi.yaml` — added Journey schemas and journey API paths for docs/codegen

**Key decisions:**
- The UI is implemented as an inline dashboard page rather than separate modal/card components for faster iteration and lower integration risk.
- This work was completed directly in the local repo workspace without returning to Replit.
- Auth-protected endpoints use Clerk `getAuth(req)` matching existing backend patterns.
- Community section shows public profiles and aggregated model rating rows, supporting Phase 1 visibility without full social features.

**Open loops:**
- [ ] `pnpm --filter @workspace/db run push` — apply journey schema changes to the database
- [ ] `pnpm --filter @workspace/api-spec run codegen` — generate client hooks for journey endpoints
- [ ] Add `/my-journey` page to `artifacts/ai-hub/src/pages/home.tsx` or `my-hub.tsx` later for better discoverability
- [ ] Consider adding a dedicated `model-review-modal.tsx` and `tool-usage-card.tsx` once the page flow is validated

**Next actions:**
- [ ] Verify new journey API endpoints with authenticated requests once the backend is running locally
- [ ] Add `my-journey` to the mobile nav or signup nudge flows in future refinement

---
date: 2026-04-14 IST
tool: Claude Code
model: claude-sonnet-4-7
gate: passed — all v2 frontend complete
---
**Objective:** Complete the two remaining frontend items from Feature 3 and sync TECH_CONTEXT.md with actual repo state.

**Status:** complete — all v2 code done locally, pending Replit deploy

**Changes made:**
- `artifacts/ai-hub/src/pages/home.tsx` — added `COMMUNITY_PULSE` section before Directory Access; queries `GET /api/journey/models` for aggregated model ratings; shows star-rating leaderboard grid (up to 8 models); graceful empty-state with "START_MY_AI_JOURNEY →" CTA; added `Cpu` + `Star` icons
- `artifacts/ai-hub/src/pages/my-hub.tsx` — added `MY_AI_JOURNEY` section after Custom Sources; new `useMyJourneyProfile()` hook calls `GET /api/journey/profile`; shows compact profile card (display name, experience level, public/private badge) if profile exists; shows "SET_UP_MY_JOURNEY →" CTA if not; added `Cpu` + `ArrowRight` imports
- `docs/TECH_CONTEXT.md` — updated all three feature build-state tables to reflect actual repo state (Features 1/2/3 all ✅ locally); updated Known Bugs table (bugs #2/#3 fixed, replaced with accurate Replit deploy blockers); updated Recent Significant Changes rolling window

**Key decisions:**
- Community Pulse uses `parseFloat(row.avgRating)` + `Math.round()` for star display — avgRating from Drizzle `avg()` is returned as string, not number
- `useMyJourneyProfile()` returns `null` on 401 (unauthenticated) rather than throwing — safe for signed-out state in My Hub
- Both sections handle loading + empty states consistently with the rest of the codebase design language (dashed border, muted icon, font-mono labels)

**Open loops (Replit — required to go live):**
- [ ] `pnpm --filter @workspace/db run push` — applies ALL schema changes (interviews, people columns, sources columns, journey tables)
- [ ] `pnpm add @anthropic-ai/sdk --filter @workspace/api-server` — installs Anthropic SDK
- [ ] Add `ANTHROPIC_API_KEY` to Replit Secrets
- [ ] `pnpm --filter @workspace/api-spec run codegen` — regenerates typed API client with Source + Journey fields
- [ ] Seed `youtubeChannelId` values for tracked people (researched manually — Sam Altman: UCxxx, etc.)
- [ ] Reset + reseed sources table so `youtubeChannelId` + `isInterviewChannel` values are applied to existing rows

**Next actions:**
- [ ] Deploy from Replit (run the above in order)
- [ ] After deploy: trigger `POST /api/interviews/refresh` once to bootstrap interview data
- [ ] Validate `/interviews` page, `/sources` YouTube filter, `/my-journey` page all render correctly in production

---
date: 2026-04-25 IST
tool: Claude (Cowork)
model: claude-sonnet-4-6
gate: partial — seed + Bug #4 fix done locally; Replit steps remain
---
**Objective:** Execute the migration plan — apply all v2 schema changes and unblock all three features for production.

**Status:** partial — all code-level prep complete; DB push + codegen must run in Replit

**What was done locally:**
- `artifacts/api-server/src/lib/seed.ts` — added `youtubeChannelId` + `youtubeHandle` to 5 confirmed people:
  - Andrej Karpathy: `UCXUPKJO5MZQN11PqgIvyuvQ` / `@AndrejKarpathy`
  - Yann LeCun: `UCMU7l2bIv6MXlgJR3-E33Dw` / `@yannlecun`
  - Andrew Ng: `UCep6Rpvw3PtOMJWAFpKl8Yw` / `@andrewng`
  - Lex Fridman: `UCSHZKyawb77ixDdsGog4iWA` / `@lexfridman`
  - Dwarkesh Patel: `UCXl4i9dYBrFOabk0xGmbkRA` / `@dwarkeshpatel`
- `artifacts/api-server/src/lib/seed.ts` — fixed Bug #4: added `updateSeedData()` patching logic for:
  - People: patches `youtubeChannelId` + `youtubeHandle` for existing DB rows where seed has values but DB is null
  - Sources: patches `youtubeChannelId` + `isInterviewChannel` + `featuredPeopleIds` for existing DB rows

**What was blocked locally:**
- Codegen (`pnpm --filter @workspace/api-spec run codegen`): orval uses `unlink()` before writing, which fails on macOS-mounted virtiofs in the Linux sandbox (EPERM). Must run in Replit.
- DB push: no DATABASE_URL available locally — must run in Replit.

**Remaining Replit steps (run in this order):**
1. `pnpm --filter @workspace/db run push` — applies ALL schema changes (interviews table, people columns, sources columns, journey tables)
2. `pnpm --filter @workspace/api-spec run codegen` — regenerates typed API client + Zod schemas
3. Add `ANTHROPIC_API_KEY` to Replit Secrets (if not already set)
4. Restart server — `updateSeedData()` will auto-run and patch youtubeChannelId on existing people + sources
5. `POST /api/interviews/refresh` — bootstrap interview data from all seeded channels

**After deploy validation:**
- `/interviews` page renders with fetched interviews
- `/sources` page shows YouTube filter with channel thumbnails and INTERVIEW_CHANNEL badges
- `/my-journey` page renders with profile editor + model reviews section
- Logs show "Patched youtubeChannelId for existing people" (5 rows) and "Patched youtubeChannelId for existing sources" (9+ rows)

**Open loops:**
- Codegen type cast in `sources.tsx` (`src = source as typeof source & { ... }`) will remain until codegen runs in Replit
- No `youtubeChannelId` found for: Sam Altman, Dario Amodei, Demis Hassabis, Ilya Sutskever, Geoffrey Hinton, Yoshua Bengio, Fei-Fei Li — these figures don't maintain personal YouTube channels; their appearances are captured via interview channel sources
