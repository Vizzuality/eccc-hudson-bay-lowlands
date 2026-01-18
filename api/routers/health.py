"""Health check endpoint router."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Health Check",
    description="Returns the health status of the API service.",
    response_description="Health status object",
)
def health():
    """Health check endpoint."""
    return {"status": "healthy"}
