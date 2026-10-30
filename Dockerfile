# =====================================================================
# ADORA AI — UNIFIED PRODUCTION DOCKERFILE FOR GOOGLE CLOUD RUN
# Multi-stage build: React SPA Frontend + Python FastAPI Backend
# =====================================================================

# ---------------------------------------------------------------------
# Stage 1: Build React 19 Frontend with Vite
# ---------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /build

COPY package.json ./
# Install npm dependencies
RUN npm install --legacy-peer-deps

COPY index.html tsconfig.json vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/

# Build static client assets into /build/dist
RUN npm run build

# ---------------------------------------------------------------------
# Stage 2: Production Python 3.12 Runtime
# ---------------------------------------------------------------------
FROM python:3.12-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

# Install minimal OS dependencies for network & TLS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI backend code
COPY backend/app/ ./app/
COPY backend/README.md ./

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /build/dist ./dist

EXPOSE 8080

# Cloud Run injects $PORT environment variable (defaults to 8080)
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2
