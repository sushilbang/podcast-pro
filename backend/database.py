import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
#entry point to database
engine = create_engine(
    os.getenv("DATABASE_URL"),
    pool_size=15,          # Default connections
    max_overflow=15,      # Temp connections beyond pool_size
    pool_pre_ping=True,   # Checks connections are alive
    pool_recycle=3600     # Recycle connections hourly (prevents timeouts)
)
# each instance of session local will be a new database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# this base class will be inherited by all db models
Base = declarative_base()