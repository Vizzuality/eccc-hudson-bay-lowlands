"""Pydantic schemas for Location model."""

from typing import Literal

from pydantic import BaseModel, field_validator

from schemas.raster import RasterResponse


class LocationCreate(BaseModel):
    """Schema for creating a new location.

    Accepts GeoJSON Polygon or MultiPolygon geometry in EPSG:4326 or EPSG:3857.
    Bounding box and area are always auto-computed from the geometry.
    """

    name: str
    geometry: dict
    crs: Literal["EPSG:4326", "EPSG:3857"] = "EPSG:4326"

    @field_validator("geometry")
    @classmethod
    def validate_geometry(cls, v: dict) -> dict:
        """Validate that geometry is a dict with valid Polygon or MultiPolygon structure."""
        if not isinstance(v, dict):
            raise ValueError("Geometry must be a GeoJSON object")

        geom_type = v.get("type")
        if geom_type not in ("Polygon", "MultiPolygon"):
            raise ValueError("Geometry type must be Polygon or MultiPolygon")

        if "coordinates" not in v:
            raise ValueError("Geometry must have coordinates")

        return v


class LocationResponse(BaseModel):
    """Schema for location response."""

    id: int
    name: str
    geometry: dict
    bounding_box: list[float]
    area_sq_km: float
    crs: str = "EPSG:4326"


class LocationWithRastersResponse(LocationResponse):
    """Schema for location response with nested rasters."""

    rasters: list[RasterResponse]


class PaginatedLocationResponse(BaseModel):
    """Schema for paginated location list response."""

    items: list[LocationResponse]
    total: int
    page: int
    size: int
    pages: int
