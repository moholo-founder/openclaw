#!/bin/bash
set -euo pipefail
echo "🚀 Deploying OpenClaw Gateway to PRODUCTION..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OPENCLAW_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
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
  --set-env-vars "\
OPENCLAW_CONFIG_PATH=/app/cloudrun/openclaw.gateway.json5,\
OPENCLAW_GATEWAY_TOKEN=3df1cf59c3ff0cbfc37074a6e810f8b2a7f2ff9d24a578f5445fcf2e29082679,\
GOOGLE_API_KEY=AIzaSyBaa2iB3QYhfK18E2EPmLA7uey0cQETltU,\
GOOGLE_CLOUD_PROJECT=moholo-beta,\
NODE_ENV=production"

echo "🔄 Routing traffic to new revision..."
gcloud run services update-traffic "$SERVICE" \
  --region "$REGION" \
  --project "$PROJECT" \
  --to-latest

GATEWAY_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" --format='value(status.url)')
echo ""
echo "✅ OpenClaw Gateway production deployment complete!"
echo "📌 Gateway URL: $GATEWAY_URL"
