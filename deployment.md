# Adora AI — Production Cloud Deployment Guide

**Product:** Adora AI  
**Tagline:** Reflective Intelligence. Adaptive Action.  
**Authoritative Backend:** Python 3.12 (FastAPI) & Node.js/TypeScript (Express)  
**Target Cloud Runtime:** Google Cloud Run (Serverless Container Platform)  
**Database:** Google Cloud Firestore (`ai-studio-adoraai-cca6b399-4191-499a-99af-4c18cde0b8b9`)  
**AI Intelligence:** NVIDIA Nemotron-4-340B-Instruct & Nemotron-3-8B via Nebius Token Factory & Google Gemini  

---

## 1. System Architecture Overview

Adora AI is built on a modular, secure, and resilient architecture designed for seamless cloud deployment. The core operating loop (**CAPTURE → UNDERSTAND → ACT → VERIFY → LEARN**) runs between a React 19 frontend and an authoritative backend service connected to Google Cloud Firestore and AI inference providers.

```
                           +---------------------------+
                           |   Client Web Browser      |
                           |   (React 19 + TypeScript) |
                           +-------------+-------------+
                                         | HTTPS
                                         v
+-----------------------------------------------------------------------------------+
| Google Cloud Run (Serverless Container Runtime)                                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Unified Container (Port 8080)                                               |  |
|  |                                                                             |  |
|  |  +---------------------------+        +----------------------------------+  |  |
|  |  |  React Static SPA Build   |        |  FastAPI Authoritative Backend   |  |  |
|  |  |  (/dist - Vite / Tailwind)| <----+ |  (Python 3.12 / Uvicorn)         |  |  |
|  |  +---------------------------+        +-----------------+----------------+  |  |
|  +---------------------------------------------------------|-------------------+  |
+------------------------------------------------------------|----------------------+
                                                             |
                 +-------------------------------------------+-------------------------------------------+
                 |                                           |                                           |
                 v                                           v                                           v
   +---------------------------+               +---------------------------+               +---------------------------+
   |   Google Cloud Firestore  |               |    Nebius Token Factory   |               |   Google Gemini AI API    |
   |   (Database ID:           |               |    (NVIDIA Nemotron 340B  |               |   (Multimodal Analysis,   |
   |   ai-studio-adoraai-...)  |               |     & 8B Instruct Models) |               |    Audio Transcription)   |
   +---------------------------+               +---------------------------+               +---------------------------+
```

---

## 2. Cloud Resources & Project Configuration

| Resource | Value / Identifier | Notes |
| :--- | :--- | :--- |
| **GCP Project ID** | `gen-lang-client-0651785302` | Provisioned project |
| **Firestore Database ID** | `ai-studio-adoraai-cca6b399-4191-499a-99af-4c18cde0b8b9` | Dedicated multi-region/regional Firestore instance |
| **Cloud Run Service Name**| `adora-ai-app` | Unified container service |
| **Artifact Registry Repo**| `adora-repo` | Container image repository |
| **Primary Region** | `asia-southeast1` or `us-central1` | Default matching applet region |

---

## 3. Environment Variables & Secret Configuration

Configure the following environment variables in Google Cloud Run (recommended via **GCP Secret Manager** for sensitive credentials):

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `8080` | Internal container port injected by Cloud Run |
| `ENVIRONMENT` | Yes | `production` | Application operational environment |
| `LOG_LEVEL` | No | `info` | Logging verbosity (`debug`, `info`, `warning`, `error`) |
| `FIREBASE_PROJECT_ID` | Yes | `gen-lang-client-0651785302` | GCP Project ID for Firebase Admin SDK |
| `FIREBASE_DATABASE_ID` | Yes | `ai-studio-adoraai-cca6b399-4191-499a-99af-4c18cde0b8b9` | Target Cloud Firestore database instance |
| `NEBIUS_API_KEY` | Yes | `neb-...` | API Key for Nebius Token Factory (NVIDIA Nemotron) |
| `NEBIUS_BASE_URL` | No | `https://api.studio.nebius.ai/v1` | Nebius API endpoint base URL |
| `NEBIUS_MODEL` | No | `nvidia/nemotron-4-340b-instruct` | Primary cognitive and planning LLM |
| `NEBIUS_FAST_MODEL`| No | `nvidia/nemotron-3-8b-instruct` | Fast synthesis / classification LLM |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` | Gemini AI API key for multimodal & audio tasks |
| `TAVILY_API_KEY` | No | `tvly-...` | Web search agentic tool (optional) |

---

## 4. Pre-Deployment Setup (One-Time)

### 4.1 Install and Authenticate Google Cloud CLI

```bash
# 1. Log in with your authorized Google Cloud account
gcloud auth login

# 2. Set active GCP project
gcloud config set project gen-lang-client-0651785302

# 3. Configure Google Application Default Credentials (for local testing/CLI access)
gcloud auth application-default login
```

### 4.2 Enable Required Google Cloud APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com
```

### 4.3 Create Artifact Registry Repository

```bash
gcloud artifacts repositories create adora-repo \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Docker repository for Adora AI containers"
```

### 4.4 Store Secrets in GCP Secret Manager

```bash
# Create Nebius Token Factory Secret
printf "%s" "YOUR_NEBIUS_API_KEY" | gcloud secrets create nebius-api-key \
  --data-file=- \
  --replication-policy="automatic"

# Create Gemini API Secret
printf "%s" "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"
```

---

## 5. Deploy Cloud Firestore Security Rules

Ensure the tamper-evident ledger and role-based access rules are active on the database:

```bash
# Using Firebase CLI:
firebase deploy --only firestore:rules --project gen-lang-client-0651785302
```

The deployed `firestore.rules` enforces:
1. Strict user-data isolation: `isOwner(userId)`.
2. Immutability on execution receipts: `allow update: if false; allow delete: if false;`
3. Consequentiality tier checks on tasks (Tier 2 requires explicit user approval).
4. Schema validation for reflections, memories, insights, workflows, and grove nodes.

---

## 6. Container Build & Cloud Run Deployment

### Option A: Unified Container (Frontend + Python Backend) [Recommended]

This builds the React 19 frontend into static assets and packages it with the Python FastAPI backend in a single container.

#### 1. Build and push container using Google Cloud Build:

```bash
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-app:v1.0.0 .
```

#### 2. Deploy to Google Cloud Run:

```bash
gcloud run deploy adora-ai-app \
  --image asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-app:v1.0.0 \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars="ENVIRONMENT=production,FIREBASE_PROJECT_ID=gen-lang-client-0651785302,FIREBASE_DATABASE_ID=ai-studio-adoraai-cca6b399-4191-499a-99af-4c18cde0b8b9" \
  --set-secrets="NEBIUS_API_KEY=nebius-api-key:latest,GEMINI_API_KEY=gemini-api-key:latest"
```

---

### Option B: Standalone Python Backend Microservice

If you prefer deploying the Python backend as a dedicated microservice:

#### 1. Build and push the backend container:

```bash
cd backend
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-backend:v1.0.0 .
cd ..
```

#### 2. Deploy backend service to Cloud Run:

```bash
gcloud run deploy adora-backend-api \
  --image asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-backend:v1.0.0 \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars="ENVIRONMENT=production,FIREBASE_PROJECT_ID=gen-lang-client-0651785302,FIREBASE_DATABASE_ID=ai-studio-adoraai-cca6b399-4191-499a-99af-4c18cde0b8b9" \
  --set-secrets="NEBIUS_API_KEY=nebius-api-key:latest,GEMINI_API_KEY=gemini-api-key:latest"
```

#### 3. Build & host the React Frontend on Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting --project gen-lang-client-0651785302
```

---

## 7. Automated CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml` to trigger continuous deployment whenever code merges to `main`:

```yaml
name: Deploy Adora AI to Google Cloud Run

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Authorize Docker Push
        run: gcloud auth configure-docker asia-southeast1-docker.pkg.dev

      - name: Build and Push Docker Image
        run: |
          IMAGE_TAG="asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-app:${{ github.sha }}"
          docker build -t "$IMAGE_TAG" -t "asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-app:latest" .
          docker push "$IMAGE_TAG"
          docker push "asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-app:latest"

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy adora-ai-app \
            --image="asia-southeast1-docker.pkg.dev/gen-lang-client-0651785302/adora-repo/adora-app:${{ github.sha }}" \
            --region=asia-southeast1 \
            --platform=managed
```

---

## 8. Verification & Operational Health Checks

Once deployed, verify the service endpoints using `curl` or browser:

```bash
# Obtain Cloud Run Service URL:
SERVICE_URL=$(gcloud run services describe adora-ai-app --region asia-southeast1 --format='value(status.url)')

# 1. Health Probe
curl -i "$SERVICE_URL/api/v1/health"
# Expected: HTTP 200 {"status":"healthy","version":"1.0.0",...}

# 2. Interactive Swagger / OpenAPI UI
open "$SERVICE_URL/docs"

# 3. Web Application Entry
open "$SERVICE_URL"
```

---

## 9. Monitoring, Logs & Rollback

### 9.1 Live Log Stream

```bash
gcloud beta run services logs tail adora-ai-app --region asia-southeast1
```

Filter by correlation ID:
```bash
gcloud logging read 'resource.type="cloud_run_revision" AND textPayload:"corr:"' --limit 20
```

### 9.2 Instant Zero-Downtime Rollback

If a newly deployed revision encounters unexpected errors:

```bash
# 1. List past revisions
gcloud run revisions list --service adora-ai-app --region asia-southeast1

# 2. Route 100% traffic immediately to the stable prior revision
gcloud run services update-traffic adora-ai-app \
  --region asia-southeast1 \
  --to-revisions=adora-ai-app-PREVIOUS_REVISION=100
```

---

## 10. Security & Compliance Checklist

- [x] **Default-Deny Security Rules**: Cloud Firestore enforced via `firestore.rules`.
- [x] **Tamper-Evident Receipts**: Execution receipts use SHA-256 payload hashing and immutable write-only permissions.
- [x] **Tiered Consequentiality**: High-consequential actions (Tier 2) mandate human-in-the-loop approval before execution.
- [x] **Zero Plaintext Secrets**: Sensitive keys managed via Google Cloud Secret Manager.
- [x] **Serverless Auto-Scaling**: Cloud Run scales from 0 to 10 instances dynamically based on traffic demand.
