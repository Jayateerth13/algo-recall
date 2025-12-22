from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, HttpUrl, field_validator

ReviewResult = Literal["remembered", "forgot"]
Difficulty = Literal["easy", "medium", "hard"]


class ProblemBase(BaseModel):
    title: str
    url: Optional[HttpUrl] = None
    difficulty: Optional[Difficulty] = None
    platform: Optional[str] = "leetcode"
    notes: Optional[str] = None
    algorithm_steps: Optional[str] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    code_snippet: Optional[str] = None
    tags: Optional[List[str]] = None

    @field_validator("tags", mode="before")
    @classmethod
    def empty_list_to_none(cls, v):
        if v == []:
            return None
        return v


class ProblemCreate(ProblemBase):
    title: str


class ProblemUpdate(ProblemBase):
    pass


class Problem(ProblemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # -1 = forgot, 0 = not reviewed yet, 1 = remembered
    review_status: int | None = 0

    class Config:
        from_attributes = True


class ReviewHistoryBase(BaseModel):
    problem_id: int
    result: ReviewResult


class ReviewHistoryCreate(ReviewHistoryBase):
    pass


class ReviewHistory(ReviewHistoryBase):
    id: int
    reviewed_at: datetime
    next_review_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewMetadata(BaseModel):
    problem_id: int
    total_reviews: int
    times_remembered: int
    times_forgot: int
    last_reviewed: Optional[datetime] = None
    next_review_due: Optional[datetime] = None
    interval_days: int

    class Config:
        from_attributes = True


class ProblemWithReview(Problem):
    review_metadata: Optional[ReviewMetadata] = None


class DashboardStats(BaseModel):
    total_problems: int
    total_reviews: int
    success_rate: float
    streak_days: int

