import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  # imported for side-effects (SQLAlchemy models)
from .database import init_db, ensure_user_columns, DATABASE_URL
from .routers import problems, reviews, import_routes
from .health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="LeetCode Algorithm Flashcard API",
        version="0.1.0",
        description=(
            "Backend API for the LeetCode flashcard app "
            "with algorithm pattern practice."
        ),
    )

    # CORS configuration - require explicit origins in production
    cors_origins = os.getenv("CORS_ORIGINS")
    if not cors_origins:
        # For local development, allow common dev ports
        # In production, CORS_ORIGINS must be set!
        if os.getenv("ENVIRONMENT") != "production":
            allow_origins = [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
            ]
        else:
            raise ValueError(
                "CORS_ORIGINS environment variable must be set in production!"
            )
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
        # Always ensure tables exist
        init_db()
        # Ensure per-user columns exist
        ensure_user_columns()

        # Note: Problem seeding is now handled by database trigger in Supabase.
        # The trigger automatically seeds 150 problems for new users when they sign up.

    return app


app = create_app()

