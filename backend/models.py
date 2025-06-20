import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class PodcastStatus(enum.Enum):
    PENDING =  "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    podcasts = relationship("Podcast", back_populates="owner")
    podcast_limit = Column(Integer, default=1)
    podcasts_created = Column(Integer, default=0)

class Podcast(Base):
    __tablename__ = "Podcast"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default=PodcastStatus.PENDING.value)
    original_file_url = Column(String, nullable=True)
    final_podcast_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="podcasts")
