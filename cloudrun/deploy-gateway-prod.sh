#!/bin/bash
set -euo pipefail
echo "🚀 Deploying OpenClaw Gateway to PRODUCTION..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OPENCLAW_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$ROOT_DIR/allais/scripts/require-human-prod-deploy.sh"
PROJECT="moholo-beta"
REGION="us-central1"
SERVICE="openclaw-gateway-production"
IMAGE="$REGION-docker.pkg.dev/$PROJECT/cloud-run-source-deploy/$SERVICE:latest"

cd "$OPENCLAW_DIR"

echo "🔨 Building Docker image locally..."
docker build -t "$IMAGE" .

echo "📤 Pushing image..."
docker push "$IMAGE"

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT" \
  --allow-unauthenticated \
  --platform managed \
  --cpu 2 \
  --memory 2Gi \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 40 \
  --timeout 600 \
  --command "node" \
  --args "openclaw.mjs,gateway,--allow-unconfigured,--bind,lan,--port,8080" \
  --set-env-vars "OPENCLAW_CONFIG_PATH=/app/cloudrun/openclaw.gateway.json5,GOOGLE_CLOUD_PROJECT=moholo-beta,NODE_ENV=production" \
  --set-secrets "OPENCLAW_GATEWAY_TOKEN=OPENCLAW_GATEWAY_TOKEN:latest,GOOGLE_API_KEY=GOOGLE_API_KEY:latest"

echo "🔄 Routing traffic to new revision..."
gcloud run services update-traffic "$SERVICE" \
  --region "$REGION" \
  --project "$PROJECT" \
  --to-latest

GATEWAY_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" --format='value(status.url)')
echo ""
echo "✅ OpenClaw Gateway production deployment complete!"
echo "📌 Gateway URL: $GATEWAY_URL"
