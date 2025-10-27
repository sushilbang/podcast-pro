"""
Rate limiting configuration and utilities for API endpoints.
Uses slowapi for request-based rate limiting.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Initialize the limiter with get_remote_address as the key function
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
RATE_LIMITS = {
    # Authentication and uploads
    "sign_url": "20/hour",  # Presigned URL generation

    # Podcast creation
    "create_podcast": "10/hour",  # Creating podcasts
    "get_podcast": "100/hour",  # Fetching single podcast
    "list_podcasts": "50/hour",  # Listing user's podcasts

    # Health checks (no limit)
    "health": "1000/hour",
}

def setup_rate_limiting(app: FastAPI):
    """
    Setup rate limiting error handler and middleware on the FastAPI app.

    Args:
        app: FastAPI application instance
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

async def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom error handler for rate limit exceeded exceptions.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.detail
        }
    )

__all__ = ["limiter", "RATE_LIMITS", "setup_rate_limiting"]
