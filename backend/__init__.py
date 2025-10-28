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

# Comprehensive Celery configuration for production robustness
celery_app.conf.update(
    # Task Tracking
    task_track_started=True,

    # Retry Configuration
    # Tasks will retry on connection errors, timeouts, and operational errors
    task_autoretry_for={
        'exc': (Exception,),
        'max_retries': 3,
        'countdown': 5,  # Initial retry after 5 seconds
    },
    task_max_retries=3,  # Maximum number of retries per task
    task_default_retry_delay=5,  # Default retry delay in seconds

    # Task Time Limits
    # Soft limit: Task receives SIGUSR1, allowing graceful shutdown (in seconds)
    # Hard limit: Task is forcefully killed (in seconds)
    task_soft_time_limit=1800,   # 30 minutes soft limit for podcast generation
    task_time_limit=2100,         # 35 minutes hard limit (5 min grace period)

    # Worker Configuration
    worker_prefetch_multiplier=1,  # Prefetch 1 task per worker (prevents monopolization)
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks (memory leak prevention)

    # Task Serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task Routes (can be extended as new task types are added)
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
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store detailed task execution info
)