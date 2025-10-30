import os
import fitz
import boto3
import tempfile
import io
import re
import logging
import subprocess
from pathlib import Path
from pydub import AudioSegment
import google.generativeai as genai
from elevenlabs.client import ElevenLabs
from . import celery_app
from backend.core import SessionLocal
from backend.models import models
# from backend.services import get_validation_service, ContentValidationError, get_mailing_service
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

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
    model = genai.GenerativeModel('gemini-2.0-flash-exp')

    summary_prompt = f"""
    Analyze the following text and create a detailed, structured summary.
    Create a comprehensive 5 minute (strictly) podcast discussion covering all major topics.

    Identify and extract:
    1. The core thesis or main argument
    2. The top key topics or supporting points maximizing coverage (for a 5 minute discussion)
    3. Any important data, statistics, or case studies mentioned
    4. The primary conclusion or takeaway

    Do not make up information. Base your summary strictly on the provided text.

    ---
    {source_text}
    ---
    """

    summary_response = model.generate_content(summary_prompt)
    return summary_response.text

def concatenate_audio_files(chunk_files: list, output_path: str, podcast_id: str) -> None:
    """
    Efficiently concatenate MP3 chunks using ffmpeg.

    Uses the ffmpeg concat demuxer for fast, lossless concatenation without re-encoding.
    Memory-efficient as it doesn't load files into RAM.

    Args:
        chunk_files: List of paths to MP3 chunk files
        output_path: Path to write final concatenated MP3
        podcast_id: Podcast ID for logging
    """
    if not chunk_files:
        raise ValueError("No chunk files to concatenate")

    temp_dir = os.path.dirname(output_path)
    concat_file = os.path.join(temp_dir, "concat_list.txt")

    try:
        # Create ffmpeg concat demuxer file
        with open(concat_file, 'w') as f:
            for chunk_file in chunk_files:
                # ffmpeg concat demuxer requires absolute paths with forward slashes
                abs_path = os.path.abspath(chunk_file).replace('\\', '/')
                f.write(f"file '{abs_path}'\n")

        logger.info(f"[TASK] Running ffmpeg concat for podcast {podcast_id} with {len(chunk_files)} chunks...")

        # Use ffmpeg concat demuxer for efficient concatenation
        cmd = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-c', 'copy',  # Copy codec - no re-encoding, just muxing
            '-loglevel', 'error',  # Only show errors
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg concatenation failed: {result.stderr}")

        logger.info(f"[TASK] ✓ ffmpeg concatenation complete for podcast {podcast_id}")

    finally:
        # Clean up concat file
        if os.path.exists(concat_file):
            os.remove(concat_file)


def get_audio_duration(mp3_path: str) -> int:
    """
    Get duration of MP3 file in seconds using ffprobe.

    Efficiently extracts duration metadata without loading entire file into RAM.

    Args:
        mp3_path: Path to MP3 file

    Returns:
        Duration in seconds (rounded to nearest integer)
    """
    if not os.path.exists(mp3_path):
        raise FileNotFoundError(f"MP3 file not found: {mp3_path}")

    try:
        # Use ffprobe to get duration (metadata only, very fast)
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1:nokey=1',
            mp3_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            logger.warning(f"ffprobe failed for {mp3_path}, falling back to pydub")
            # Fallback: use pydub (slower but reliable)
            audio = AudioSegment.from_mp3(mp3_path)
            return int(audio.duration_seconds)

        duration = float(result.stdout.strip())
        return int(round(duration))

    except Exception as e:
        logger.error(f"Failed to get duration for {mp3_path}: {str(e)}")
        raise


@celery_app.task(bind=True)
def create_podcast_task(self, podcast_id: str):
    db = SessionLocal()
    try:
        podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
        if not podcast or not podcast.original_file_url:
            logger.error(f"[TASK] Error: Podcast file or file URL not found for ID: {podcast_id}")
            raise ValueError("Podcast or URL not found")

        user = db.query(models.User).filter(models.User.id == podcast.owner_id).first()
        if not user:
            raise ValueError("Could not find the user to update their limit.")

        podcast.status = models.PodcastStatus.PROCESSING.value
        db.commit()
        
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

        if len(source_text) > 40000:
            source_text = source_text[:40000]
        
        os.remove(local_filename)

        if not source_text.strip():
            raise ValueError("Could not extract any text from the PDF.")

        logger.info(f"[TASK] Text extracted successfully for podcast {podcast.id}. Length: {len(source_text)} chars.")

        # Validate content before processing
        # logger.info(f"[TASK] Running content validation for podcast {podcast.id}...")
        # WORK IN PROGRESS
        # validation_service = get_validation_service()
        # try:
        #     validation_result = validation_service.validate_all(
        #         pdf_text=source_text,
        #         requirements=podcast.requirements,
        #         use_gemini=True
        #     )
        #     logger.info(f"[TASK] ✓ Content validation passed. Gemini validation: {validation_result['gemini_validation']}")
        # except ContentValidationError as e:
        #     logger.error(f"[TASK] ✗ Content validation failed: {str(e)}")
        #     raise ValueError(f"Content validation failed: {str(e)}")

        # Generate enhanced content for podcast
        detailed_summary = generate_enhanced_content(source_text)

        db.commit()
        
        # Generate title
        logger.info(f"[TASK] Generating title for podcast {podcast.id}...")
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
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

        logger.info(f"[TASK] Script generated successfully for podcast {podcast.id}.")
        logger.info(f"[TASK] Creating audio with ElevenLabs for podcast {podcast.id}...")

        # ElevenLabs voice mapping
        voice_map = {
            "DOROTHY": "ThT5KcBeYPX3keUQqHPh",
            "WILL": "bIHbv24MWmeRgasZH58o"
        }

        # Create temp directory for audio chunks
        temp_dir = tempfile.mkdtemp(prefix=f"podcast_{podcast.id}_")
        chunk_files = []
        script_lines = script.strip().split('\n')
        chunk_index = 0

        try:
            # Generate audio chunks and save directly to disk
            for line in script_lines:
                line = line.strip()
                if not line:
                    continue

                match = re.match(r'^(\w+):\s*(.*)', line)
                if match:
                    speaker, text_to_speak = match.groups()
                    speaker = speaker.upper()

                    if speaker in voice_map:
                        logger.info(f"[TASK] Generating audio for {speaker} in podcast {podcast.id}...")

                        # Stream audio directly to disk (minimal memory usage)
                        chunk_file = os.path.join(temp_dir, f"chunk_{chunk_index:04d}.mp3")

                        audio_iterator = elevenlabs_client.text_to_speech.convert(
                            voice_id=voice_map[speaker],
                            text=text_to_speak,
                            model_id="eleven_multilingual_v2"
                        )

                        # Write chunks directly to file (no buffering in memory)
                        with open(chunk_file, 'wb') as f:
                            for chunk in audio_iterator:
                                f.write(chunk)

                        chunk_files.append(chunk_file)
                        chunk_index += 1
                        logger.info(f"[TASK] Chunk {chunk_index} saved for {speaker}")
                    else:
                        logger.warning(f"[TASK] Warning: Skipping line with unknown speaker: {speaker} in podcast {podcast.id}")

            logger.info(f"[TASK] All {chunk_index} audio segments generated for podcast {podcast.id}. Concatenating with ffmpeg...")

            # Concatenate all chunks using ffmpeg (efficient, low memory)
            final_mp3_temp = os.path.join(temp_dir, "final_podcast.mp3")
            concatenate_audio_files(chunk_files, final_mp3_temp, podcast.id)

            # Calculate duration by checking the final file
            duration_seconds = get_audio_duration(final_mp3_temp)
            podcast.duration = duration_seconds
            logger.info(f"[TASK] Audio concatenation complete. Duration: {duration_seconds}s")

            # Read final file and upload to S3
            with open(final_mp3_temp, 'rb') as f:
                final_buffer = io.BytesIO(f.read())

            final_mp3_key = f"podcasts/podcast_{podcast.id}.mp3"
            s3_client.upload_fileobj(
                final_buffer,
                BUCKET_NAME,
                final_mp3_key,
                ExtraArgs={'ContentType': 'audio/mpeg', 'ACL': 'private'}
            )

            final_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{final_mp3_key}"
            podcast.status = models.PodcastStatus.COMPLETE.value
            podcast.final_podcast_url = final_url
            user.podcasts_created += 1
            db.commit()

        except Exception as e:
            raise
        finally:
            # Clean up temp directory and all chunk files
            import shutil
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                logger.info(f"[TASK] Cleaned up temporary files for podcast {podcast.id}")

        logger.info(f"[TASK] ✓ Task Succeeded! Enhanced podcast created. ID: {podcast.id}")
        logger.info(f"[TASK] Duration: {duration_seconds}s, Final URL: {final_url}")
        # WORK IN PROGRESS
        # Send success notification email
        # try:
        #     mailing_service = get_mailing_service()
        #     if mailing_service:
        #         # Generate presigned URL for streaming (expires in 1 hour)
        #         from .services import s3_service
        #         stream_url = s3_service.generate_presigned_download_url(final_mp3_key, expiration=3600)

        #         mailing_service.send_podcast_ready_email(
        #             user_email=user.email,
        #             podcast_title=podcast.title or "Your Podcast",
        #             podcast_duration_seconds=duration_seconds,
        #             stream_url=stream_url,
        #             user_name=user.email.split('@')[0]  # Use part of email as name
        #         )
        #         logger.info(f"[TASK] ✓ Notification email sent to {user.email}")
        #     else:
        #         logger.info("[TASK] Mailing service not configured, skipping email notification")
        # except Exception as e:
        #     logger.error(f"[TASK] Failed to send notification email: {str(e)}")
        #     # Don't fail the task if email sending fails
        #     logger.info("[TASK] Continuing despite email notification failure")

    except Exception as e:
        logger.error(f"[TASK] ✗ Error in create_podcast_task for ID {podcast_id}: {e}")
        if 'podcast' in locals() and db.is_active:
            podcast.status = models.PodcastStatus.FAILED.value
            db.commit()

        # Log retry attempt with exponential backoff
        exc_message = f"Task failed for podcast {podcast_id}: {str(e)}"
        logger.warning(f"[TASK] Retry attempt {self.request.retries}/{self.max_retries}: {exc_message}")

        # Retry with exponential backoff
        try:
            raise self.retry(exc=e, countdown=min(5 * (2 ** self.request.retries), 600))
        except self.MaxRetriesExceededError:
            logger.error(f"[TASK] ✗ Max retries exceeded for podcast {podcast_id}. Task failed permanently.")
            if 'podcast' in locals() and db.is_active:
                podcast.status = models.PodcastStatus.FAILED.value
                db.commit()
            raise
    finally:
        db.close()

    return "Podcast created successfully."