from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import CurrentUser, get_current_user
from ..database import get_db

router = APIRouter()


@router.post("/neetcode150", response_model=List[schemas.Problem])
def import_neetcode150(
    problems: List[schemas.ProblemCreate],
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    created: List[models.Problem] = []
    for payload in problems:
        problem = models.Problem(
            **payload.model_dump(),
            user_id=current_user.id,
        )
        db.add(problem)
        created.append(problem)
    db.commit()
    for p in created:
        db.refresh(p)
    return created


