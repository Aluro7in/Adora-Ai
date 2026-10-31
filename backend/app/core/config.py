"""
Adora AI — Backend Configuration Settings
Supports Pydantic BaseSettings with graceful fallback to standard os.getenv.
"""

import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    _has_pydantic_settings = True
except ImportError:
    _has_pydantic_settings = False


if _has_pydantic_settings:
    class Settings(BaseSettings):
        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore"
        )

        APP_NAME: str = "Adora AI Authoritative Backend"
        ENVIRONMENT: str = "production"
        PORT: int = 8001
        LOG_LEVEL: str = "info"

        NEBIUS_API_KEY: Optional[str] = None
        NEBIUS_BASE_URL: str = "https://api.studio.nebius.ai/v1"
        NEBIUS_MODEL: str = "nvidia/nemotron-4-340b-instruct"
        NEBIUS_FAST_MODEL: str = "nvidia/nemotron-3-8b-instruct"

        FIREBASE_PROJECT_ID: Optional[str] = None
        FIREBASE_CREDENTIALS_PATH: Optional[str] = None
        TAVILY_API_KEY: Optional[str] = None

    settings = Settings()
else:
    class FallbackSettings:
        def __init__(self):
            self.APP_NAME = os.getenv("APP_NAME", "Adora AI Authoritative Backend")
            self.ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
            self.PORT = int(os.getenv("PORT", "8001"))
            self.LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

            self.NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY")
            self.NEBIUS_BASE_URL = os.getenv("NEBIUS_BASE_URL", "https://api.studio.nebius.ai/v1")
            self.NEBIUS_MODEL = os.getenv("NEBIUS_MODEL", "nvidia/nemotron-4-340b-instruct")
            self.NEBIUS_FAST_MODEL = os.getenv("NEBIUS_FAST_MODEL", "nvidia/nemotron-3-8b-instruct")

            self.FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
            self.FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
            self.TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

    settings = FallbackSettings()
