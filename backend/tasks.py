import os
import time
import json
from urllib import response
import fitz
import boto3
import tempfile
import io
import re
from pydub import AudioSegment
import google.generativeai as genai
from elevenlabs.client import ElevenLabs
import requests
from . import celery_app
from . import models, crud
from .database import SessionLocal

# LemonFox API setup
LEMONFOX_API_KEY = os.getenv("LEMONFOX_API_KEY")
LEMONFOX_API_URL = "https://api.lemonfox.ai/v1/audio/speech"

def generate_lemonfox_audio(voice: str, text: str) -> AudioSegment:
    headers = {
        "Authorization": f"Bearer {LEMONFOX_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "input": text,
        "voice": voice,
        "response_format": "mp3"
    }

    response = requests.post(LEMONFOX_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Lemonfox API error: {response.status_code} - {response.text}")

    audio_buffer = io.BytesIO(response.content)
    return AudioSegment.from_mp3(audio_buffer)

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

def generate_enhanced_content(source_text: str, requirements: str = None, output_type: str = "podcast"):
    """Generate content based on user requirements and output type."""
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Base prompt modifications based on output type
    length_guidance = {
        "summary": "Create a concise 5-10 minute summary focusing on key points.",
        "podcast": "Create a comprehensive 15-30 minute discussion covering all major topics.",
        "deep-dive": "Create an in-depth 30+ minute analysis with detailed explanations.",
        "key-points": "Create a brief 3-5 minute overview of only the most essential points."
    }
    
    # Incorporate user requirements
    user_guidance = f"\n\nUser Requirements: {requirements}" if requirements else ""
    
    summary_prompt = f"""
    Analyze the following text and create a detailed, structured summary. 
    {length_guidance.get(output_type, length_guidance["podcast"])}
    
    Identify and extract:
    1. The core thesis or main argument
    2. The top 3-5 key topics or supporting points  
    3. Any important data, statistics, or case studies mentioned
    4. The primary conclusion or takeaway
    
    {user_guidance}
    
    Do not make up information. Base your summary strictly on the provided text.
    
    ---
    {source_text}
    ---
    """
    
    summary_response = model.generate_content(summary_prompt)
    return summary_response.text

def generate_metadata(summary: str, source_text: str):
    """Generate additional metadata like description, tags, and chapters."""
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Generate description
    desc_prompt = f"Create a compelling 2-3 sentence description for this content:\n\n{summary}"
    description = model.generate_content(desc_prompt).text.strip()
    
    # Generate tags
    tags_prompt = f"Generate 3-5 relevant tags/keywords for this content (return as comma-separated list):\n\n{summary}"
    tags_response = model.generate_content(tags_prompt).text.strip()
    tags = [tag.strip() for tag in tags_response.split(',')]
    
    # Generate chapters (simplified for now)
    chapters = [
        {"title": "Introduction", "start": 0, "end": 60},
        {"title": "Main Discussion", "start": 60, "end": 300},
        {"title": "Key Insights", "start": 300, "end": 480},
        {"title": "Conclusion", "start": 480, "end": 600}
    ]
    
    return description, tags, chapters

@celery_app.task
def create_podcast_task(podcast_id: int):
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
        
        # Calculate file size
        file_size_mb = os.path.getsize(local_filename) / (1024 * 1024)
        podcast.file_size = f"{file_size_mb:.1f} MB"
        
        os.remove(local_filename)

        if not source_text.strip():
            raise ValueError("Could not extract any text from the PDF.")

        print(f"[{podcast.id}] Text extracted successfully. Length: {len(source_text)} chars.")

        # Generate enhanced content based on user requirements
        detailed_summary = generate_enhanced_content(
            source_text, 
            podcast.requirements, 
            podcast.output_type or "podcast"
        )
        podcast.summary = detailed_summary
        
        # Generate metadata
        description, tags, chapters = generate_metadata(detailed_summary, source_text)
        podcast.description = description
        podcast.tags = json.dumps(tags)
        podcast.chapters = json.dumps(chapters)
        
        db.commit()
        
        # Generate title
        print(f"[{podcast.id}] Generating title...")
        model = genai.GenerativeModel('gemini-1.5-flash')
        title_prompt = f"Based on the following summary, generate a short, catchy, and descriptive title (5-10 words). Do not use quotes.\n\nSUMMARY:\n{detailed_summary}"
        title_response = model.generate_content(title_prompt)
        generated_title = title_response.text.strip().replace('"', '')
        podcast.title = generated_title
        db.commit()

        # Generate script (enhanced based on output type)
        script_length = {
            "summary": "approximately 800 words",
            "podcast": "approximately 1200 words", 
            "deep-dive": "approximately 2000 words",
            "key-points": "approximately 500 words"
        }
        
        prompt = f"""You are an expert podcast scriptwriter creating a dynamic, engaging script for two hosts: Dorothy (an insightful analyst) and Will (a curious commentator).

        Output Type: {podcast.output_type or 'podcast'}
        Target Length: {script_length.get(podcast.output_type or 'podcast', '1200 words')}
        
        User Requirements: {podcast.requirements or 'Standard conversational format'}

        Source Material:
        You will be given a detailed summary of a document. Your task is to transform this summary into a natural, two-person dialogue.

        Critical Instructions:
        1. Narrative Flow: Create a narrative that matches the requested output type and user requirements.
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
        # script = clean_script(raw_script)
        
        # Store transcript
        podcast.transcript = script
        db.commit()

        if not script:
            raise ValueError("Gemini failed to generate a script.")

        print(f"[{podcast.id}] Script generated successfully.")
        print(f"[{podcast.id}] Creating audio with {podcast.speech_model or 'default'} model...")

        # Voice selection based on speech model
        if podcast.speech_model and "elevenlabs" in podcast.speech_model:
            voice_map = {
                "DOROTHY": "ThT5KcBeYPX3keUQqHPh",
                "WILL": "bIHbv24MWmeRgasZH58o"
            }
            use_elevenlabs = True
        else:
            voice_map = {
                "DOROTHY": "sarah",
                "WILL": "puck"
            }
            use_elevenlabs = False

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
                    print(f"[{podcast.id}] Generating audio for {speaker}...")

                    if use_elevenlabs:
                        # Use ElevenLabs
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
                    else:
                        # Use LemonFox
                        segment = generate_lemonfox_audio(voice_map[speaker], text_to_speak)
                    
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
        raise
    finally:
        db.close()

    return "Enhanced podcast created successfully."