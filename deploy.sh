#!/usr/bin/env bash
# ==============================================================================
# Northgate Bank Document Chaser Copilot - GCP Cloud Run Deployment Script
# Tailored for GCP Lab Usage Restrictions:
#   - Region: asia-south1 (Required for Cloud Storage & regional services)
#   - Storage Retention Policy: 1440s
#   - Compute: Cloud Run (containerized)
#   - Secret Manager: Stores GEMINI_API_KEY in asia-south1
#   - AI Services: Vertex AI with approved model Gemini 3 Flash Preview (gemini-3-flash-preview)
#   - Observability: Cloud Logging & Monitoring
# ==============================================================================

set -euo pipefail

# Configuration adhering to GCP Lab Instructions
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null | grep -v '^\[' | tail -n1)}"
REGION="${GCP_REGION:-asia-south1}" # Lab restriction: asia-south1
SECRET_NAME="${GCP_SECRET_NAME:-gemini-api-key}"
APPROVED_MODEL="${GEMINI_MODEL:-gemini-3-flash-preview}"

BACKEND_SERVICE="northgate-chaser-backend"
FRONTEND_SERVICE="northgate-chaser-frontend"
OWNER_SA="slabsuser41-service-account@${PROJECT_ID}.iam.gserviceaccount.com"
STAGING_BUCKET="gs://run-sources-${PROJECT_ID}-${REGION}"
REPO_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy"

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  Northgate Bank Document Chaser - GCP Lab Cloud Run Deploy     ${NC}"
echo -e "${BLUE}  Region: asia-south1 | Model: ${APPROVED_MODEL}                 ${NC}"
echo -e "${BLUE}================================================================${NC}"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo -e "${RED}Error: GCP project ID is not set.${NC}"
    echo -e "Please run: gcloud config set project YOUR_LAB_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Target Project:${NC} $PROJECT_ID"
echo -e "${GREEN}✓ Lab Region:${NC}     $REGION (Asia-South1)"
echo -e "${GREEN}✓ Approved Model:${NC} $APPROVED_MODEL"

# 1. Prepare Staging Bucket with Org Retention Policy
echo -e "\n${BLUE}[1/5] Ensuring compliance with GCP Lab storage constraints (asia-south1, retention: 1440s)...${NC}"
if ! gcloud storage buckets describe "$STAGING_BUCKET" >/dev/null 2>&1; then
    gcloud storage buckets create "$STAGING_BUCKET" --location="$REGION" --retention-period="1440s" --project="$PROJECT_ID" || true
fi

# 2. Configure Secret Manager for GEMINI_API_KEY in Asia-South1
echo -e "\n${BLUE}[2/5] Configuring Secret Manager for GEMINI_API_KEY...${NC}"
if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating secret '$SECRET_NAME' in $REGION...${NC}"
    gcloud secrets create "$SECRET_NAME" \
        --replication-policy="user-managed" \
        --locations="$REGION" \
        --project="$PROJECT_ID"
    
    if [ -n "${GEMINI_API_KEY:-}" ]; then
        echo -n "$GEMINI_API_KEY" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
        echo -e "${GREEN}✓ Added GEMINI_API_KEY to Secret Manager.${NC}"
    else
        read -rsp "Enter your GEMINI_API_KEY (or press Enter to run in offline fallback mode): " USER_KEY || true
        echo ""
        if [ -n "${USER_KEY:-}" ]; then
            echo -n "$USER_KEY" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
            echo -e "${GREEN}✓ Added key to Secret Manager.${NC}"
        else
            echo -n "unconfigured" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
            echo -e "${YELLOW}Notice: Placeholder saved. App runs in deterministic offline fallback mode.${NC}"
        fi
    fi
else
    echo -e "${GREEN}✓ Secret '$SECRET_NAME' verified in Secret Manager.${NC}"
fi

# 3. Build & Deploy Backend
echo -e "\n${BLUE}[3/5] Building & Deploying Backend to Cloud Run in ${REGION}...${NC}"
BACKEND_IMAGE="${REPO_URI}/northgate-chaser-backend:latest"

gcloud builds submit ./backend \
    --region="$REGION" \
    --config=./backend/cloudbuild.yaml \
    --gcs-source-staging-dir="${STAGING_BUCKET}/source" \
    --service-account="projects/${PROJECT_ID}/serviceAccounts/${OWNER_SA}" \
    --project="$PROJECT_ID"

gcloud run deploy "$BACKEND_SERVICE" \
    --image="$BACKEND_IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=8000 \
    --service-account="$OWNER_SA" \
    --set-secrets="GEMINI_API_KEY=${SECRET_NAME}:latest" \
    --set-env-vars="ENVIRONMENT=production,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCP_REGION=${REGION},GEMINI_MODEL=${APPROVED_MODEL},DB_PATH=/tmp/document_chaser.db" \
    --project="$PROJECT_ID"

BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)")
echo -e "${GREEN}✓ Backend successfully deployed at:${NC} $BACKEND_URL"

# 4. Build & Deploy Frontend
echo -e "\n${BLUE}[4/5] Building & Deploying Frontend to Cloud Run in ${REGION}...${NC}"
cd frontend
export VITE_API_URL="${BACKEND_URL}"
npm run build
cd ..

FRONTEND_IMAGE="${REPO_URI}/northgate-chaser-frontend:latest"

gcloud builds submit ./frontend \
    --region="$REGION" \
    --config=./frontend/cloudbuild.yaml \
    --gcs-source-staging-dir="${STAGING_BUCKET}/source" \
    --service-account="projects/${PROJECT_ID}/serviceAccounts/${OWNER_SA}" \
    --project="$PROJECT_ID"

gcloud run deploy "$FRONTEND_SERVICE" \
    --image="$FRONTEND_IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=80 \
    --service-account="$OWNER_SA" \
    --set-env-vars="VITE_API_URL=${BACKEND_URL}" \
    --project="$PROJECT_ID"

FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)")

# 5. Deployment Summary
echo -e "\n${BLUE}================================================================${NC}"
echo -e "${GREEN}✓ GCP LAB DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "Frontend Application:  ${GREEN}${FRONTEND_URL}${NC}"
echo -e "Backend Service:       ${GREEN}${BACKEND_URL}/health${NC}"
echo -e "Interactive API Docs:  ${GREEN}${BACKEND_URL}/docs${NC}"
echo -e "GCP Region:            ${GREEN}${REGION}${NC} (Asia-South1)"
echo -e "Reasoning Model:       ${GREEN}${APPROVED_MODEL}${NC} (Vertex AI)"
echo -e "${BLUE}================================================================${NC}"
