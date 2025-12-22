import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  # imported for side-effects (SQLAlchemy models)
from .database import init_db
from .routers import problems, reviews, import_routes
from .health import router as health_router
from .seed import seed_problems_from_list


def create_app() -> FastAPI:
    app = FastAPI(
        title="LeetCode Algorithm Flashcard API",
        version="0.1.0",
        description=(
            "Backend API for the LeetCode flashcard app "
            "with algorithm pattern practice."
        ),
    )

    # CORS configuration - use environment variable or default to allow all for dev
    cors_origins = os.getenv("CORS_ORIGINS", "*")
    if cors_origins == "*":
        allow_origins = ["*"]
    else:
        # Split comma-separated origins
        allow_origins = [origin.strip() for origin in cors_origins.split(",")]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health_router)  # Health check (no prefix)
    app.include_router(problems.router, prefix="/api/problems", tags=["problems"])
    app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
    app.include_router(import_routes.router, prefix="/api/import", tags=["import"])

    @app.on_event("startup")
    async def on_startup() -> None:  # pragma: no cover - simple bootstrap
        init_db()
        seed_problems_from_list()

    return app


app = create_app()

