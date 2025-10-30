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
    # ============================================================================
    # AUTHENTICATION ENDPOINTS (For OAuth and Email/Password flows)
    # ============================================================================
    "login_oauth": "10/hour",  # OAuth login endpoint (Google, GitHub, etc.)
    "login_email": "5/hour",  # Email/password login endpoint (stricter to prevent brute force)
    "signup_email": "3/hour",  # Email/password signup endpoint (very strict)
    "forgot_password": "3/hour",  # Password reset request (strict to prevent email spam)
    "reset_password": "5/hour",  # Password reset confirmation (slightly more lenient)
    "verify_email": "5/hour",  # Email verification endpoint

    # ============================================================================
    # FILE UPLOADS & S3
    # ============================================================================
    "sign_url": "20/hour",  # Presigned URL generation for S3 uploads

    # ============================================================================
    # PODCAST OPERATIONS
    # ============================================================================
    "create_podcast": "10/hour",  # Creating podcasts
    "get_podcast": "100/hour",  # Fetching single podcast
    "list_podcasts": "50/hour",  # Listing user's podcasts

    # ============================================================================
    # ADMIN/MONITORING
    # ============================================================================
    "get_credits": "100/hour",  # ElevenLabs credits check endpoint
    "health": "1000/hour",  # Health checks (minimal restriction)
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
