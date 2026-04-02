# 🗺️ Replit Zero-Lock-In Strategy
**Goal:** Build a project within a 1-month subscription that can be moved to any host (Vercel, Railway, VPS) without code changes.

---

## 🛠️ Portable Tech Stack
Do not use Replit-proprietary features. Use these industry standards instead:

| Feature | Use This (Portable) | Avoid (Locked-in) |
| :--- | :--- | :--- |
| **Database** | **Postgres** (Neon/Supabase) or **SQLite** | Replit DB |
| **Auth** | **Clerk**, **Auth.js**, or **Lucia** | Replit Auth |
| **Secrets** | Standard **.env** variables | Hardcoded Replit Secrets |
| **Packages** | **npm/pip/bun** (standard manifests) | Replit-only installers |
| **Storage** | **S3** or **Cloudinary** | Local VM Filesystem |

---

## 📋 Development Workflow

### 1. External Git Sync (Priority #1)
- **Action:** Connect to GitHub/GitLab via the "Version Control" tab immediately.
- **Frequency:** Commit and push every meaningful change.
- **Why:** If the subscription expires, your source code is safe and accessible elsewhere.

### 2. Database Setup
- **Action:** Use an external connection string.
- **Implementation:**
```env
DATABASE_URL=postgres://user:password@neon-db-link:5432/dbname
```
- **Free options:** [Neon](https://neon.tech) (free tier: 512MB), [Supabase](https://supabase.com) (free tier: 500MB)
- **ORM:** Use **Prisma** or **Drizzle** — both generate standard SQL and work on any host.

### 3. Authentication Setup
- **Clerk** — drop-in React/Next.js auth, free up to 10,000 MAU. Works identically on Vercel, Railway, VPS.
- **Auth.js (NextAuth)** — open-source, framework-agnostic, zero vendor dependency.
- **Never** use `@replit/replit-auth` — it ties auth to Replit's identity provider.

### 4. Secrets & Environment Variables
- Keep ALL secrets in `.env` (never hardcode).
- Add `.env` to `.gitignore` immediately.
- On migration, copy the same key=value pairs to your new host's secrets panel (Vercel: Project Settings → Environment Variables).

```env
# Example portable .env
DATABASE_URL=postgres://...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
```

### 5. File Storage
- **Never** write uploaded files to the local filesystem (Replit's VM is ephemeral and non-portable).
- Use **Cloudinary** (free 25GB) or **AWS S3** / **Backblaze B2** for all user uploads.
- Reference files by URL in your database, not local path.

---

## 🚀 Migration Checklist (End of Month)

Run through this before your Replit subscription expires:

### Code
- [ ] All code committed and pushed to GitHub/GitLab
- [ ] `.env` file documented (keys listed, not values) in a `README.md`
- [ ] No `require('@replit/...')` or `import from 'replit'` anywhere in codebase
- [ ] `grep -r "replit" ./src` returns zero hits (run this in Replit's Shell)

### Database
- [ ] Database is on Neon/Supabase (external), not Replit DB
- [ ] Run `prisma migrate deploy` or export schema SQL — verify it applies cleanly on a fresh DB
- [ ] Export a data backup: `pg_dump $DATABASE_URL > backup.sql`

### Auth
- [ ] Auth provider (Clerk/Auth.js) is configured with your own domain, not `*.replit.app`
- [ ] OAuth redirect URIs updated to new domain in Clerk dashboard

### Deployment Targets (pick one)

| Host | Best For | Free Tier | Deploy Command |
| :--- | :--- | :--- | :--- |
| **Vercel** | Next.js, static, serverless APIs | Yes (generous) | `vercel deploy` or connect GitHub repo |
| **Railway** | Full-stack, Node, Python, Postgres | $5 credit/mo | `railway up` |
| **Render** | Full-stack, background workers | Yes (spins down) | Connect GitHub repo |
| **Fly.io** | Docker-based, always-on | 3 small VMs free | `fly deploy` |
| **VPS (Hetzner/DigitalOcean)** | Full control, cheap (~€4/mo) | No | Manual deploy or Docker |

### Final Migration Steps
1. Clone repo: `git clone https://github.com/yourname/yourproject`
2. Copy `.env` values to new host's secrets panel
3. Run `npm install` / `pip install -r requirements.txt`
4. Point DNS to new host
5. Done ✅

---

## 🧱 Recommended Portable Stack by Project Type

### Full-Stack Web App (Next.js)
```
Framework:   Next.js 14+ (App Router)
Database:    Neon Postgres + Prisma ORM
Auth:        Clerk
Storage:     Cloudinary
Deploy to:   Vercel (zero config)
```

### API / Backend (Node.js)
```
Framework:   Express or Fastify
Database:    Neon Postgres + Drizzle ORM
Auth:        Auth.js or JWT (jsonwebtoken)
Storage:     AWS S3 / Backblaze B2
Deploy to:   Railway or Render
```

### Python App (FastAPI)
```
Framework:   FastAPI + Uvicorn
Database:    Supabase Postgres + SQLAlchemy
Auth:        python-jose (JWT) or Auth0
Storage:     Cloudinary or S3 (boto3)
Deploy to:   Fly.io or Railway
```

---

## ⚠️ Red Flags: You May Be Locked In

Run these checks before you migrate:

```bash
# Check for Replit-specific imports
grep -r "replit" ./src --include="*.js" --include="*.ts" --include="*.py"

# Check for hardcoded replit.dev URLs
grep -r "replit.dev\|replit.app" ./src

# Check package.json for Replit packages
cat package.json | grep replit

# Verify .env is gitignored
cat .gitignore | grep .env
```

If any of these return hits, fix before migrating.

---

## 📁 Recommended `.gitignore` (add on Day 1)

```gitignore
# Environment
.env
.env.local
.env.production

# Replit
.replit
replit.nix
.breakpoints

# Dependencies
node_modules/
__pycache__/
.venv/

# Build output
.next/
dist/
build/

# OS
.DS_Store
```

---

## 🔑 Key Principle

> **Replit is your IDE and execution sandbox. GitHub is your source of truth. The external DB is your data layer. None of these three depend on each other — or on Replit staying paid.**

Your subscription pays for the *AI agent and cloud coding environment*, not for hosting. Treat it like a disposable workspace, and everything you build is yours to take anywhere.
