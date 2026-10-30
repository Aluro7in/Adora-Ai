"""
Adora AI — Backend Configuration Settings
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "Adora AI Authoritative Backend"
    ENVIRONMENT: str = "production"
    PORT: int = 8000
    LOG_LEVEL: str = "info"

    # Nebius Token Factory & NVIDIA Nemotron
    NEBIUS_API_KEY: Optional[str] = None
    NEBIUS_BASE_URL: str = "https://api.studio.nebius.ai/v1"
    NEBIUS_MODEL: str = "nvidia/nemotron-4-340b-instruct"
    NEBIUS_FAST_MODEL: str = "nvidia/nemotron-3-8b-instruct"

    # Firebase & Firestore
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None

    # Tavily Web Search (Optional)
    TAVILY_API_KEY: Optional[str] = None


settings = Settings()
