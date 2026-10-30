"""
Adora AI — Authoritative FastAPI Backend Entrypoint
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.router import api_router
import uuid
import time

setup_logging()

app = FastAPI(
    title="Adora AI Authoritative Backend",
    description="Reflective Intelligence. Adaptive Action. Authoritative API service powered by NVIDIA Nemotron via Nebius Token Factory.",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Correlation ID and performance logging middleware
@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    corr_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    start_time = time.time()
    
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    
    response.headers["X-Correlation-ID"] = corr_id
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms) [corr: {corr_id}]"
    )
    return response

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount v1 API
app.include_router(api_router, prefix="/api/v1")

# Check for production frontend build (e.g. in /app/dist or ../../dist)
possible_dist_paths = [
    os.path.join(os.getcwd(), "dist"),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist")),
]
dist_path = next((p for p in possible_dist_paths if os.path.isdir(p)), None)

if dist_path and os.path.exists(os.path.join(dist_path, "index.html")):
    assets_path = os.path.join(dist_path, "assets")
    if os.path.isdir(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return {"error": "API route not found"}
        target_file = os.path.join(dist_path, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "app": "Adora AI",
            "tagline": "Reflective Intelligence. Adaptive Action.",
            "status": "online",
            "docs": "/docs",
        }
