# isAGIhere — GCloud Migration + v2 Deploy Plan
Last updated: 2026-04-25

This doc is the single source of truth for migrating from Replit to Google Cloud and
getting all three v2 features (YouTube Interview Monitor, AI YouTube Channels, MY AI Journey)
live in production. Work through the phases in order.

---

## External services staying external (both free, no action needed)

| Service | Why | Cost |
|---|---|---|
| Clerk (auth) | Replacing with Firebase Auth = weeks of refactor, no benefit | Free up to 10K MAU |
| Resend (email) | No GCP-native equivalent worth switching to | Free up to 3K emails/month |

Everything else moves to GCP: compute, database, AI/ML.

---

## Current state

| Thing | Where it is now | Target | Status |
|---|---|---|---|
| API server + frontend | Replit autoscale | Cloud Run (asia-south1) | ⏳ Phase 4 |
| Database | Replit-managed Postgres | Cloud SQL — PostgreSQL 16 (asia-south1) | ⏳ Phase 2 |
| AI summaries | Anthropic Claude Haiku | Gemini 2.0 Flash via Vertex AI | ✅ Code done |
| v2 schema changes | Never pushed to prod | Push to Cloud SQL | ⏳ Phase 3 |
| Codegen (typed API client) | Stale — new Source + Journey fields missing | Run once locally | ✅ Done |
| deploy-gcp.sh | Had gcr.io + ANTHROPIC_API_KEY refs | Fixed to Artifact Registry + Vertex AI | ✅ Done |
| Dockerfile | Node 20 | Node 24 | ✅ Done |
| YouTube channel IDs (people) | None seeded | 5 confirmed channels added | ✅ Done |
| Source YouTube field patching | updateSeedData didn't patch existing rows | Fixed — auto-patches on startup | ✅ Done |

---

## Phase 0 — Prereqs (your Mac terminal, before anything else)

### 0a. Run codegen (one-time, 30 seconds)

The sandbox can't run codegen due to a filesystem mount restriction. Run this in your
Mac terminal from the repo root:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`
with the new Source fields (youtubeChannelId, isInterviewChannel, featuredPeopleIds) and
Journey API types. Commit the result. **Nothing else in Phase 1–5 depends on this —
the app will compile and run without it — but the type cast in `sources.tsx` line ~85
will remain until you do.**

### 0b. Fill in `.env.local`

Copy `.env.example` → `.env.local` and fill in all values. This file is gitignored.
No GEMINI_API_KEY needed — Vertex AI uses the Cloud Run service account automatically.

```
PROJECT_ID=          # your GCP project ID
REGION=asia-south1
SERVICE_NAME=isagihere
SQL_INSTANCE=PROJECT_ID:asia-south1:isagihere-db

DATABASE_URL=        # filled in after Phase 1 — Cloud SQL connection string
CLERK_SECRET_KEY=    # copy from Replit env (Settings → Environment Variables)
RESEND_API_KEY=      # copy from Replit env
VITE_CLERK_PUBLISHABLE_KEY=   # copy from Replit env
VITE_CLERK_PROXY_URL=         # set to your Cloud Run URL + /__clerk after Phase 3
```

---

## ✅ Phase 1 — DONE (Gemini swap + deploy script fixes)

All code changes already applied by Claude. Nothing to do here.

- `artifacts/api-server/src/lib/interview-summarizer.ts` — now uses `@google-cloud/vertexai`, Gemini 2.0 Flash, Application Default Credentials (no API key)
- `artifacts/api-server/package.json` — replaced `@anthropic-ai/sdk` with `@google-cloud/vertexai`
- `deploy-gcp.sh` — fixed Artifact Registry URL, removed ANTHROPIC_API_KEY, added GOOGLE_CLOUD_PROJECT + aiplatform.googleapis.com
- `Dockerfile` — bumped to Node 24

---

## Phase 2 — GCP project setup (your Mac terminal, one-time, ~20 minutes)

```bash
# Authenticate
gcloud auth login
gcloud auth application-default login

# Create or select project
gcloud projects create isagihere-prod --name="isAGIhere"   # or: gcloud config set project <existing-id>
gcloud config set project isagihere-prod

# Enable all required APIs (deploy-gcp.sh also does this, but run it now so Cloud SQL is ready)
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com

# Create Artifact Registry repo
gcloud artifacts repositories create isagihere-repo \
  --repository-format=docker \
  --location=asia-south1 \
  --description="isAGIhere Docker images"

# Authenticate Docker to push
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Grant the default Cloud Run service account permission to call Vertex AI
# Cloud Run uses PROJECT_NUMBER-compute@developer.gserviceaccount.com by default
PROJECT_NUMBER=$(gcloud projects describe isagihere-prod --format="value(projectNumber)")
gcloud projects add-iam-policy-binding isagihere-prod \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Create Cloud SQL instance (still in Phase 2)

```bash
# This takes ~5 minutes to provision
gcloud sql instances create isagihere-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-south1 \
  --storage-size=10GB \
  --storage-auto-increase

# Create database and user
gcloud sql databases create isagihere --instance=isagihere-db

gcloud sql users create isagihere_app \
  --instance=isagihere-db \
  --password=<choose a strong password>
```

### Get the DATABASE_URL for Cloud Run

Cloud Run connects to Cloud SQL via the built-in Auth Proxy. The URL format is:

```
postgresql://isagihere_app:<PASSWORD>@/isagihere?host=/cloudsql/<PROJECT_ID>:asia-south1:isagihere-db
```

Put this in `.env.local` as `DATABASE_URL`.

---

## Phase 3 — Schema migration (push v2 changes to Cloud SQL)

This is the most critical step. All three v2 features are broken until this runs.

```bash
# From repo root, with .env.local loaded
set -a && source .env.local && set +a

# Push all schema changes: interviews table, people columns,
# sources columns (youtubeChannelId, isInterviewChannel, featuredPeopleIds),
# journey tables (ai_journey_profiles, ai_tool_usage, frontier_model_reviews)
pnpm --filter @workspace/db run push
```

Confirm the push succeeded — drizzle-kit will show you the SQL it ran.
Verify by connecting to Cloud SQL and checking `\dt` shows the new tables.

```bash
# Quick sanity check via Cloud SQL proxy
gcloud sql connect isagihere-db --user=isagihere_app
\dt   -- should show: people, sources, communities, feed_items, interviews, journey_*, ...
\q
```

---

## Phase 4 — Build and deploy

```bash
# From repo root (requires Docker running and .env.local filled)
bash deploy-gcp.sh
```

This script does everything: builds the Docker image, pushes to Artifact Registry,
deploys to Cloud Run with all env vars and the Cloud SQL connection.

Build time is ~3–4 minutes. Cloud Run deployment takes ~1 minute.

Note: The root `Dockerfile` uses Node 20; `artifacts/api-server/Dockerfile` uses Node 24.
The deploy script uses the root Dockerfile (which is correct — it builds frontend too).
Consider bumping the root Dockerfile to Node 24 to match the api-server one.

When the deploy finishes, the script prints the Cloud Run service URL. Copy it.

---

## Phase 5 — DNS cutover

1. Update `VITE_CLERK_PROXY_URL` in `.env.local` to `https://<CLOUD_RUN_URL>/__clerk`
2. In your DNS provider, add a CNAME: `isagihere.wiki` → `<CLOUD_RUN_URL>`
   OR map the custom domain via Cloud Run:
   ```bash
   gcloud run domain-mappings create \
     --service=isagihere \
     --domain=isagihere.wiki \
     --region=asia-south1
   ```
3. SSL is provisioned automatically by Cloud Run (takes 10–30 min after DNS propagates).
4. Rebuild and redeploy with `VITE_CLERK_PROXY_URL` pointing to `https://isagihere.wiki/__clerk`.

---

## Phase 6 — Post-deploy validation

Run these in order after the service is live:

```bash
# 1. Health check
curl https://isagihere.wiki/api/healthz

# 2. Bootstrap interview data (fetches from all seeded YouTube channels)
curl -X POST https://isagihere.wiki/api/interviews/refresh

# 3. Check seed data was patched (look in Cloud Run logs)
# Should see:
#   "Patched youtubeChannelId for existing people" — count: 5
#   "Patched youtubeChannelId for existing sources" — count: 9+
```

Manual checks in the browser:
- `/interviews` — renders cards with AI summaries (may take a few minutes after refresh)
- `/sources` — YOUTUBE filter tab shows channel cards with thumbnails + INTERVIEW_CHANNEL badges
- `/my-journey` — page renders with profile editor + frontier model review section
- `/` home page — LATEST_INTERVIEWS strip visible; COMMUNITY_PULSE section visible

---

## Phase 7 — Decommission Replit (do last, after validating GCloud)

1. Export any data you want to keep from the Replit DB before deleting
2. Cancel Replit subscription
3. Update GitHub → Settings → Environments if Replit was wired there

---

## Open loops and known issues

| # | Issue | File | Status |
|---|---|---|---|
| 1 | ~~Codegen stale~~ | — | ✅ Done — ran 2026-04-25 |
| 2 | Lex Fridman source may have wrong channel ID (`UCnM5iMKiSJVDEFOBYRqf50g` in seed vs `UCSHZKyawb77ixDdsGog4iWA` confirmed) | `seed.ts` sources array | Low priority — fetcher returns 0 results for wrong ID, not a crash |
| 3 | No youtubeChannelId for Sam Altman, Dario Amodei, Demis Hassabis, Ilya Sutskever, Geoffrey Hinton, Yoshua Bengio, Fei-Fei Li | `seed.ts` | By design — these figures don't post to personal YT channels; they surface via interview channel sources |
| 4 | v2 schema not in prod DB | Cloud SQL | ⏳ Fixed by Phase 3 schema push |

---

## Quick reference — your remaining steps in order

```
Phase 0a:  pnpm --filter @workspace/api-spec run codegen    ✅ DONE
Phase 0b:  fill in .env.local                               (copy secrets from Replit)
Phase 2:   gcloud auth login + Cloud SQL setup              (~20 min, one-time)
Phase 3:   pnpm --filter @workspace/db run push             (schema migration against Cloud SQL)
Phase 4:   bash deploy-gcp.sh                               (build Docker + push + deploy Cloud Run)
Phase 5:   DNS cutover to isagihere.wiki                    (your DNS provider)
Phase 6:   curl -X POST .../api/interviews/refresh          (bootstrap interview data)
Phase 7:   cancel Replit                                    (after validating everything works)
```
