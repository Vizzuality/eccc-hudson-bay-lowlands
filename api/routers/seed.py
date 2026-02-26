"""Seed endpoint for populating the database from metadata.json."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from services.seed import seed_database

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Seed"])


@router.post(
    "",
    summary="Seed the database",
    description="Populate the database from metadata.json. Idempotent — safe to call multiple times.",
)
def run_seed(db: Session = Depends(get_db)):
    """Seed the database with data from metadata.json."""
    try:
        counts = seed_database(db)
        db.commit()
        return {"status": "success", "counts": counts}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="metadata.json not found at the default path")
    except Exception as e:
        db.rollback()
        logger.exception("Seed failed")
        raise HTTPException(status_code=500, detail=f"Seed failed: {e}")
