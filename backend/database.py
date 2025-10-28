import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database connection URL with SSL
db_url = os.getenv("DATABASE_URL")
if db_url and "sslmode" not in db_url:
    db_url += "?sslmode=require"

# Robust connection pooling configuration for production
# Calculation: (num_workers * max_concurrent_tasks) + fastapi_buffer + safety_margin
# For 4 Celery workers with 8 concurrent tasks each + FastAPI: (4 * 8) + 4 + 4 = 40 max, 20 base
engine = create_engine(
    db_url,
    pool_size=20,                         # Base connections in pool (increased from 5)
    max_overflow=10,                      # Additional connections beyond pool_size for spikes
    pool_pre_ping=True,                   # Verify connections are alive before use (prevents stale connections)
    pool_recycle=1800,                    # Recycle connections every 30 minutes (prevents timeout issues)
    pool_reset_on_return='rollback',      # Reset connection state after return
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",  # SQL logging (disabled by default)
    connect_args={
        'connect_timeout': 10,            # Connection timeout in seconds
        'keepalives': 1,                  # Enable TCP keepalives
        'keepalives_idle': 30,            # Keepalive idle time in seconds
        'keepalives_interval': 10,        # Keepalive interval in seconds
    }
)
# each instance of session local will be a new database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# this base class will be inherited by all db models
Base = declarative_base()