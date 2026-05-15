"""Periodic cleanup tasks wired into the FastAPI lifespan handler."""

import logging

from fastapi_utilities import repeat_at

from db.database import SessionLocal
from services.shared_analysis import delete_expired

logger = logging.getLogger(__name__)


@repeat_at(cron="0 3 * * *")
async def cleanup_shared_analyses() -> None:
    """Delete shared analyses older than the configured TTL — runs daily at 03:00 UTC.

    Errors are caught and logged so a transient DB issue can't kill the scheduling
    loop and leave the cron silently stopped for the rest of the process lifetime.
    """
    try:
        with SessionLocal() as db:
            delete_expired(db)
            db.commit()
    except Exception:
        logger.exception("Scheduled cleanup of shared analyses failed")
