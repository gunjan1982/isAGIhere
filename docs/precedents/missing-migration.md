# Drizzle Schema Without Migration Applied

## Symptom
A new table's route returns empty results or a DB error, but the schema file exists in the repo and the code looks correct. No startup crash — the error is silent.

## Root Cause
In AI-assisted development (Replit, Cursor, etc.), the AI writes the Drizzle schema file and the route together, but cannot run shell commands to generate + apply the migration. The schema TypeScript file is committed but the SQL migration was never run against the actual database. Drizzle does NOT auto-migrate on startup — you must explicitly run the generate + migrate commands.

## Minimal Example
```typescript
// BROKEN — schema file exists, but migration never ran
// lib/db/src/schema/interviews.ts exists with interviewsTable definition
// GET /api/interviews returns [] or throws "relation interviews does not exist"

// FIXED — after running:
// pnpm --filter @workspace/db run generate
// pnpm --filter @workspace/db run migrate
// GET /api/interviews works correctly
```

## Fix Rule
After every change to any file in `lib/db/src/schema/`, immediately run `pnpm --filter @workspace/db run generate` then `pnpm --filter @workspace/db run migrate`. Verify a new `.sql` file appears in `drizzle/migrations/` dated after your change.

## Seen In
- isAGIhere — `lib/db/src/schema/interviews.ts` — 2026-04-13
