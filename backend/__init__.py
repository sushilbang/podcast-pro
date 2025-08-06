import os
from celery import Celery
from dotenv import load_dotenv
import ssl

load_dotenv()

redis_url = os.getenv("REDIS_URL")

celery_app = Celery(
    "backend",
    broker=redis_url,
    backend=redis_url,
    include=['backend.tasks']
)

celery_app.conf.update(
    broker_use_ssl={
        "ssl_cert_reqs": ssl.CERT_NONE
    },
    redis_backend_use_ssl={
        "ssl_cert_reqs": ssl.CERT_NONE
    },
    task_track_started=True,
)