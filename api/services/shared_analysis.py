"""Service layer for the shared-analysis endpoints."""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import delete
from sqlalchemy.orm import Session

from models.shared_analysis import SharedAnalysis
from schemas.analysis import AnalysisInput, AnalysisResponse
from schemas.shared_analysis import SharedAnalysisRead
from services.analysis import validate_geometry_v2

logger = logging.getLogger(__name__)

SHARED_ANALYSIS_TTL_DAYS: int = 30

# Single user-facing message for both "row missing" and "stored payload no longer matches the
# current AnalysisResponse schema" — the FE only needs one branch to render an expired state.
EXPIRED_DETAIL: str = "This shared analysis has expired or is no longer available"


def create_shared(
    db: Session,
    analysis: AnalysisResponse,
    geojson: AnalysisInput,
) -> SharedAnalysis:
    """Persist an analysis snapshot and return the inserted row.

    The geojson is re-validated through the v2 pipeline (same checks used by
    ``POST /analysis/v2``) so we never persist geometry that would have failed
    a normal analysis run. Invalid input raises ``HTTPException(422)``.
    """
    validate_geometry_v2(geojson)

    row = SharedAnalysis(
        analysis=analysis.model_dump(mode="json"),
        geojson=geojson.model_dump(mode="json"),
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    logger.info("Created shared analysis %s", row.id)
    return row


def get_shared(db: Session, share_id: UUID) -> SharedAnalysisRead:
    """Fetch a shared analysis and revalidate its stored payload against the current schema.

    Two failure modes collapse to a single 410 response:
    1. Row not found (deleted by the cleanup task or never existed).
    2. Stored ``analysis`` JSON no longer conforms to ``AnalysisResponse`` (the
       widget schema changed since the snapshot was taken).
    """
    row = db.get(SharedAnalysis, share_id)
    if row is None:
        logger.info("Shared analysis %s not found", share_id)
        raise HTTPException(status_code=410, detail=EXPIRED_DETAIL)

    try:
        analysis = AnalysisResponse.model_validate(row.analysis)
    except ValidationError as exc:
        logger.warning(
            "Shared analysis %s no longer conforms to AnalysisResponse: %s",
            share_id,
            exc.errors(),
        )
        raise HTTPException(status_code=410, detail=EXPIRED_DETAIL)

    return SharedAnalysisRead(
        id=row.id,
        analysis=analysis,
        geojson=row.geojson,
        created_at=row.created_at,
    )


def delete_expired(db: Session, ttl_days: int = SHARED_ANALYSIS_TTL_DAYS) -> int:
    """Delete rows older than ``ttl_days``. Returns the number of rows removed.

    Does NOT commit — the caller (the scheduled cleanup task in production, the
    test fixture in tests) is responsible for committing or rolling back. This
    mirrors the convention used by ``services/seed.py``.
    """
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=ttl_days)
    result = db.execute(delete(SharedAnalysis).where(SharedAnalysis.created_at < cutoff))
    count = result.rowcount or 0
    if count:
        logger.info("Deleted %d expired shared analyses (cutoff %s)", count, cutoff.isoformat())
    return count
