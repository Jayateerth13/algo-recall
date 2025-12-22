import os
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import relationship

from .database import Base

# Use JSONB for PostgreSQL, JSON for SQLite
# Check if we're using PostgreSQL (DATABASE_URL contains postgresql)
USE_POSTGRESQL = os.getenv("DATABASE_URL", "").startswith("postgresql")
JSON_COLUMN = JSONB if USE_POSTGRESQL else SQLiteJSON


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    url = Column(String, nullable=True)
    difficulty = Column(String, nullable=True, index=True)  # easy/medium/hard
    platform = Column(String, default="leetcode", index=True)
    notes = Column(Text, nullable=True)
    algorithm_steps = Column(Text, nullable=True)
    time_complexity = Column(String, nullable=True)
    space_complexity = Column(String, nullable=True)
    code_snippet = Column(Text, nullable=True)
    tags = Column(JSON_COLUMN, nullable=True)
    # -1 = forgot, 0 = not reviewed yet, 1 = remembered
    review_status = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    review_metadata = relationship(
        "ReviewMetadata", back_populates="problem", uselist=False
    )
    reviews = relationship("ReviewHistory", back_populates="problem")


class ReviewHistory(Base):
    __tablename__ = "review_history"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), index=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow, index=True)
    result = Column(String, nullable=False)  # remembered / forgot
    next_review_date = Column(DateTime, nullable=True, index=True)

    problem = relationship("Problem", back_populates="reviews")


class ReviewMetadata(Base):
    __tablename__ = "review_metadata"

    problem_id = Column(
        Integer, ForeignKey("problems.id"), primary_key=True, index=True
    )
    total_reviews = Column(Integer, default=0)
    times_remembered = Column(Integer, default=0)
    times_forgot = Column(Integer, default=0)
    last_reviewed = Column(DateTime, nullable=True)
    next_review_due = Column(DateTime, nullable=True, index=True)
    interval_days = Column(Integer, default=1)

    problem = relationship("Problem", back_populates="review_metadata")


