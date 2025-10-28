import os
import fitz
import boto3
import tempfile
import io
import re
from pydub import AudioSegment
import google.generativeai as genai
from elevenlabs.client import ElevenLabs
from . import celery_app
from . import models
from .database import SessionLocal

# Initialize clients
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

def clean_script(script_text: str) -> str:
    """Removes common non-spoken text from an AI-generated script."""
    cleaned_text = re.sub(r'\[.*?\]', '', script_text)
    cleaned_text = re.sub(r'^\s*\w+:\s*', '', cleaned_text, flags=re.MULTILINE | re.IGNORECASE)
    cleaned_text = re.sub(r'\*.*?\*', '', cleaned_text)
    cleaned_text = re.sub(r'\n{2,}', '\n', cleaned_text)
    return cleaned_text.strip()

def generate_enhanced_content(source_text: str):
    """Generate content for podcast creation."""
    model = genai.GenerativeModel('gemini-1.5-flash')

    summary_prompt = f"""
    Analyze the following text and create a detailed, structured summary.
    Create a comprehensive 15-30 minute podcast discussion covering all major topics.

    Identify and extract:
    1. The core thesis or main argument
    2. The top 3-5 key topics or supporting points
    3. Any important data, statistics, or case studies mentioned
    4. The primary conclusion or takeaway

    Do not make up information. Base your summary strictly on the provided text.

    ---
    {source_text}
    ---
    """

    summary_response = model.generate_content(summary_prompt)
    return summary_response.text

@celery_app.task(
    bind=True,
    max_retries=3,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3},
    retry_backoff=True,
    retry_backoff_max=600,  # Max backoff time 10 minutes
    retry_jitter=True,  # Add random jitter to prevent thundering herd
    soft_time_limit=1800,  # 30 minutes soft limit
    time_limit=2100,  # 35 minutes hard limit
    track_started=True,
)
def create_podcast_task(self, podcast_id: int):
    """Enhanced background task to process files and generate podcasts with new features."""
    db = SessionLocal()
    try:
        podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
        if not podcast or not podcast.original_file_url:
            print(f"Error: Podcast file or file URL not found for ID: {podcast_id}")
            raise ValueError("Podcast or URL not found")

        user = db.query(models.User).filter(models.User.id == podcast.owner_id).first()
        if not user:
            raise ValueError("Could not find the user to update their limit.")

        podcast.status = models.PodcastStatus.PROCESSING.value
        db.commit()

        # Download and extract text (same as before)
        from urllib.parse import urlparse
        parsed_url = urlparse(podcast.original_file_url)
        s3_key = parsed_url.path.lstrip('/')

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

        # Generate enhanced content for podcast
        detailed_summary = generate_enhanced_content(source_text)

        db.commit()
        
        # Generate title
        print(f"[{podcast.id}] Generating title...")
        model = genai.GenerativeModel('gemini-1.5-flash')
        title_prompt = f"Based on the following summary, generate a short, catchy, and descriptive title (5-10 words). Do not use quotes.\n\nSUMMARY:\n{detailed_summary}"
        title_response = model.generate_content(title_prompt)
        generated_title = title_response.text.strip().replace('"', '')
        podcast.title = generated_title
        db.commit()

        # Generate script for podcast
        prompt = f"""You are an expert podcast scriptwriter creating a dynamic, engaging script for two hosts: Dorothy (an insightful analyst) and Will (a curious commentator).

        Target Length: Approximately 1200 words for a 15-30 minute podcast discussion

        Source Material:
        You will be given a detailed summary of a document. Your task is to transform this summary into a natural, two-person dialogue.

        Critical Instructions:
        1. Narrative Flow: Create a natural, engaging podcast discussion.
        2. Focus on Key Insights: Weave the core thesis, key topics, and important data from the summary into the conversation naturally.
        3. Engaging Dialogue: Use varied sentence lengths, rhetorical questions, and natural pauses.
        4. Speaker Roles:
            * Dorothy: Analytical, insightful, drives the main points forward.
            * Will: Inquisitive, represents the listener's perspective, makes content accessible.
        5. Format: Start each line with the speaker's label (e.g., "Dorothy:"). No stage directions.

        **Here is the detailed summary to transform:**
        ---
        {detailed_summary}
        ---
        """
        
        response = model.generate_content(prompt)
        script = response.text

        if not script:
            raise ValueError("Gemini failed to generate a script.")

        print(f"[{podcast.id}] Script generated successfully.")
        print(f"[{podcast.id}] Creating audio with ElevenLabs...")

        # ElevenLabs voice mapping
        voice_map = {
            "DOROTHY": "ThT5KcBeYPX3keUQqHPh",
            "WILL": "bIHbv24MWmeRgasZH58o"
        }

        final_podcast = AudioSegment.silent(duration=500)
        script_lines = script.strip().split('\n')

        for line in script_lines:
            line = line.strip()
            if not line:
                continue

            match = re.match(r'^(\w+):\s*(.*)', line)
            if match:
                speaker, text_to_speak = match.groups()
                speaker = speaker.upper()

                if speaker in voice_map:
                    print(f"[{podcast.id}] Generating audio for {speaker}...")

                    # Use ElevenLabs for audio generation
                    audio_iterator = elevenlabs_client.text_to_speech.convert(
                        voice_id=voice_map[speaker],
                        text=text_to_speak,
                        model_id="eleven_multilingual_v2"
                    )
                    audio_buffer = io.BytesIO()
                    for chunk in audio_iterator:
                        audio_buffer.write(chunk)
                    audio_buffer.seek(0)
                    segment = AudioSegment.from_mp3(audio_buffer)

                    final_podcast += segment
                else:
                    print(f"[{podcast.id}] Warning: Skipping line with unknown speaker: {speaker}")

        print(f"[{podcast.id}] All audio segments generated. Exporting and uploading final MP3...")

        final_buffer = io.BytesIO()
        final_podcast.export(final_buffer, format="mp3")
        final_buffer.seek(0)

        # Calculate duration
        duration_seconds = len(final_podcast) // 1000
        podcast.duration = duration_seconds

        final_mp3_key = f"podcasts/podcast_{podcast.id}.mp3"
        s3_client.upload_fileobj(
            final_buffer,
            BUCKET_NAME,
            final_mp3_key,
            ExtraArgs={'ContentType': 'audio/mpeg'}
        )

        final_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{final_mp3_key}"
        podcast.status = models.PodcastStatus.COMPLETE.value
        podcast.final_podcast_url = final_url
        user.podcasts_created += 1
        db.commit()

        print(f"[{podcast.id}] Task Succeeded! Enhanced podcast created.")
        print(f"[{podcast.id}] Duration: {duration_seconds}s, Final URL: {final_url}")

    except Exception as e:
        print(f"Error in create_podcast_task for ID {podcast_id}: {e}")
        if 'podcast' in locals() and db.is_active:
            podcast.status = models.PodcastStatus.FAILED.value
            db.commit()

        # Log retry attempt with exponential backoff
        exc_message = f"Task failed for podcast {podcast_id}: {str(e)}"
        print(f"[CELERY] Retry attempt {self.request.retries}/{self.max_retries}: {exc_message}")

        # Retry with exponential backoff
        try:
            raise self.retry(exc=e, countdown=min(5 * (2 ** self.request.retries), 600))
        except self.MaxRetriesExceededError:
            print(f"[CELERY] Max retries exceeded for podcast {podcast_id}. Task failed permanently.")
            if 'podcast' in locals() and db.is_active:
                podcast.status = models.PodcastStatus.FAILED.value
                db.commit()
            raise
    finally:
        db.close()

    return "Enhanced podcast created successfully."