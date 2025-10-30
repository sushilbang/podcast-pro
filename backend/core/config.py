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
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_JWT_AUDIENCE: str = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")  # Default to 'authenticated'
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # AWS S3
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")

    # Application
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_GENERATION_ENABLED: bool = os.getenv("API_GENERATION_ENABLED", "true").lower() == "true"
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"  # Enabled by default

    # Redis (optional)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8000",
        "https://podcast-pro-gilt.vercel.app"
    ]

    # File upload
    MAX_FILE_SIZE_MB: int = 10

    # Email Configuration (SMTP)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")


@lru_cache
def get_settings() -> Settings:
    """Get application settings (cached)."""
    return Settings()
