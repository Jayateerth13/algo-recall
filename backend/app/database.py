import os
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Support both SQLite (local dev) and PostgreSQL (production)
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "flashcards.db"

# Load environment variables from a local .env file (useful for local dev)
load_dotenv()

# Use DATABASE_URL if set (for production), otherwise use SQLite (for local dev)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # PostgreSQL connection (production)
    # Supabase/Railway/etc provide DATABASE_URL in format:
    # postgresql://user:password@host:port/dbname
    # Some providers use postgres:// which needs to be converted
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}
else:
    # SQLite connection (local development)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db() -> None:
    """Create all database tables."""
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def ensure_user_columns() -> None:
    """
    Ensure per-user columns exist in the database.

    This runs lightweight ALTER TABLE statements that are safe to execute
    multiple times thanks to IF NOT EXISTS.
    """
    with engine.begin() as conn:
        backend = engine.url.get_backend_name()

        if backend == "sqlite":
            # Older SQLite builds may not support IF NOT EXISTS on ALTER TABLE.
            # Use PRAGMA to check columns and add only if missing.
            def _has_column(table: str, column: str) -> bool:
                rows = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
                return any(row[1] == column for row in rows)

            if not _has_column("problems", "user_id"):
                conn.exec_driver_sql("ALTER TABLE problems ADD COLUMN user_id VARCHAR")
            if not _has_column("review_history", "user_id"):
                conn.exec_driver_sql(
                    "ALTER TABLE review_history ADD COLUMN user_id VARCHAR"
                )
        else:
            # PostgreSQL / others
            conn.execute(
                text(
                    "ALTER TABLE IF EXISTS problems "
                    "ADD COLUMN IF NOT EXISTS user_id VARCHAR"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE IF EXISTS review_history "
                    "ADD COLUMN IF NOT EXISTS user_id VARCHAR"
                )
            )


def get_db():
    """FastAPI dependency to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


