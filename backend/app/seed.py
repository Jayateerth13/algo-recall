from __future__ import annotations

from pathlib import Path

from .database import SessionLocal
from . import models


PROBLEMS_FILE = Path(__file__).resolve().parents[1] / "problems_list"

SECTION_HEADINGS = {
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Binary Search",
    "Linked List",
    "Trees",
    "Tries",
    "Heap / Priority Queue",
    "Backtracking",
    "Graphs",
    "Advanced Graphs",
    "Dynamic Programming I (1D DP)",
    "Dynamic Programming II (2D DP)",
    "Greedy",
    "Intervals",
    "Math & Geometry",
    "Bit Manipulation",
    "Advanced Topics",
}


def seed_problems_from_list() -> None:
    """Seed the database with problem titles from backend/problems_list.

    - Inserts ONLY lines that are not section headings and not blank.
    - Stores only the title field; all other fields remain empty for you to fill later.
    - Idempotent: existing titles are not duplicated.
    """
    if not PROBLEMS_FILE.exists():
        return

    db = SessionLocal()
    try:
        for line in PROBLEMS_FILE.read_text(encoding="utf-8").splitlines():
            title = line.strip()
            if not title or title in SECTION_HEADINGS:
                continue

            existing = db.query(models.Problem).filter_by(title=title).first()
            if existing:
                continue

            problem = models.Problem(title=title)
            db.add(problem)

        db.commit()
    finally:
        db.close()

