"""Location SQLAlchemy model with PostGIS geometry support."""

from __future__ import annotations

from typing import TYPE_CHECKING

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import JSON, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from models.raster import Raster


class Location(Base):
    """Location model for storing geographic areas with PostGIS geometry."""

    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    geometry: Mapped[WKBElement] = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=False,
    )
    bounding_box: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    area_sq_km: Mapped[float] = mapped_column(Float, nullable=False)

    rasters: Mapped[list[Raster]] = relationship(back_populates="location")

    __table_args__ = (Index("ix_locations_name", "name"),)
