from pydantic import BaseModel
from datetime import datetime
from .models import PodcastStatus

# base schema, other schemas will inherit from this
class PodcastBase(BaseModel):
    original_file_url: str | None = None
# while creating the podcast
class PodcastCreate(PodcastBase):
    pass
#while reading the podcast from the databse
class Podcast(PodcastBase):
    id: int
    owner_id: int
    status: PodcastStatus
    created_at: datetime
    final_podcast_url: str | None = None
    # This is a Pydantic configuration setting that allows it to work
    # with SQLAlchemy models.
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime
    podcasts: list[Podcast] = [] # user can have a list of podcasts

    class Config:
        orm_mode = True

