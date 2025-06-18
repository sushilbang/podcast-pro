import os
import time
import fitz
import boto3
import tempfile
import io
# from openai import OpenAI
import google.generativeai as genai
from elevenlabs.client import ElevenLabs

from . import celery_app
from . import models, crud
from .database import SessionLocal


#Initialize clients (good practice)
# openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")


@celery_app.task
def create_podcast_task(podcast_id: int):
    """
    The main background task to process a file and generate a podcast
    """

    db = SessionLocal()
    try:
        # get job details from database
        podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
        if not podcast or not podcast.original_file_url:
            print(f"Error: Podcast file or file URL not found for ID: {podcast_id}")
            raise ValueError("Podcast or URL not found")
        
        podcast.status = models.PodcastStatus.PROCESSING.value
        db.commit()

        # download and extract task
        from urllib.parse import urlparse
        parsed_url = urlparse(podcast.original_file_url)
        s3_key = parsed_url.path.lstrip('/')
        
        # Let Python create a proper temporary file path for us
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            local_filename = tmp_file.name

        s3_client.download_file(BUCKET_NAME, s3_key, local_filename)
        
        if not s3_key.lower().endswith('.pdf'):
            raise NotImplementedError("Only PDFs are supported")
        
        doc = fitz.open(local_filename)
        source_text = "".join(page.get_text() for page in doc)
        doc.close()
        os.remove(local_filename)

        if not source_text.strip():
            raise ValueError("Could not extract any text from the PDF.")
        
        print(f"[{podcast.id}] Text extracted successfully. Length: {len(source_text)} chars.")

        print(f"[{podcast.id}] Generating script with Gemini...")

        # This is where your prompt engineering magic happens!
        prompt = """You are a world-class podcast scriptwriter. Your task is to transform the provided text into a 3-5 minute, engaging, and conversational podcast script.

        Structure it with a brief musical intro, a host introduction, a clear breakdown of the key points from the text, and a concluding summary. Use a friendly and educational tone.

        Here is the text to summarize:

        ---
        {text_to_summarize}
        ---
        """

        # We might need to truncate the source_text if it's too long
        max_chars = 15000 
        truncated_text = source_text[:max_chars]

        # Create the Gemini model instance
        model = genai.GenerativeModel('gemini-1.5-flash') # Use 'gemini-1.5-pro' for higher quality but more cost

        # Generate the content
        response = model.generate_content(prompt.format(text_to_summarize=truncated_text))

        # Extract the text from the response
        script = response.text

        # script = "This is a short test to see if the UI updates correctly."

        if not script:
            raise ValueError("Gemini failed to generate a script.")

        print(f"[{podcast.id}] Script generated successfully.")

        #generate audio with eleven labs

        voice_id = "21m00Tcm4TlvDq8ikWAM" 
        
        audio_iterator = elevenlabs_client.text_to_speech.convert(
            voice_id=voice_id,
            text=script,
            model_id="eleven_multilingual_v2"
        )

        print(f"[{podcast.id}] Streaming audio to S3...")
        
        mp3_buffer = io.BytesIO()
        for chunk in audio_iterator:
            mp3_buffer.write(chunk)
        
        # After writing, we need to "rewind" the buffer to the beginning
        # so that boto3 can read it from the start.
        mp3_buffer.seek(0)

        # upload the mp3 file to s3

        final_mp3_key = f"podcasts/podcast_{podcast.id}.mp3"
        print(f"[{podcast.id}] Uploading final MP3 to S3 at {final_mp3_key}...")

        # `upload_fileobj` is used for streaming data without saving to a file
        s3_client.upload_fileobj(
            mp3_buffer,
            BUCKET_NAME,
            final_mp3_key,
            ExtraArgs={'ContentType': 'audio/mpeg'}
        )

        # update database with final URL
        final_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{final_mp3_key}"
        podcast.status = models.PodcastStatus.COMPLETE.value
        podcast.final_podcast_url = final_url
        db.commit()

        print(f"[{podcast.id}] Task Succeeded! Final URL: {final_url}")

    except Exception as e:
        print(f"Error in create_podcast_task for ID {podcast_id}: {e}")
        # If something fails, update the status in the DB
        if 'podcast' in locals() and db.is_active:
            podcast.status = models.PodcastStatus.FAILED.value
            db.commit()
        # Re-raise the exception so Celery knows the task failed
        raise
    finally:
        db.close()

    return "Podcast created successfully."