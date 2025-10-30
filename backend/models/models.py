import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ulid import ULID
from backend.core.database import Base

def generate_ulid():
    """Generate a new ULID string."""
    return str(ULID())

class PodcastStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id = Column(String(26), primary_key=True, index=True, default=generate_ulid)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    auth_user_id = Column(UUID(as_uuid=True), unique=True, nullable=False)  # Supabase auth user ID

    # Podcast management
    podcast_limit = Column(Integer, default=1)
    podcasts_created = Column(Integer, default=0)

    podcasts = relationship("Podcast", back_populates="owner")

class Podcast(Base):
    __tablename__ = "podcasts"

    id = Column(String(26), primary_key=True, index=True, default=generate_ulid)
    status = Column(String, default=PodcastStatus.PENDING.value)
    original_file_url = Column(String, nullable=True)
    final_podcast_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    title = Column(String, nullable=True)
    duration = Column(Integer, default=0)
    requirements = Column(String, nullable=True)  # User customization instructions
    owner_id = Column(String(26), ForeignKey("users.id"))
    owner = relationship("User", back_populates="podcasts")
