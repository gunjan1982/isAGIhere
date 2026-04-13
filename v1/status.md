# v1 — Session Log (Deployed Platform)
Workstream: isagihere.wiki production — maintenance, data updates, minor fixes.
Append one block per session. Never edit old blocks.

---
date: 2026-04-13 IST
tool: Claude Code
model: claude-sonnet-4-5
gate: skipped — docs-only session
---
**Objective:** Establish documentation system for the project; capture current state of deployed v1 platform.

**Status:** complete

**Changes made:**
- `docs/PROJECT_CONTEXT.md` — created; permanent project briefing covering stack, domain, rules, repo structure
- `docs/TECH_CONTEXT.md` — created; current technical state including v2 build status matrix
- `docs/ledger.md` — created; backfilled with inferred deploy history from git log
- `docs/precedent_review.md` — created; 4 candidate patterns extracted from codebase inspection
- `docs/precedents/missing-migration.md` — created; promoted pattern: schema-without-migration
- `docs/precedents/pnpm-workspace-filter.md` — created; promoted pattern: wrong package install target
- `v1/status.md` — this file
- `v2/status.md` — created; captures current v2.0 in-progress state
- `CLAUDE.md` — created; project-level hard rules for Claude Code

**Key decisions:**
- Two workstream split (v1/v2) rather than frontend/backend split — because the logical boundary is "deployed vs in-development", not layer. Cold-starting on v2 work must not require reading v1 maintenance history.
- `docs/TECH_CONTEXT.md` chosen as the single source of truth for v2 build state — the status table there is the definitive checklist, not `AGI v2.0.md` (which is a Copilot spec, not a live status tracker).

**Open loops:**
- Whether the `interviews` table migration has actually been applied to the Replit production DB is unknown — needs manual verification via Replit DB console or `pnpm --filter @workspace/db run migrate` run.
- `youtubeChannelId` not yet seeded for any people — Feature 1 will silently fetch 0 interviews until this is populated.

**Next actions:**
- [ ] Verify `interviews` table exists in prod: run `SELECT count(*) FROM interviews;` in Replit DB console
- [ ] If table missing: run `pnpm --filter @workspace/db run generate` then `pnpm --filter @workspace/db run migrate` from Replit shell
- [ ] Add `youtubeChannelId` values for at least 5–10 people (Sam Altman, Demis Hassabis, Ilya Sutskever, Jensen Huang, etc.) via seed script or admin panel

**Evidence paths:**
- `git log --oneline -25` — full commit history used to reconstruct ledger
- `artifacts/api-server/src/routes/index.ts` lines 17, 34 — confirms interviewsRouter registered
