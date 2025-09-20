# Import necessary modules and libraries
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis
from typing import Annotated
from supabase import create_client, Client
from sqlalchemy.orm import Session
import os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Import local modules (assuming they are in the same package)
from . import models, schemas, crud
from .database import engine, SessionLocal
from . import tasks

# Create all database tables defined in models (skips existing ones)
models.Base.metadata.create_all(bind=engine)

# Dependency function to get a database session for requests
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize FastAPI app
app = FastAPI()

# Define allowed CORS origins for cross-origin requests
origins = [
    "http://localhost:3000",
    "https://podcast-pro-gilt.vercel.app"
]

# Add CORS middleware to handle cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint for basic health check or greeting
@app.get("/")
def read_root():
    return {"Hello": "World from the database-connected app!!"}

# Pydantic model for signed URL request body
class SignedURLRequest(BaseModel):
    filename: str

# Set up S3 client with AWS credentials and configuration
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    config=Config(signature_version='s3v4'),
    region_name="eu-north-1"
)
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

# Set up Supabase client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase_client: Client = create_client(url, key)

# Dependency to get the current authenticated user from the Authorization header
async def get_current_user(authorization: Annotated[str, Header()]):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.split(" ")[1]  # Extract token from "Bearer <token>"
    try:
        user_response = supabase_client.auth.get_user(token)
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

# Endpoint to generate a pre-signed URL for S3 uploads
@app.post("/uploads/sign-url/", response_model=dict)
def create_upload_url(
    request: SignedURLRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ensure the user exists in the local database, create if not
    db_user = crud.get_user_by_email(db, email=current_user.email)
    if not db_user:
        db_user = crud.create_user(
            db, 
            user=schemas.UserCreate(email=current_user.email), 
            auth_id=current_user.id
        )
    
    try:
        # Generate pre-signed POST URL for S3 upload
        response = s3_client.generate_presigned_post(
            Bucket=BUCKET_NAME,
            Key=request.filename,
            ExpiresIn=3600
        )
        return response
    except ClientError as e:
        print(f"Error generating pre-signed URL: {e}")
        raise HTTPException(status_code=400, detail="Could not generate upload URL")

# Startup event to initialize rate limiting with Redis
@app.on_event("startup")
async def startup():
    # Load Redis URL from environment (default to local if not set)
    redis_url = os.getenv("REDIS_URL", "redis://localhost")
    
    # Handle SSL for rediss:// URLs
    if redis_url.startswith("rediss://"):
        redis_connection = redis.from_url(redis_url, ssl_cert_reqs=None) # development only
    else:
        redis_connection = redis.from_url(redis_url)
    
    await FastAPILimiter.init(redis_connection)

# Endpoint to create a new podcast (with rate limiting)
@app.post("/podcasts/", response_model=schemas.Podcast, status_code=202, dependencies=[Depends(RateLimiter(times=10, minutes=5))])
def create_podcast(
    podcast: schemas.PodcastCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if podcast generation is enabled
    if os.getenv("API_GENERATION_ENABLED", "true").lower() != "true":
        raise HTTPException(
            status_code=503,  # Service Unavailable
            detail="Podcast generation is temporarily disabled due to high demand. Please try again later."
        )
    
    # Ensure the user exists in the local database, create if not
    db_user = crud.get_user_by_email(db, email=current_user.email)
    if not db_user:
        db_user = crud.create_user(db, user=schemas.UserCreate(email=current_user.email), auth_id=current_user.id)
    
    # Check against user's podcast creation limit
    if db_user.podcasts_created >= db_user.podcast_limit:
        raise HTTPException(
            status_code=429,  # Too Many Requests
            detail="You have reached your podcast creation limit."
        )
    
    # Create podcast in database and trigger async task
    db_podcast = crud.create_podcast_for_user(db=db, podcast=podcast, user_id=db_user.id)
    tasks.create_podcast_task.delay(db_podcast.id)
    
    return db_podcast

# Endpoint to retrieve a specific podcast by ID
@app.get("/podcasts/{podcast_id}", response_model=schemas.Podcast)
def read_podcast(podcast_id: int, db: Session = Depends(get_db)):
    db_podcast = crud.get_podcast(db, podcast_id=podcast_id)
    if db_podcast is None:
        raise HTTPException(status_code=404, detail="Podcast not found")
    return db_podcast

# Endpoint to retrieve all podcasts for the current user
@app.get("/podcasts/", response_model=list[schemas.Podcast])
def read_user_podcasts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure the user exists in the local database
    db_user = crud.get_user_by_email(db, email=current_user.email)
    if not db_user:
        return []  # Return empty list if user not found (unlikely but safe)
    
    # Fetch and return user's podcasts
    return crud.get_podcasts_by_user(db=db, user_id=db_user.id)

# Health check endpoint to verify database connection
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Simple query to test DB connection
        db.execute("SELECT 1")
        return {"status": "healthy", "services": ["database"]}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")
