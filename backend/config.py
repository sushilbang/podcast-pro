"""
Application configuration and environment variables.
Centralized configuration management for the backend.
"""

import os
from functools import lru_cache


class Settings:
    """Application settings loaded from environment variables."""

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # AWS S3
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")

    # Application
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_GENERATION_ENABLED: bool = os.getenv("API_GENERATION_ENABLED", "true").lower() == "true"
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true"

    # Redis (optional)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://podcast-pro-gilt.vercel.app"
    ]

    # File upload
    MAX_FILE_SIZE_MB: int = 10


@lru_cache
def get_settings() -> Settings:
    """Get application settings (cached)."""
    return Settings()
