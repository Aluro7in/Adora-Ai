# ADORA AI — DEPLOYMENT & INFRASTRUCTURE GUIDE

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Target Platform:** Google Cloud Run (Containerized Node.js Runtime)  
**Port Binding:** 3000  

---

## 1. Hosting Architecture & Environment Overview

Adora AI is packaged as a unified full-stack application deployed to **Google Cloud Run**.

- **Dev Server**: Runs `tsx server.ts` on port 3000 with Vite middleware dynamically mounted.
- **Production Server**: Bundles client assets via `npm run build` into `dist/`. The Express backend serves static production assets while executing authoritative API routes on `/api/v1/*`.
- **Runtime Port**: Bound to `process.env.PORT || 3000`.

---

## 2. Environment Variables & Secrets Configuration

All sensitive secrets are strictly server-side and managed via AI Studio Secrets / Cloud Secret Manager:

| Variable Name | Required | Scope | Description |
|---------------|----------|-------|-------------|
| `PORT` | Yes | Server | Port for Express server (defaults to 3000). |
| `NEBIUS_API_KEY` | **Yes** | Server Secret | Bearer token for Nebius Token Factory NVIDIA Nemotron inference. |
| `NEBIUS_BASE_URL` | No | Server | Base URL (defaults to `https://api.studio.nebius.ai/v1`). |
| `NEBIUS_MODEL_ID` | No | Server | Model identifier (defaults to `nvidia/nemotron-4-340b-instruct` or configured Nemotron model). |
| `GEMINI_API_KEY` | **Yes** | Server Secret | Google GenAI API key for audio transcription, TTS, live audio, and high-thinking vision. |
| `APP_URL` | Yes | Server | Canonical deployment URL on Cloud Run. |

---

## 3. Build & Packaging Pipeline

### 3.1 `package.json` Scripts
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "start": "node server.ts",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  }
}
```

### 3.2 Full-Stack Server Integration (`server.ts`)
```typescript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Mount API routes under /api/v1
// app.use('/api/v1', apiRouter);

// Vite middleware in dev; static dist in prod
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Adora AI authoritative server running on port ${PORT}`);
});
```

---

## 4. Google Cloud Run Runtime Specifications
- **Concurrency**: 80 requests per instance.
- **CPU Allocation**: 1 vCPU (scale-to-zero enabled for cost optimization during idle states).
- **Memory**: 1024 MB RAM.
- **Health Check Endpoint**: `/api/v1/health` returning HTTP 200 within 2 seconds.
- **Graceful Shutdown**: SIGTERM and SIGINT signal traps to flush pending audit receipts before container termination.
