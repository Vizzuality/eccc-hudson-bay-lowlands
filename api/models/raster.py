"""Raster SQLAlchemy model."""

from sqlalchemy import Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class Raster(Base):
    """Raster model for storing COG metadata."""

    __tablename__ = "rasters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    crs: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    __table_args__ = (Index("ix_rasters_name", "name"),)
