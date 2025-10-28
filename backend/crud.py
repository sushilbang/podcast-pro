from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func
from . import models, schemas
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

# USER CRUD FUNCTIONS

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, auth_id: UUID):
    """Create a new user, handling race condition gracefully."""
    db_user = models.User(email=user.email, auth_user_id=auth_id)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        logger.info(f"[CRUD] Created new user: {user.email}")
        return db_user
    except IntegrityError:
        # Another request created the same user concurrently
        db.rollback()
        logger.warning(f"[CRUD] Race condition: User {user.email} already exists, fetching existing user")
        existing_user = db.query(models.User).filter(models.User.email == user.email).first()
        if existing_user:
            return existing_user
        # If still not found, re-raise the error
        raise

def get_or_create_user(db: Session, email: str, auth_id: UUID) -> models.User:
    """
    Atomically get or create a user.

    This function handles the race condition by attempting creation first,
    then falling back to retrieval if it already exists.

    Args:
        db: Database session
        email: User email
        auth_id: Supabase auth user ID

    Returns:
        User model instance (either existing or newly created)
    """
    user = get_user_by_email(db, email)
    if user:
        logger.info(f"[CRUD] User exists: {email}")
        return user

    # Try to create, but handle race condition
    return create_user(db, schemas.UserCreate(email=email), auth_id)

# PODCAST CRUD FUNCTIONS

def create_podcast_for_user(db: Session, podcast: schemas.PodcastCreate, user_id: int):
    # create a new podcast model instance, not setting the final podcast url yet
    db_podcast = models.Podcast(
        **podcast.dict(), # turns the pydanctic model into a dictionary
        owner_id = user_id
    )
    db.add(db_podcast)
    db.commit()
    db.refresh(db_podcast) # refreshing to get the new id, status, etc from the database
    return db_podcast

def get_podcast(db: Session, podcast_id: int):
    return db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()

def get_podcasts_by_user(db: Session, user_id: int):
    return db.query(models.Podcast).filter(models.Podcast.owner_id == user_id).order_by(models.Podcast.created_at.desc()).all()
