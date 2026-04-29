#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Building frontend..."
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/ai-hub run build

echo "Deploying to GCP..."
bash deploy-gcp.sh
