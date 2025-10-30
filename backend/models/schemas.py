"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from .models import PodcastStatus
import re
import html


class SignedURLRequest(BaseModel):
    """Request body for presigned URL generation."""
    filename: str


class PodcastBase(BaseModel):
    """Base podcast schema."""
    original_file_url: str | None = None


class PodcastCreate(PodcastBase):
    """Schema for creating a new podcast with input validation."""
    requirements: Optional[str] = None

    @field_validator('requirements', mode='before')
    @classmethod
    def sanitize_requirements(cls, v):
        """
        Sanitize and validate user requirements input to prevent injection attacks.

        Protections:
        - Limits length to 2000 characters
        - Removes potentially dangerous characters
        - Prevents script injection
        - Prevents SQL injection patterns
        - HTML encodes user input
        """
        if v is None:
            return None

        # Convert to string if needed
        v = str(v).strip()

        # Reject empty strings
        if not v:
            return None

        # Length validation - prevent excessively long inputs
        if len(v) > 2000:
            raise ValueError("Requirements text must be 2000 characters or less")

        # Check for SQL injection patterns (basic protection)
        sql_injection_patterns = [
            r"(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
            r"(-{2}|/\*|\*/|;)",  # SQL comments and statement terminators
            r"(\bOR\b.*=.*|1=1)",  # Common SQL injection patterns
        ]

        for pattern in sql_injection_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Invalid characters detected in requirements. Please avoid SQL keywords.")

        # Check for script injection patterns
        script_patterns = [
            r"<script",
            r"javascript:",
            r"onerror=",
            r"onclick=",
            r"onload=",
            r"eval\(",
            r"__proto__",
            r"constructor",
        ]

        for pattern in script_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Invalid characters detected in requirements. Script-like content is not allowed.")

        # HTML encode to prevent any remaining HTML/JS injection
        v = html.escape(v)

        return v


class Podcast(PodcastBase):
    """Schema for reading podcast from database."""
    id: str  # ULID
    owner_id: str  # ULID
    status: str
    created_at: datetime
    final_podcast_url: str | None = None
    title: str | None = None
    duration: int
    requirements: str | None = None
    stream_url: str | None = None  # Presigned URL for secure streaming

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Base user schema."""
    email: str


class UserCreate(UserBase):
    """Schema for creating a new user."""
    pass


class User(UserBase):
    """Schema for reading user from database."""
    id: str  # ULID
    created_at: datetime
    podcasts: list[Podcast] = []

    class Config:
        from_attributes = True


# ============================================================================
# EMAIL/PASSWORD AUTHENTICATION SCHEMAS (Supabase)
# ============================================================================

class SignupRequest(BaseModel):
    """Schema for email/password signup (Supabase handles auth)."""
    email: str
    password: str


class LoginRequest(BaseModel):
    """Schema for email/password login (Supabase handles auth)."""
    email: str
    password: str


class AuthResponse(BaseModel):
    """Response after successful login/signup.

    For signup with email verification required:
    - access_token may be None (email verification required)
    - refresh_token may be None (email verification required)

    For login or signup without email verification:
    - Both tokens are present
    """
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user_id: str  # Supabase auth user ID
    email: str


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: str


class ResetPasswordRequest(BaseModel):
    """Schema for password reset (called after user clicks email link)."""
    new_password: str


class UpdatePasswordRequest(BaseModel):
    """Schema for updating password (requires current access token)."""
    new_password: str


class LinkPasswordRequest(BaseModel):
    """Schema for adding password to existing account (OAuth + Email/Password linking)."""
    new_password: str

