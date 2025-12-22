from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import CurrentUser, get_current_user
from ..database import get_db
from ..seed import PROBLEMS_FILE, SECTION_HEADINGS

router = APIRouter()


def _ensure_seeded_for_user(db: Session, user_id: str) -> None:
    """
    Seed initial problems for a given user if they have none yet.

    This mirrors the old global seeding logic but uses the supplied DB session
    and associates each problem with the Supabase user id.
    """
    has_any = db.query(models.Problem).filter(models.Problem.user_id == user_id).first()
    if has_any or not PROBLEMS_FILE.exists():
        return

    for line in PROBLEMS_FILE.read_text(encoding="utf-8").splitlines():
        title = line.strip()
        if not title or title in SECTION_HEADINGS:
            continue

        problem = models.Problem(title=title, user_id=user_id)
        db.add(problem)

    db.commit()


@router.get("/", response_model=List[schemas.ProblemWithReview])
def list_problems(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    difficulty: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
):
    # Ensure this user has their initial problem set.
    _ensure_seeded_for_user(db, current_user.id)

    query = db.query(models.Problem).filter(
        models.Problem.user_id == current_user.id
    )

    if difficulty:
        query = query.filter(models.Problem.difficulty == difficulty)
    if platform:
        query = query.filter(models.Problem.platform == platform)
    if tag:
        query = query.filter(models.Problem.tags.contains([tag]))

    return query.all()


@router.get("/{problem_id}", response_model=schemas.ProblemWithReview)
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    problem = (
        db.query(models.Problem)
        .filter(
            models.Problem.id == problem_id,
            models.Problem.user_id == current_user.id,
        )
        .first()
    )
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return problem


@router.post("/", response_model=schemas.ProblemWithReview, status_code=201)
def create_problem(
    payload: schemas.ProblemCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    problem = models.Problem(**payload.model_dump(), user_id=current_user.id)
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem


@router.put("/{problem_id}", response_model=schemas.ProblemWithReview)
def update_problem(
    problem_id: int,
    payload: schemas.ProblemUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    problem = (
        db.query(models.Problem)
        .filter(
            models.Problem.id == problem_id,
            models.Problem.user_id == current_user.id,
        )
        .first()
    )
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(problem, field, value)

    db.commit()
    db.refresh(problem)
    return problem


@router.delete("/{problem_id}", status_code=204)
def delete_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    problem = (
        db.query(models.Problem)
        .filter(
            models.Problem.id == problem_id,
            models.Problem.user_id == current_user.id,
        )
        .first()
    )
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    # Remove any review history and metadata tied to this problem first to avoid
    # foreign key issues, then delete the problem itself.
    db.query(models.ReviewHistory).filter(
        models.ReviewHistory.problem_id == problem_id,
        models.ReviewHistory.user_id == current_user.id,
    ).delete()
    db.query(models.ReviewMetadata).filter(
        models.ReviewMetadata.problem_id == problem_id
    ).delete()

    db.delete(problem)
    db.commit()


@router.get("/tags", response_model=List[str])
def get_tags(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    tags_set = set()
    problems = (
        db.query(models.Problem)
        .filter(models.Problem.user_id == current_user.id)
        .all()
    )
    for p in problems:
        if p.tags:
            tags_set.update(p.tags)
    return sorted(tags_set)


