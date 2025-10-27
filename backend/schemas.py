"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel
from datetime import datetime
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

