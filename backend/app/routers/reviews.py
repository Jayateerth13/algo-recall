from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import CurrentUser, get_current_user
from ..database import get_db

router = APIRouter()

MAX_INTERVAL_DAYS = 30


def _get_or_create_metadata(db: Session, problem_id: int) -> models.ReviewMetadata:
    metadata = (
        db.query(models.ReviewMetadata)
        .filter(models.ReviewMetadata.problem_id == problem_id)
        .first()
    )
    if not metadata:
        metadata = models.ReviewMetadata(problem_id=problem_id)
        db.add(metadata)
        db.flush()
    return metadata


@router.get("/due", response_model=List[schemas.ProblemWithReview])
def get_due_reviews(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return all problems for the current user as reviewable cards."""
    return (
        db.query(models.Problem)
        .filter(models.Problem.user_id == current_user.id)
        .order_by(models.Problem.id.asc())
        .all()
    )


@router.post("/", response_model=schemas.ReviewHistory)
def create_review(
    payload: schemas.ReviewHistoryCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    problem = (
        db.query(models.Problem)
        .filter(
            models.Problem.id == payload.problem_id,
            models.Problem.user_id == current_user.id,
        )
        .first()
    )
    if not problem:
        raise ValueError("Problem not found")

    now = datetime.utcnow()
    metadata = _get_or_create_metadata(db, payload.problem_id)

    # Update spaced repetition logic
    if payload.result == "remembered":
        metadata.interval_days = min(
            MAX_INTERVAL_DAYS, max(1, metadata.interval_days * 2)
        )
        metadata.times_remembered += 1
    else:
        metadata.interval_days = 1
        metadata.times_forgot += 1

    metadata.total_reviews += 1
    metadata.last_reviewed = now
    metadata.next_review_due = now + timedelta(days=metadata.interval_days)

    # Persist simple status flag on the problem for quick lookup in the UI.
    problem.review_status = 1 if payload.result == "remembered" else -1

    review = models.ReviewHistory(
        problem_id=payload.problem_id,
        result=payload.result,
        next_review_date=metadata.next_review_due,
        user_id=current_user.id,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    total_problems = (
        db.query(models.Problem)
        .filter(models.Problem.user_id == current_user.id)
        .count()
    )
    total_reviews = (
        db.query(models.ReviewHistory)
        .filter(models.ReviewHistory.user_id == current_user.id)
        .count()
    )
    remembered = (
        db.query(models.ReviewHistory)
        .filter(
            models.ReviewHistory.user_id == current_user.id,
            models.ReviewHistory.result == "remembered",
        )
        .count()
    )

    success_rate = float(remembered) / total_reviews * 100 if total_reviews else 0.0

    # Simple streak: count days with at least one review, up to last continuous segment
    dates = (
        db.query(models.ReviewHistory.reviewed_at)
        .filter(models.ReviewHistory.user_id == current_user.id)
        .order_by(models.ReviewHistory.reviewed_at.desc())
        .all()
    )
    streak = 0
    seen_days = set()
    today = datetime.utcnow().date()

    for (dt,) in dates:
        day = dt.date()
        if day in seen_days:
            continue
        seen_days.add(day)
        if day == today - timedelta(days=streak):
            streak += 1
        elif day < today - timedelta(days=streak):
            break

    return schemas.DashboardStats(
        total_problems=total_problems,
        total_reviews=total_reviews,
        success_rate=success_rate,
        streak_days=streak,
    )


@router.put("/{problem_id}/reset")
def reset_review(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    db.query(models.ReviewHistory).filter(
        models.ReviewHistory.problem_id == problem_id,
        models.ReviewHistory.user_id == current_user.id,
    ).delete()
    db.query(models.ReviewMetadata).filter(
        models.ReviewMetadata.problem_id == problem_id
    ).delete()

    # Also reset the simple status flag on the problem.
    problem = (
        db.query(models.Problem)
        .filter(
            models.Problem.id == problem_id,
            models.Problem.user_id == current_user.id,
        )
        .first()
    )
    if problem:
        problem.review_status = 0

    db.commit()
    return {"status": "ok"}

