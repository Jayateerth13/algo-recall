from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.post("/neetcode150", response_model=List[schemas.Problem])
def import_neetcode150(
    problems: List[schemas.ProblemCreate],
    db: Session = Depends(get_db),
):
    created: List[models.Problem] = []
    for payload in problems:
        problem = models.Problem(**payload.model_dump())
        db.add(problem)
        created.append(problem)
    db.commit()
    for p in created:
        db.refresh(p)
    return created


