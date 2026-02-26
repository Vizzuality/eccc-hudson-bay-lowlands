"""Seed endpoint for populating the database via JSON payload."""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from config import get_settings
from db.database import get_db
from services.seed import seed_database

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Seed"])


def verify_seed_secret(x_seed_secret: str = Header(description="Secret token to authorize seeding")) -> str:
    """Validate the seed secret from the request header."""
    settings = get_settings()
    if x_seed_secret != settings.seed_secret:
        raise HTTPException(status_code=403, detail="Invalid seed secret")
    return x_seed_secret


@router.post(
    "",
    summary="Seed the database",
    description="Populate the database from a JSON payload. Requires X-Seed-Secret header. Idempotent.",
)
def run_seed(
    payload: dict,
    db: Session = Depends(get_db),
    _secret: str = Depends(verify_seed_secret),
):
    """Seed the database with the provided metadata payload."""
    try:
        counts = seed_database(db, payload=payload)
        db.commit()
        return {"status": "success", "counts": counts}
    except Exception as e:
        db.rollback()
        logger.exception("Seed failed")
        raise HTTPException(status_code=500, detail=f"Seed failed: {e}")
