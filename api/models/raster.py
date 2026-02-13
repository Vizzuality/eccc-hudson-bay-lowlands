"""Raster SQLAlchemy model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from models.location import Location


class Raster(Base):
    """Raster model for storing COG metadata."""

    __tablename__ = "rasters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    crs: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("locations.id"), nullable=True, index=True
    )

    location: Mapped[Location | None] = relationship(back_populates="rasters")

    __table_args__ = (Index("ix_rasters_name", "name"),)
