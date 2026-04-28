# isAGIhere — Google Cloud Platform Deployment Guide

**For Copilot / Any AI Tool**

> Follow this step-by-step to deploy isAGIhere to Google Cloud Run + Cloud SQL using free trial credits.

---

## Overview

- **Compute:** Google Cloud Run (serverless, free tier)
- **Database:** Google Cloud SQL PostgreSQL (free tier: 10GB + 1 instance)
- **Domain:** isagihere.wiki (already owned, will update DNS)
- **Cost:** $0 (using free trial credits ₹27,287, expires June 11, 2026)
- **Estimated Setup Time:** 60 minutes

---

## Prerequisites

- [ ] Google Cloud account with free trial active (₹27,287 available)
- [ ] `gcloud` CLI installed locally (`gcloud auth login`)
- [ ] `pnpm` installed locally
- [ ] GitHub repo access to https://github.com/gunjan1982/isAGIhere
- [ ] Domain isagihere.wiki with DNS access

---

## Step 1: Create Google Cloud Project (5 minutes)

### 1.1 Create Project
```bash
# Go to Google Cloud Console
# https://console.cloud.google.com

# Create new project:
# - Name: isAGIhere
# - Organization: (your account)
# Click "Create"
```

### 1.2 Enable Required APIs
```bash
# In Cloud Console, enable these APIs:
# 1. Cloud Run API
# 2. Cloud SQL Admin API
# 3. Cloud Build API
# 4. Artifact Registry API

# Or via gcloud:
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### 1.3 Set Default Project & Region
```bash
# Set your GCP project ID
export PROJECT_ID="isAGIhere"  # or whatever you named it
gcloud config set project $PROJECT_ID
gcloud config set run/region asia-south1  # or your closest region
```

---

## Step 2: Create Cloud SQL Database (10 minutes)

### 2.1 Create PostgreSQL Instance
```bash
# Via gcloud CLI (simplest):
gcloud sql instances create isagihere-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-south1 \
  --no-backup

# Or via Cloud Console:
# SQL Admin → Create Instance → PostgreSQL 15
# Instance name: isagihere-db
# Machine type: Shared core (db-f1-micro)
# Region: asia-south1
# Click Create (wait 5-10 min)
```

### 2.2 Create Database
```bash
# Create the database named "isagihere"
gcloud sql databases create isagihere \
  --instance=isagihere-db

# Or via Cloud Console:
# Databases tab → Create Database → Name: "isagihere"
```

### 2.3 Create Database User
```bash
# Create user "isagihere_app" with password
gcloud sql users create isagihere_app \
  --instance=isagihere-db \
  --password=[GENERATE_SECURE_PASSWORD_HERE]

# Save the password securely (you'll need it in Step 4)
# Password format: at least 16 chars, mix of upper/lower/numbers/symbols
# Example: Isagi@Here2024Secure!
```

### 2.4 Get Cloud SQL Connection String
```bash
# Get instance details
gcloud sql instances describe isagihere-db --format="get(connectionName)"

# This will output something like:
# PROJECT_ID:asia-south1:isagihere-db

# Save this. You'll need it for the Cloud SQL Proxy.
```

---

## Step 3: Prepare Local Code (10 minutes)

### 3.1 Clone & Update Repository
```bash
# If not already cloned:
git clone https://github.com/gunjan1982/isAGIhere /Users/gunjan.a/dev/IsAGIhere.wiki
cd /Users/gunjan.a/dev/IsAGIhere.wiki

# Make sure you're on the latest main branch
git checkout main
git pull origin main
```

### 3.2 Create Dockerfile
**Create file:** `/Users/gunjan.a/dev/IsAGIhere.wiki/Dockerfile`

```dockerfile
# Use Node 20 Alpine (lightweight)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy source code
COPY . .

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
```

### 3.3 Create .dockerignore
**Create file:** `/Users/gunjan.a/dev/IsAGIhere.wiki/.dockerignore`

```
node_modules
.next
.git
.env.local
.env.*.local
*.md
.DS_Store

# Keep local env files and secrets out of Docker builds
.env*
```

### 3.4 Create a local env template and deploy helper
**Create file:** `/Users/gunjan.a/dev/IsAGIhere.wiki/.env.example`

```
# Copy to .env.local and fill in your secrets.
DATABASE_URL=
ANTHROPIC_API_KEY=
CLERK_SECRET_KEY=
RESEND_API_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
VITE_CLERK_PROXY_URL=
BASE_PATH=/
PORT=5173
LOG_LEVEL=info
NODE_ENV=production
```

**Create file:** `/Users/gunjan.a/dev/IsAGIhere.wiki/deploy-gcp.sh`

Use this script after you add secrets to `.env.local`. It builds the Docker image locally, pushes it to Artifact Registry, and deploys Cloud Run.

```bash
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

### 3.5 Create app.yaml
**Create file:** `/Users/gunjan.a/dev/IsAGIhere.wiki/app.yaml`
*.md
.DS_Store
.env.production.local
drizzle/
```

### 3.4 Create app.yaml for Cloud Run
**Create file:** `/Users/gunjan.a/dev/IsAGIhere.wiki/app.yaml`

```yaml
runtime: custom
env: flex

env_variables:
  # These will be overridden by Cloud Run secrets
  NODE_ENV: "production"

automatic_scaling:
  min_instances: 1
  max_instances: 3

readiness_check:
  path: "/api/health"  # or any public endpoint
  timeout_sec: 30
  check_interval_sec: 5

liveness_check:
  path: "/api/health"
  timeout_sec: 30
  check_interval_sec: 5
```

### 3.5 Verify Build Locally (optional but recommended)
```bash
# Test local build
docker build -t isagihere-test .
docker run -p 3000:3000 isagihere-test

# Visit http://localhost:3000 and verify it loads
# Ctrl+C to stop
```

---

## Step 4: Run Database Migrations (10 minutes)

### 4.1 Create Temporary Connection to Cloud SQL

**Option A: Using Cloud SQL Auth Proxy (Simplest)**
```bash
# Install Cloud SQL Proxy
# macOS:
curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.mac.amd64
chmod +x cloud-sql-proxy

# Linux:
curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy in background
./cloud-sql-proxy PROJECT_ID:asia-south1:isagihere-db &
```

**Option B: Via Cloud Shell (Easier)**
```bash
# Go to Cloud Console → Cloud Shell (>_ icon top right)
# Run remaining commands in Cloud Shell
```

### 4.2 Set DATABASE_URL
```bash
# Get Cloud SQL IP from Cloud Console or:
gcloud sql instances describe isagihere-db --format="get(ipAddresses[0].ipAddress)"

# Set environment variable (replace with actual IP and password)
export DATABASE_URL="postgresql://isagihere_app:[PASSWORD]@[CLOUD_SQL_IP]:5432/isagihere"

# Or add to .env.local temporarily:
echo "DATABASE_URL=postgresql://isagihere_app:[PASSWORD]@[CLOUD_SQL_IP]:5432/isagihere" > .env.local
```

### 4.3 Run Migrations
```bash
# Install dependencies first
pnpm install

# Run database generation and migration
pnpm --filter @workspace/db run generate
pnpm --filter @workspace/db run migrate

# Verify schema created:
# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## Step 5: Deploy to Cloud Run (15 minutes)

### 5.1 Set Environment Variables in Cloud Run

Go to **Cloud Console → Cloud Run** → Create Service (or update existing)

Create a `.env.production` file with secrets (do NOT commit to Git):

```bash
# Create temporary secrets file
cat > /tmp/cloudrun-secrets.txt << 'EOF'
DATABASE_URL=postgresql://isagihere_app:[PASSWORD]@cloudsql/PROJECT_ID:asia-south1:isagihere-db/isagihere
ANTHROPIC_API_KEY=sk-ant-...
CLERK_SECRET_KEY=sk_live_...
EOF
```

### 5.2 Deploy via gcloud CLI
```bash
# Option 1: Deploy from local Dockerfile
gcloud run deploy isagihere \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars DATABASE_URL="postgresql://isagihere_app:[PASSWORD]@/isagihere?cloudSqlInstance=PROJECT_ID:asia-south1:isagihere-db&user=isagihere_app&password=[PASSWORD]" \
  --set-env-vars ANTHROPIC_API_KEY="sk-ant-..." \
  --set-env-vars CLERK_SECRET_KEY="sk_live_..." \
  --set-cloudsql-instances PROJECT_ID:asia-south1:isagihere-db

# Wait for deployment (5-10 minutes)
# You'll get a service URL like: https://isagihere-xxxxx-as.a.run.app
```

### 5.3 Verify Deployment
```bash
# Check service status
gcloud run services describe isagihere --region asia-south1

# Or visit the URL in your browser to verify frontend loads
curl https://isagihere-xxxxx-as.a.run.app

# Check logs for errors
gcloud run services describe isagihere --region asia-south1 --format="get(status.url)"
gcloud logging read "resource.type=cloud_run_revision" --limit=50 --format=json
```

---

## Step 6: Update DNS & Domain (5 minutes)

### 6.1 Get Cloud Run Service URL
```bash
# Get the auto-generated URL
gcloud run services describe isagihere --region asia-south1 \
  --format="get(status.url)"

# You'll get something like:
# https://isagihere-xxxxx-asia-south1.a.run.app
```

### 6.2 Update Domain DNS

**Option A: Point Domain to Cloud Run (Easiest)**
```
Go to your domain registrar (GoDaddy, Namecheap, etc.)
Update CNAME record:
  Name: @  (or leave blank for root)
  Target: isagihere-xxxxx-asia-south1.a.run.app

Wait 5-15 minutes for DNS to propagate
```

**Option B: Use Cloud CDN + Custom Domain**
```bash
# Create SSL certificate
gcloud compute ssl-certificates create isagihere-cert \
  --domains=isagihere.wiki

# Create load balancer to point to Cloud Run
# (More complex, not needed unless you want CDN)
```

### 6.3 Verify Domain Works
```bash
# Test DNS resolution
nslookup isagihere.wiki

# Visit https://isagihere.wiki in browser
# Should load your isAGIhere site with HTTPS ✅
```

---

## Step 7: Seed Data (10 minutes)

### 7.1 Connect to Cloud SQL
```bash
# Use Cloud Shell or local proxy to connect
gcloud sql connect isagihere-db --user=isagihere_app

# Or use psql with proxy running:
psql postgresql://isagihere_app:[PASSWORD]@localhost:5432/isagihere
```

### 7.2 Run Seed Script
```bash
# In your local repo:
pnpm --filter @workspace/api-server run seed

# Or manually via Cloud Shell SQL client:
# (copy seed data SQL from scripts/src/seed.ts and run)
```

---

## Step 8: Enable Schedulers (5 minutes)

### 8.1 Enable Cloud Scheduler for Interview Fetching
```bash
# The interview scheduler runs automatically in the app
# But you can set up Cloud Scheduler for redundancy:

gcloud scheduler jobs create pubsub interview-refresh \
  --schedule="0 */6 * * *" \
  --topic=isagighere-refresh \
  --message-body='{"action":"refresh-interviews"}'

# The app will pick up scheduled messages via Pub/Sub
# (Requires additional setup; for now, scheduler runs in-app)
```

---

## Step 9: Verify Everything Works (5 minutes)

### 9.1 Test API Endpoints
```bash
# Test health check
curl https://isagihere.wiki/api/health

# Test featured data
curl https://isagihere.wiki/api/featured

# Test interview fetch (may take a minute)
curl -X POST https://isagihere.wiki/api/interviews/refresh
```

### 9.2 Check Production Logs
```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=isagihere" \
  --limit=100 \
  --format=json

# Or in Cloud Console: Cloud Run → isagihere → Logs tab
```

### 9.3 Monitor Costs
```bash
# View GCP billing/usage
# Cloud Console → Billing → Usage & Quotas

# You should see:
# - Cloud Run invocations: free tier (2M/month)
# - Cloud SQL: free tier (10GB storage included)
# - Data transfer: minimal
```

---

## Troubleshooting

### Problem: 500 Error on isagihere.wiki

**Check logs:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=isagihere" \
  --limit=50 \
  --format="table(timestamp, jsonPayload.message, severity)"
```

**Common causes:**
- `DATABASE_URL` env var not set → check `gcloud run services describe isagihere`
- Database not connected → check firewall rules allow Cloud Run to connect to Cloud SQL
- Missing ANTHROPIC_API_KEY → verify secret is set

### Problem: Database Connection Timeout

**Solution:**
```bash
# Cloud Run needs explicit Cloud SQL instance connection
# Use the exact connection string format:
# postgresql://user:password@/database?cloudSqlInstance=PROJECT_ID:REGION:INSTANCE_NAME

# Verify from Cloud Console:
# Cloud SQL → isagihere-db → Connection name (copy exactly)
```

### Problem: Domain Shows Old Replit Site

**Solution:**
```bash
# DNS propagation takes 5-15 minutes
# Clear your local DNS cache:
# macOS: sudo dscacheutil -flushcache
# Linux: sudo systemctl restart nscd
# Windows: ipconfig /flushdns

# Force refresh in browser: Ctrl+Shift+R (hard refresh)
```

---

## Next Steps

1. ✅ App is live at https://isagihere.wiki
2. Monitor free trial credits (expires June 11, 2026)
3. After credits expire, verify costs are acceptable (~$5-10/month)
4. Set up billing alerts: Cloud Console → Billing → Budgets & Alerts

---

## Rollback to Replit (If Needed)

```bash
# If you need to go back to Replit:
# 1. Push all code changes to GitHub
# 2. In Replit: git pull
# 3. Replit will rebuild and redeploy automatically
# 4. Update DNS to point back to Replit URL

# Your GCP resources remain but stop incurring charges
```

---

## Cost Breakdown (After Free Trial)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Cloud Run | $0-2 | First 2M invocations/month free |
| Cloud SQL | $5-10 | Minimal compute, storage included |
| Data Transfer | $0-1 | Minimal |
| **Total** | **$5-13/month** | Well under free tier even after trial |

Your ₹27,287 credits cover 5-6+ months of full usage.

---

**Last Updated:** 2026-04-14  
**Status:** Ready for deployment  
**Estimated Completion:** 60 minutes
