#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env.local ]; then
  echo "ERROR: .env.local is required. Copy .env.example to .env.local and fill in secrets."
  exit 1
fi

set -a
source .env.local
set +a

PROJECT_ID="${PROJECT_ID:?PROJECT_ID is required in .env.local}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-isagihere}"
SQL_INSTANCE="${SQL_INSTANCE:-${PROJECT_ID}:asia-south1:isagihere-db}"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/isagihere-repo/${SERVICE_NAME}"

echo "Enabling required Google Cloud services..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

echo "Building Docker image locally with build-time Vite env vars..."
docker build \
  --platform linux/amd64 \
  --build-arg VITE_PORT="${PORT:-5173}" \
  --build-arg BASE_PATH="${BASE_PATH:-/}" \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY="$VITE_CLERK_PUBLISHABLE_KEY" \
  --build-arg VITE_CLERK_PROXY_URL="$VITE_CLERK_PROXY_URL" \
  --build-arg NODE_ENV="${NODE_ENV:-production}" \
  -t "$IMAGE_NAME" .

echo "Pushing image to Artifact Registry..."

gcloud artifacts repositories describe isagihere-repo --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create isagihere-repo --repository-format=docker --location="$REGION" --description="isAGIhere Docker repo"

docker push "$IMAGE_NAME"

echo "Deploying Cloud Run service..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars "DATABASE_URL=$CLOUD_RUN_DATABASE_URL,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,CLERK_SECRET_KEY=$CLERK_SECRET_KEY,RESEND_API_KEY=$RESEND_API_KEY,LOG_LEVEL=${LOG_LEVEL:-info}" \
  --set-cloudsql-instances "$SQL_INSTANCE"

echo "Deployment complete. Run 'gcloud run services describe $SERVICE_NAME --region $REGION --format=truthy' to inspect the service."