"""
Adora AI — Health and Telemetry API Route
"""

from fastapi import APIRouter
from app.core.config import settings
from app.ai.providers.nebius_client import nebius_client

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "inference": {
            "provider": "Nebius Token Factory",
            "model": settings.NEBIUS_MODEL,
            "configured": nebius_client.is_configured(),
        },
        "version": "1.0.0",
    }
