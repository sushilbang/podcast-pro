"""Database models, schemas, and CRUD operations."""

from .models import User, Podcast, PodcastStatus
from .schemas import (
    SignedURLRequest, PodcastBase, PodcastCreate, Podcast as PodcastSchema,
    UserBase, UserCreate, User as UserSchema,
    SignupRequest, LoginRequest, AuthResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
    UpdatePasswordRequest, LinkPasswordRequest
)
from .crud import (
    get_user_by_email, create_user, get_or_create_user,
    create_podcast_for_user, get_podcast, get_podcasts_by_user
)

__all__ = [
    # Models
    "User",
    "Podcast",
    "PodcastStatus",
    # Schemas
    "SignedURLRequest",
    "PodcastBase",
    "PodcastCreate",
    "PodcastSchema",
    "UserBase",
    "UserCreate",
    "UserSchema",
    "SignupRequest",
    "LoginRequest",
    "AuthResponse",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "UpdatePasswordRequest",
    "LinkPasswordRequest",
    # CRUD
    "get_user_by_email",
    "create_user",
    "get_or_create_user",
    "create_podcast_for_user",
    "get_podcast",
    "get_podcasts_by_user",
]
