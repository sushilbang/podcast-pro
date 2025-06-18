from fastapi import FastAPI, Depends, HTTPException
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

@app.post("/podcasts/", response_model=schemas.Podcast, status_code=202)
def create_podcast(
    podcast: schemas.PodcastCreate,
    db: Session = Depends(get_db)
):
    # this is a dummy endpoint for now, so we will use a hardcoded user for now
    # later this will come from a real authentication system

    dummy_user_email = "test@example.com"
    db_user = crud.get_user_by_email(db, email = dummy_user_email)

    if not db_user:
        db_user = crud.create_user(db, user=schemas.UserCreate(email=dummy_user_email))
    
    db_podcast = crud.create_podcast_for_user(db=db, podcast=podcast, user_id=db_user.id)

    # instead of doing all the work here, send the job to celery worker
    # use .delay() to send the task to the queue
    tasks.create_podcast_task.delay(db_podcast.id)


    # immedialtely return the podcast object just created, frontend will see the status as 'pending'
    return db_podcast

@app.get("/podcasts/{podcast_id}", response_model=schemas.Podcast)
def read_podcast(podcast_id: int, db: Session = Depends(get_db)):
    db_podcast = crud.get_podcast(db, podcast_id=podcast_id)
    if db_podcast is None:
        raise HTTPException(status_code=404, detail="Podcast not found")
    return db_podcast