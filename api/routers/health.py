"""Health check endpoint router."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.database import get_db

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Health Check",
    description="Returns the health status of the API service and database connectivity.",
    response_description="Health status object with service details",
)
def health(db: Session = Depends(get_db)):
    """Health check endpoint that verifies API and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "services": {
                "api": "healthy",
                "database": "healthy",
            },
        }
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "services": {
                    "api": "healthy",
                    "database": "unhealthy",
                },
            },
        )
