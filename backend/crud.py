from sqlalchemy.orm import Session
from . import models, schemas
from uuid import UUID

# USER CRUD FUNCTIONS

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, auth_id: UUID):
    db_user = models.User(email=user.email, auth_user_id=auth_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

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