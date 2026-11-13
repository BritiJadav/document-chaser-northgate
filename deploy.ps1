# Northgate Bank Document Chaser Copilot - GCP Cloud Run Deployment
param(
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "asia-south1" }),
    [string]$SecretName = "gemini-api-key",
    [string]$Model = $(if ($env:GEMINI_MODEL) { $env:GEMINI_MODEL } else { "gemini-3-flash-preview" })
)

$env:CLOUDSDK_PYTHON = "C:\Python315\python.exe"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Northgate Bank Document Chaser - GCP Lab Cloud Run Deploy     " -ForegroundColor Cyan
Write-Host "  Region: $Region | Model: $Model" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Detect Project ID if not supplied
if (-not $ProjectId) {
    $rawVal = (& gcloud config get-value project 2>$null | Out-String).Trim()
    if ($rawVal -and $rawVal -ne "(unset)") {
        $ProjectId = $rawVal
    }
}

if (-not $ProjectId -or $ProjectId -eq "(unset)") {
    Write-Host "[!] No active GCP project configured." -ForegroundColor Yellow
    Write-Host "Please authenticate with Google Cloud and set your project:" -ForegroundColor Yellow
    Write-Host "   1. gcloud auth login" -ForegroundColor Green
    Write-Host "   2. gcloud config set project YOUR_LAB_PROJECT_ID" -ForegroundColor Green
    Write-Host "Then re-run: .\deploy.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "Target Project: $ProjectId" -ForegroundColor Green
Write-Host "Lab Region:     $Region" -ForegroundColor Green
Write-Host "Approved Model: $Model" -ForegroundColor Green

# Identify Service Account for deployment
$ownerSa = "slabsuser41-service-account@${ProjectId}.iam.gserviceaccount.com"
$stagingBucket = "gs://run-sources-${ProjectId}-${Region}"
$repoUri = "${Region}-docker.pkg.dev/${ProjectId}/cloud-run-source-deploy"

# 1. Verify/Prepare Asia-South1 Storage Bucket with Org Retention Policy (1440s)
Write-Host "`n[1/5] Ensuring compliance with GCP Lab storage constraints (asia-south1, retention: 1440s)..." -ForegroundColor Cyan
$null = & gcloud storage buckets describe "$stagingBucket" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating regional staging bucket: $stagingBucket..." -ForegroundColor Yellow
    & gcloud storage buckets create "$stagingBucket" --location="$Region" --retention-period="1440s" --project="$ProjectId" 2>$null
} else {
    Write-Host "Staging bucket '$stagingBucket' verified." -ForegroundColor Green
}

# 2. Configure Secret Manager for GEMINI_API_KEY in Asia-South1
Write-Host "`n[2/5] Configuring Secret Manager for GEMINI_API_KEY..." -ForegroundColor Cyan
$null = & gcloud secrets describe "$SecretName" --project="$ProjectId" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating user-managed secret '$SecretName' in $Region..." -ForegroundColor Yellow
    & gcloud secrets create "$SecretName" --replication-policy="user-managed" --locations="$Region" --project="$ProjectId" 2>$null

    $apiKey = $env:GEMINI_API_KEY
    if (-not $apiKey) {
        Write-Host "Press [ENTER] to use Vertex AI / offline mode, or paste your GEMINI_API_KEY:" -ForegroundColor Yellow
        $apiKey = Read-Host "GEMINI_API_KEY"
    }
    if ($apiKey -and $apiKey.Trim()) {
        $apiKey.Trim() | & gcloud secrets versions add "$SecretName" --data-file=- --project="$ProjectId"
        Write-Host "Added GEMINI_API_KEY to Secret Manager." -ForegroundColor Green
    } else {
        "unconfigured" | & gcloud secrets versions add "$SecretName" --data-file=- --project="$ProjectId"
        Write-Host "Secret configured in fallback mode. App uses Vertex AI or deterministic rules." -ForegroundColor Green
    }
} else {
    Write-Host "Secret '$SecretName' verified in Secret Manager." -ForegroundColor Green
}

# 3. Build & Deploy Backend to Cloud Run
Write-Host "`n[3/5] Building & Deploying Backend to Cloud Run in $Region..." -ForegroundColor Cyan
$backendImage = "${repoUri}/northgate-chaser-backend:latest"

& gcloud builds submit ./backend `
    --region="$Region" `
    --config=./backend/cloudbuild.yaml `
    --gcs-source-staging-dir="${stagingBucket}/source" `
    --service-account="projects/${ProjectId}/serviceAccounts/${ownerSa}" `
    --project="$ProjectId"

$backendDeployArgs = @(
    "run", "deploy", "northgate-chaser-backend",
    "--image=$backendImage",
    "--region=$Region",
    "--platform=managed",
    "--allow-unauthenticated",
    "--port=8000",
    "--service-account=$ownerSa",
    "--set-secrets=GEMINI_API_KEY=${SecretName}:latest",
    "--set-env-vars=ENVIRONMENT=production,GOOGLE_CLOUD_PROJECT=${ProjectId},GCP_REGION=${Region},GEMINI_MODEL=${Model},DB_PATH=/tmp/document_chaser.db",
    "--project=$ProjectId"
)
& gcloud @backendDeployArgs

$BackendUrl = (& gcloud run services describe northgate-chaser-backend --region="$Region" --project="$ProjectId" --format="value(status.url)" 2>$null | Out-String).Trim()
Write-Host "Backend successfully deployed at: $BackendUrl" -ForegroundColor Green

# 4. Build & Deploy Frontend to Cloud Run
Write-Host "`n[4/5] Building & Deploying Frontend to Cloud Run in $Region..." -ForegroundColor Cyan
Push-Location frontend
$env:VITE_API_URL = $BackendUrl
npm run build
Pop-Location

$frontendImage = "${repoUri}/northgate-chaser-frontend:latest"

& gcloud builds submit ./frontend `
    --region="$Region" `
    --config=./frontend/cloudbuild.yaml `
    --gcs-source-staging-dir="${stagingBucket}/source" `
    --service-account="projects/${ProjectId}/serviceAccounts/${ownerSa}" `
    --project="$ProjectId"

$frontendDeployArgs = @(
    "run", "deploy", "northgate-chaser-frontend",
    "--image=$frontendImage",
    "--region=$Region",
    "--platform=managed",
    "--allow-unauthenticated",
    "--port=80",
    "--service-account=$ownerSa",
    "--set-env-vars=VITE_API_URL=$BackendUrl",
    "--project=$ProjectId"
)
& gcloud @frontendDeployArgs

$FrontendUrl = (& gcloud run services describe northgate-chaser-frontend --region="$Region" --project="$ProjectId" --format="value(status.url)" 2>$null | Out-String).Trim()

# 5. Summary
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "GCP LAB DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Frontend Application:  $FrontendUrl" -ForegroundColor Green
Write-Host "Backend Service:       $BackendUrl/health" -ForegroundColor Green
Write-Host "Interactive API Docs:  $BackendUrl/docs" -ForegroundColor Green
Write-Host "GCP Region:            $Region (Asia-South1)" -ForegroundColor Green
Write-Host "Reasoning Model:       $Model (Vertex AI & Secret Manager)" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
