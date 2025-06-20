import os
import time
import fitz
import boto3
import tempfile
import io
import re
from pydub import AudioSegment
# from openai import OpenAI
import google.generativeai as genai
from elevenlabs.client import ElevenLabs

from . import celery_app
from . import models, crud
from .database import SessionLocal


# Initialize clients
# openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")


def clean_script(script_text: str) -> str:
    """
    Removes common non-spoken text from an AI-generated script.
    """
    cleaned_text = re.sub(r'\[.*?\]', '', script_text)
    cleaned_text = re.sub(r'^\s*\w+:\s*', '', cleaned_text, flags=re.MULTILINE | re.IGNORECASE)
    cleaned_text = re.sub(r'\*.*?\*', '', cleaned_text)
    cleaned_text = re.sub(r'\n{2,}', '\n', cleaned_text)
    return cleaned_text.strip()


@celery_app.task
def create_podcast_task(podcast_id: int):
    """
    The main background task to process a file and generate a podcast
    """
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
        print(f"[{podcast.id}] Generating script with Gemini...")

        prompt = """You are an expert podcast scriptwriter creating a dynamic, conversational script for two hosts, Dorothy and Will.

        CRITICAL INSTRUCTIONS:

        1. The final script must be a maximum of approximately 1000 characters long (including speaker labels, spaces, and punctuation). Adapt the level of detail from the source text to strictly meet this length requirement.
        2. Format the entire script with clear speaker labels: Dorothy: and Will:. Each time a speaker changes, start a new line with their label.
        3. ONLY output the speaker labels and their spoken words. Do NOT include any other text, stage directions, or descriptions like [intro music].
        4. The conversation should flow naturally. Dorothy can introduce topics, and Will can provide commentary or ask questions, creating a dynamic dialogue.
        5. Use punctuation deliberately to guide realistic pacing — for example, commas for short pauses, ellipses (...) for longer ones, and em dashes (—) for emphasis or hesitation. This will make the spoken audio more engaging and natural.
        6. Ensure the final output is a clean, ready-to-parse script for audio synthesis.
        7. Dorothy is female and Will is male.

        Here is the source text to transform into this two-person dialogue:
        ---
        {text_to_summarize}
        ---
        """
        max_chars = 2005
        truncated_text = source_text[:max_chars]
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt.format(text_to_summarize=truncated_text))
        script = response.text

        # script = """Dorothy: Welcome to our podcast! Today, we're diving into the fascinating world of AI and its impact on our lives.
        #             Will: Absolutely, Dorothy! AI is transforming everything from healthcare to entertainment."""

        if not script:
            raise ValueError("Gemini failed to generate a script.")

        print(f"[{podcast.id}] Script generated successfully.")
        print(f"[{podcast.id}] Script generated. Now creating two-voice audio.")

        voice_map = {
            "DOROTHY": "ThT5KcBeYPX3keUQqHPh",
            "WILL": "bIHbv24MWmeRgasZH58o"
        }

        script_lines = script.strip().split('\n')
        final_podcast = AudioSegment.silent(duration=500)

        for line in script_lines:
            line = line.strip()
            if not line:
                continue

            match = re.match(r'^(\w+):\s*(.*)', line)
            if match:
                speaker, text_to_speak = match.groups()
                speaker = speaker.upper()

                if speaker in voice_map:
                    voice_id_to_use = voice_map[speaker]
                    print(f"[{podcast.id}] Generating audio for {speaker}...")

                    audio_iterator = elevenlabs_client.text_to_speech.convert(
                        voice_id=voice_id_to_use,
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
            else:
                print(f"[{podcast.id}] Warning: Skipping line without speaker label: {line}")

        print(f"[{podcast.id}] All audio segments generated. Exporting and uploading final MP3...")

        final_buffer = io.BytesIO()
        final_podcast.export(final_buffer, format="mp3")
        final_buffer.seek(0)

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

        print(f"[{podcast.id}] Task Succeeded! Two-voice podcast created.")
        print(f"[{podcast.id}] Task Succeeded! Final URL: {final_url}")

    except Exception as e:
        print(f"Error in create_podcast_task for ID {podcast_id}: {e}")
        if 'podcast' in locals() and db.is_active:
            podcast.status = models.PodcastStatus.FAILED.value
            db.commit()
        raise
    finally:
        db.close()

    return "Podcast created successfully."
