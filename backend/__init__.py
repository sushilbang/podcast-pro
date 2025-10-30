import os
from celery import Celery
from dotenv import load_dotenv
from kombu import Queue, Exchange

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "backend",
    broker=redis_url,
    backend=redis_url,
    include=['backend.tasks']
)

# Celery configuration
celery_app.conf.update(
    # Task Tracking
    task_track_started=True,

    # Task Time Limits
    # Note: Soft timeouts not supported on Windows (requires SIGUSR1 signal)
    task_time_limit=2100,  # 35 minutes hard limit for podcast generation

    # Worker Configuration
    worker_prefetch_multiplier=1,  # Prefetch 1 task per worker
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks

    # Task Serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task Routes
    task_routes={
        'backend.tasks.create_podcast_task': {'queue': 'podcasts'},
    },

    # Queue Configuration
    task_queues=(
        Queue('default', Exchange('default'), routing_key='default'),
        Queue('podcasts', Exchange('podcasts'), routing_key='podcasts'),
    ),
    task_default_queue='default',
    task_default_exchange='default',
    task_default_routing_key='default',

    # Result Backend Configuration
    result_expires=3600,
)