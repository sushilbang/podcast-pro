import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "backend",
    broker=redis_url,
    backend=redis_url,
    include=['backend.tasks']
)

celery_app.conf.update(
    task_track_started=True,
)