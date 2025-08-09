## TLDR;
It converts your PDFs into short audio content that you would love to listen on go.

POD is designed to transform static PDFs into dynamic, summarized conversational podcasts. The core idea behind it is to make information consumption effortless and engaging, especially for users who prefer audio content over reading lengthy documents. By harnessing the power of artificial intelligence, POD automates the process of extracting key insights from PDFs, crafting natural-sounding scripts, and converting them into high-quality audio with distinct voices.

The application uses the Gemini API for summarization and script generation, distilling complex PDF content into concise, conversational dialogues. For audio production, it integrates the ElevenLabs API (and some more to come) to deliver remarkably realistic text-to-speech output, featuring a two-voice format that sounds like a natural podcast conversation. To handle the computationally intensive tasks without disrupting the user experience, POD employs asynchronous processing with Celery and Redis, queuing long-running jobs.

## How it works (under the hood)
When a user hits the submit button, the FastAPI backend instantly creates a database record and dispatches a job ID to the Redis queue, allowing for an immediate response to the frontend while the heavy lifting happens in the background. A dedicated Celery worker, previously deployed on Fly.io (though currently paused due to financial constraints), picks up the job, retrieves the PDF from S3, processes it through the Gemini API for script generation, and makes multiple calls to ElevenLabs for voice-specific audio segments, which are then stitched together into a cohesive MP3 using the pydub library. 

Checkout the live demo here [link](https://podcast-pro-gilt.vercel.app/demo) :)
