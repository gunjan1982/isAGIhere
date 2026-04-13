# Precedent Review — Candidates
Review every 3–5 sessions. Promote worthy entries to docs/precedents/.

---

## Drizzle schema exists but migration not applied
**Seen in:** isAGIhere — `lib/db/src/schema/interviews.ts` — 2026-04-13
**Pattern:** A Drizzle schema file was added to the repo (and committed to Git) but the corresponding migration was never generated or applied to the production database. The route references the table at runtime, causing a silent DB error or empty results — not a startup crash.
**Why it recurs:** In Replit-style AI-assisted development, the AI writes schema and route code together, but skips the generate+migrate step because it can't actually run DB commands. This gap appears every time a new table is added by an AI assistant.
**Resolution:** After every schema file change: `pnpm --filter @workspace/db run generate` then `pnpm --filter @workspace/db run migrate`. Verify by checking `drizzle/migrations/` for a new SQL file dated after the schema change.
**Promote?** [x] yes  [ ] no  [ ] duplicate

---

## Scheduler started in lib file but never wired to app startup
**Seen in:** isAGIhere — `artifacts/api-server/src/lib/youtube-fetcher.ts` — 2026-04-13
**Pattern:** A background scheduler function (`startInterviewScheduler()`) was implemented and exported but never imported or called in `app.ts` or `index.ts`. The feature works when triggered via the manual API endpoint but never runs automatically.
**Why it recurs:** AI assistants write the scheduler implementation and the calling code in separate steps, and when the calling step is done in a different context (different session, different file), the import is missed. Common in any background-job pattern.
**Resolution:** Always grep for `start[A-Z].*Scheduler` after writing a scheduler, and verify it appears in `app.ts` startup sequence.
**Promote?** [x] yes  [ ] no  [ ] duplicate

---

## Generated API client not regenerated after new routes added
**Seen in:** isAGIhere — `lib/api-client-react/` — potential issue when v2 routes land
**Pattern:** New Express routes are added and work fine when called directly, but the typed React hooks in `lib/api-client-react/` don't exist for them because `pnpm --filter @workspace/api-spec run codegen` was not run after updating `lib/api-spec/openapi.yaml`. Frontend falls back to raw `useQuery` calls without type safety.
**Why it recurs:** Codegen is a two-step process (update openapi.yaml → run codegen). Easy to forget the second step, especially when the AI assistant writes the route but doesn't update the spec.
**Resolution:** After adding any new API route: (1) add to `lib/api-spec/openapi.yaml`, (2) run codegen, (3) import generated hook in frontend.
**Promote?** [ ] yes  [ ] no  [ ] duplicate — needs another project occurrence before promoting

---

## pnpm workspace filter required for package-scoped installs
**Seen in:** isAGIhere — monorepo root — ongoing
**Pattern:** Running `pnpm add [package]` at the repo root adds the dependency to the root `package.json` instead of the intended workspace package. The package then can't be imported in the target artifact because it's not in the right `node_modules`.
**Resolution:** Always use `pnpm add [package] --filter @workspace/[artifact]`. E.g. `pnpm add youtube-transcript --filter @workspace/api-server`.
**Promote?** [x] yes  [ ] no  [ ] duplicate

---
