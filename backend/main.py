"""
Podcast Pro Backend API.
FastAPI application for podcast creation and management.
"""

import logging
from typing import Annotated

from fastapi import FastAPI, Depends, HTTPException, Header, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.core import get_settings, SessionLocal, engine
from backend.services import auth_service, s3_service, get_elevenlabs_credits, has_sufficient_credits
from backend.utils import limiter, setup_rate_limiting, RATE_LIMITS
from backend.models import models, schemas, crud
from . import tasks

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Podcast Pro API",
    description="Convert PDFs to podcasts using AI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup rate limiting
setup_rate_limiting(app)


# ============================================================================
# DEPENDENCIES
# ============================================================================

def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: Annotated[str, Header()] = None,
    db: Session = Depends(get_db)
):
    """
    Extract and validate JWT token, return authenticated user.

    Automatically creates user in database on first API call.
    Works with all Supabase auth providers (Google, GitHub, email, etc.)
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    # Extract Bearer token
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = parts[1]

    try:
        # Decode JWT token
        token_claims = auth_service.verify_and_decode_token(token)
        user_id, email = auth_service.extract_user_info(token_claims)

        # Create a user object from token claims
        class AuthenticatedUser:
            def __init__(self, user_id: str, email: str, metadata: dict):
                self.id = user_id
                self.email = email
                self.user_metadata = metadata

        user = AuthenticatedUser(
            user_id=user_id,
            email=email,
            metadata=token_claims.get("user_metadata", {})
        )

        # Auto-create or get database user on first API call
        # Uses atomic get_or_create to avoid race conditions
        if db and email:
            crud.get_or_create_user(db, email=email, auth_id=user_id)
            logger.info(f"[AUTH] ✓ User ensured in database: {email}")

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] ✗ Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed") from e


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health")
@limiter.limit(RATE_LIMITS["health"])
def health_check(request: Request):
    """Health check endpoint."""
    return {"status": "healthy"}




@app.get("/elevenlabs/credits", response_model=dict)
@limiter.limit(RATE_LIMITS["get_credits"])
def get_global_credits(request: Request):
    """
    Get global ElevenLabs account credits and usage information.
    This is for admin/monitoring purposes only.

    Returns:
        dict: Account credits information including:
            - character_count: Characters used
            - character_limit: Total character limit
            - characters_available: Characters remaining
            - usage_percentage: Percentage of quota used
            - status: Account status
    """
    try:
        logger.info("[ELEVENLABS] Global credits request received")
        credits = get_elevenlabs_credits()
        logger.info(f"[ELEVENLABS] ✓ Global credits returned. Available: {credits['characters_available']}")
        return credits
    except Exception as e:
        logger.error(f"[ELEVENLABS] ✗ Failed to fetch global credits: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Unable to fetch ElevenLabs credits. Please try again later."
        ) from e


@app.post("/uploads/sign-url/", response_model=dict)
@limiter.limit(RATE_LIMITS["sign_url"])
def get_presigned_upload_url(
    request: Request,
    body: schemas.SignedURLRequest,
    current_user=Depends(get_current_user),
):
    """
    Generate a presigned S3 POST URL for direct file upload.

    Files are stored as: podcasts/{user_id}/{timestamp}_{filename}

    This allows clients to upload directly to S3 without loading the server.
    """
    try:
        logger.info(f"[UPLOAD] Presigned URL request from user {current_user.id} ({current_user.email}) for file: {body.filename}")
        response = s3_service.generate_presigned_url(
            user_id=current_user.id,
            filename=body.filename
        )
        logger.info(f"[UPLOAD] ✓ Presigned URL generated successfully. S3 Key: {response.get('fields', {}).get('key', 'UNKNOWN')}")
        return response

    except Exception as e:
        logger.error(f"[UPLOAD] ✗ Failed to generate presigned URL: {str(e)}")
        raise HTTPException(status_code=400, detail="Could not generate upload URL") from e


@app.post("/podcasts/", response_model=schemas.Podcast, status_code=202)
@limiter.limit(RATE_LIMITS["create_podcast"])
def create_podcast(
    request: Request,
    podcast: schemas.PodcastCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new podcast with mocked async processing.

    Returns 202 Accepted. Generation logic is mocked with console logs for testing.
    TESTING: Verify S3 file uploads are working correctly.
    """
    logger.info(f"[PODCAST] Creation request from user {current_user.id} ({current_user.email})")

    # Get or create user
    db_user = crud.get_user_by_email(db, email=current_user.email)

    logger.info(f"[PODCAST] User found/created: {db_user.id}. Podcasts: {db_user.podcasts_created}/{db_user.podcast_limit}")

    # Check if global ElevenLabs credits are available
    try:
        if not has_sufficient_credits(required_characters=5000):
            logger.warning("[PODCAST] ✗ Insufficient global ElevenLabs credits")
            credits_info = get_elevenlabs_credits()
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient ElevenLabs credits. Available: {credits_info['characters_available']}, Required: ~5000. Please purchase more credits."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[PODCAST] ✗ Failed to check global credits: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Unable to verify ElevenLabs credits. Please try again later."
        ) from e

    # Check user's podcast limit
    if db_user.podcasts_created >= db_user.podcast_limit:
        logger.warning(f"[PODCAST] ✗ User {current_user.email} has reached podcast limit ({db_user.podcast_limit})")
        raise HTTPException(
            status_code=429,
            detail="You have reached your podcast creation limit"
        )

    # Create podcast in database
    db_podcast = crud.create_podcast_for_user(db=db, podcast=podcast, user_id=db_user.id)
    logger.info(f"[PODCAST] ✓ Podcast created in database. ID: {db_podcast.id}, File URL: {db_podcast.original_file_url}")

    # Trigger async podcast generation task
    logger.info(f"[PODCAST] ✓ Triggering async generation task for podcast {db_podcast.id}")
    logger.info(f"[PODCAST] Current status: {db_podcast.status}")
    tasks.create_podcast_task.delay(db_podcast.id)

    logger.info(f"[PODCAST] ✓ Response sent to user {current_user.email}. Podcast ID: {db_podcast.id}")
    return db_podcast


@app.get("/podcasts/{podcast_id}", response_model=schemas.Podcast)
@limiter.limit(RATE_LIMITS["get_podcast"])
def get_podcast(request: Request, podcast_id: str, db: Session = Depends(get_db)):
    """Retrieve a specific podcast by ID with secure streaming URL."""
    db_podcast = crud.get_podcast(db, podcast_id=podcast_id)
    if db_podcast is None:
        raise HTTPException(status_code=404, detail="Podcast not found")

    # Generate presigned URL for streaming if podcast is complete
    if db_podcast.final_podcast_url and db_podcast.status == "complete":
        try:
            # Extract S3 key from the stored URL (format: podcasts/podcast_{id}.mp3)
            s3_key = f"podcasts/podcast_{db_podcast.id}.mp3"
            stream_url = s3_service.generate_presigned_download_url(s3_key, expiration=3600)
            # Add stream_url to response (convert to dict to add the field)
            podcast_dict = db_podcast.__dict__.copy()
            podcast_dict['stream_url'] = stream_url
            return podcast_dict
        except Exception as e:
            logger.error(f"[PODCAST] Failed to generate stream URL for podcast {podcast_id}: {str(e)}")
            # Still return the podcast, but without stream_url
            podcast_dict = db_podcast.__dict__.copy()
            podcast_dict['stream_url'] = None
            return podcast_dict

    return db_podcast


@app.get("/podcasts/", response_model=list[schemas.Podcast])
@limiter.limit(RATE_LIMITS["list_podcasts"])
def list_user_podcasts(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all podcasts for the current user."""
    db_user = crud.get_user_by_email(db, email=current_user.email)
    if not db_user:
        return []
    return crud.get_podcasts_by_user(db=db, user_id=db_user.id)
