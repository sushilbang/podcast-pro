    # scripts/backfill_durations.py

import os
import sys
import io
from pydub import AudioSegment
from dotenv import load_dotenv
import boto3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# This is a trick to allow the script to import from your 'backend' folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.models import Podcast

# --- SETUP ---
# Load environment variables from the main .env file
load_dotenv() 

# Create a new database session
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Create an S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

def backfill_durations():
    """
    Finds podcasts with a duration of 0, downloads them from S3,
    calculates the true duration, and updates the database.
    """
    print("Searching for podcasts with missing durations...")
    
    # 1. Find all podcasts that are 'complete' but have a duration of 0
    podcasts_to_fix = db.query(Podcast).filter(
        Podcast.status == 'complete', 
        Podcast.duration == 0
    ).all()
    
    if not podcasts_to_fix:
        print("No podcasts with missing durations found. All good!")
        return

    print(f"Found {len(podcasts_to_fix)} podcast(s) to update.")

    for podcast in podcasts_to_fix:
        print(f"Processing Podcast ID: {podcast.id}...")
        
        if not podcast.final_podcast_url:
            print(f"  -> Skipping, no final URL found.")
            continue
            
        try:
            # 2. Parse the S3 key from the URL
            s3_key = podcast.final_podcast_url.split(f"{BUCKET_NAME}.s3.amazonaws.com/")[1]
            
            # 3. Download the MP3 file from S3 into an in-memory buffer
            audio_buffer = io.BytesIO()
            s3_client.download_fileobj(BUCKET_NAME, s3_key, audio_buffer)
            audio_buffer.seek(0)
            
            # 4. Use pydub to get the duration from the file data
            audio_segment = AudioSegment.from_mp3(audio_buffer)
            duration_in_seconds = len(audio_segment) // 1000
            
            if duration_in_seconds > 0:
                # 5. Update the database
                print(f"  -> Found duration: {duration_in_seconds}s. Updating database...")
                podcast.duration = duration_in_seconds
                db.commit()
            else:
                print(f"  -> Warning: Calculated duration is 0. Skipping update.")

        except Exception as e:
            print(f"  -> ERROR processing podcast {podcast.id}: {e}")
            db.rollback() # Rollback any failed transaction for this item

    print("\nBackfill process complete.")
    db.close()


if __name__ == "__main__":
    backfill_durations()