from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis
from typing import Annotated
from supabase import create_client, Client

from sqlalchemy.orm import Session
import uvicorn
import os
import boto3

from botocore.config import Config
from botocore.exceptions import ClientError
from pydantic import BaseModel

from . import models, schemas, crud
from .database import engine, SessionLocal

from fastapi.middleware.cors import CORSMiddleware

from . import tasks


# tells sqlalchemy to create all the tables defined in models
# does not create tables that already exists
models.Base.metadata.create_all(bind=engine)

# dependency for getting a database connection
# this function will be called for every request that need a database connection.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost",
    "https://podcast-nnup1pnlt-sushils-projects-521f4a5a.vercel.app",
    "https://podcast-pro-gilt.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World from the database-connected app!!"}

class SignedURLRequest(BaseModel):
    filename: str

# s3 client setup
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    config=Config(signature_version='s3v4'),
    region_name="eu-north-1"
)
BUCKET_NAME=os.getenv("AWS_S3_BUCKET_NAME")

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase_client: Client = create_client(url, key)

async def get_current_user(authorization: Annotated[str, Header()]):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.split(" ")[1] # "Bearer <token>"
    try:
        user_response = supabase_client.auth.get_user(token)
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

# endpoint for generating pre signed URLs
@app.post("/uploads/sign-url/", response_model=dict) # response_model=dict is good for this
def create_upload_url(request: SignedURLRequest): # It now expects a JSON body
    try:
        response = s3_client.generate_presigned_post(
            Bucket=BUCKET_NAME,
            Key=request.filename, # Get filename from the request body
            ExpiresIn=3600
        )
        return response
    except ClientError as e:
        print(f"Error generating pre-signed URL: {e}")
        raise HTTPException(status_code=400, detail="Could not generate upload URL")

@app.on_event("startup")
async def startup():
    # Use the Redis URL from your environment variables
    redis_url = os.getenv("REDIS_URL", "redis://localhost")
    # For rediss:// URLs, we need to handle SSL
    if redis_url.startswith("rediss://"):
        redis_connection = redis.from_url(redis_url, ssl_cert_reqs=None)
    else:
        redis_connection = redis.from_url(redis_url)
    
    await FastAPILimiter.init(redis_connection)

@app.post("/podcasts/", response_model=schemas.Podcast, status_code=202, dependencies=[Depends(RateLimiter(times=10, minutes=5))])
def create_podcast(
    podcast: schemas.PodcastCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if os.getenv("API_GENERATION_ENABLED", "true").lower() != "true":
        raise HTTPException(
            status_code=503, # 503 = Service Unavailable
            detail="Podcast generation is temporarily disabled due to high demand. Please try again later."
        )
    # Get the user's record from our database
    db_user = crud.get_user_by_email(db, email=current_user.email)
    if not db_user:
        # If they don't exist in our table yet, create them
        db_user = crud.create_user(db, user=schemas.UserCreate(email=current_user.email))

    # The Database-Driven Limit Check
    # Check the user's created count against their personal limit
    if db_user.podcasts_created >= db_user.podcast_limit:
        # If the limit is reached, send a specific error back to the frontend
        raise HTTPException(
            status_code=429,  # "Too Many Requests" - a standard code for rate limiting
            detail="You have reached your podcast creation limit."
        )

    db_podcast = crud.create_podcast_for_user(db=db, podcast=podcast, user_id=db_user.id)
    tasks.create_podcast_task.delay(db_podcast.id)
    
    return db_podcast

@app.get("/podcasts/{podcast_id}", response_model=schemas.Podcast)
def read_podcast(podcast_id: int, db: Session = Depends(get_db)):
    db_podcast = crud.get_podcast(db, podcast_id=podcast_id)
    if db_podcast is None:
        raise HTTPException(status_code=404, detail="Podcast not found")
    return db_podcast

@app.get("/podcasts/", response_model=list[schemas.Podcast])
def read_user_podcasts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # First, ensure the user exists in our local DB
    db_user = crud.get_user_by_email(db, email=current_user.email)
    if not db_user:
        # This case is unlikely if they've created podcasts, but good for safety
        return []
    
    # Fetch and return all podcasts owned by this user
    return crud.get_podcasts_by_user(db=db, user_id=db_user.id)

# health check database
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test DB connection
        db.execute("SELECT 1")
        return {"status": "healthy", "services": ["database"]}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")