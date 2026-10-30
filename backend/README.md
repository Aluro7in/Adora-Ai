# Adora AI — Authoritative Python FastAPI Backend

This is the dedicated Python backend service for **Adora AI**, powering reflective intelligence, persistent memory governance, and agentic execution for the **NVIDIA × Nebius Global AI Hackathon (Best Apps and Agents Track)**.

## Architecture

- **Runtime**: Python 3.12 / FastAPI
- **Inference**: NVIDIA Nemotron models hosted on **Nebius Token Factory** (`https://api.studio.nebius.ai/v1`)
- **Database & Auth**: Google Cloud Firestore & Firebase Admin SDK
- **Agent Lifecycle**: 8-state deterministic execution engine with Tier 2 human-in-the-loop approval gates
- **Verification**: Post-execution independent read-back state assertions with SHA-256 cryptographic receipt digests

## Quickstart

### 1. Environment Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set your `NEBIUS_API_KEY` in `.env`.

### 2. Run Locally

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive OpenAPI documentation will be available at:
`http://localhost:8000/docs`

### 3. Run Tests

```bash
pytest tests/
```

### 4. Container Deployment (Cloud Run / Nebius AI Cloud)

```bash
docker build -t adora-backend .
docker run -p 8000:8000 --env-file .env adora-backend
```
