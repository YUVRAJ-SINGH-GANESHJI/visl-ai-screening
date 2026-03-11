from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# SQLite for local dev; set DATABASE_URL to PostgreSQL connection string on Render.
# Neon PostgreSQL format: postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# pool_pre_ping=True handles Neon's serverless connections that may go idle and drop
# pool_recycle=300 recycles connections every 5 min to avoid stale connection errors
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency - yields a DB session and closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
