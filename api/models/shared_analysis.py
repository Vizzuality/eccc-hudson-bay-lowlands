"""SQLAlchemy model for publicly shareable analysis snapshots."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, DateTime, Index, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class SharedAnalysis(Base):
    """Persisted analysis snapshot accessible via a public share link.

    Rows are deleted automatically by the nightly cleanup task once older than
    ``SHARED_ANALYSIS_TTL_DAYS``. The schema is intentionally minimal — we store
    the rendered analysis JSON and the input geojson so visitors can re-display
    the result without re-running the (expensive) zonal-stats pipeline.
    """

    __tablename__ = "shared_analyses"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    analysis: Mapped[dict] = mapped_column(JSON, nullable=False)
    geojson: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (Index("ix_shared_analyses_created_at", "created_at"),)
