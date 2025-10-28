"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .models import PodcastStatus


class SignedURLRequest(BaseModel):
    """Request body for presigned URL generation."""
    filename: str


class PodcastBase(BaseModel):
    """Base podcast schema."""
    original_file_url: str | None = None


class PodcastCreate(PodcastBase):
    """Schema for creating a new podcast."""
    pass


class Podcast(PodcastBase):
    """Schema for reading podcast from database."""
    id: int
    owner_id: int
    status: str
    created_at: datetime
    final_podcast_url: str | None = None
    title: str | None = None
    duration: int

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
    id: int
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

