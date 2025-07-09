Creates a small summarized conversational podcast from pdfs (only).
Uses gemini api for summarization and script generation and eleven labs api for TTS. Used celery and redis for queuing and computationally heavy tasks. Once you hit the submit button the backend creates a task that is sent to the celery worker. Depending on the preset concurrency the worker can handle corresponding number of concurrent requests.

To reduce the load on server the pdfs are stored in S3 buckets which generates a link for the same. These links are then used to extract text from the pdfs and move further in the process.

Used redis for rate limiting as an security initiative.

As for the frontend part, I built the frontend using Next.js App Router. Used shadcn-ui, daisy-ui and more for components. Used supabase for two purposes first is data storage and another is auth.

Note: Auth with supabase is too much frontend centric.
