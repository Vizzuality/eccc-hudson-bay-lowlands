"""Pydantic schemas for geometry validation."""

from pydantic import BaseModel, Field


class GeometryValidationResponse(BaseModel):
    """Response schema for geometry validation results."""

    valid: bool = Field(description="Whether the geometry passed all validation checks")
    geometry_type: str = Field(description="The GeoJSON geometry type (Polygon or MultiPolygon)")
    crs: str = Field(
        default="EPSG:4326",
        description="The coordinate reference system of the input geometry",
    )
    area_sq_km: float = Field(description="Computed area of the geometry in square kilometers")
    max_area_sq_km: float = Field(
        default=1000.0,
        description="Maximum allowed area in square kilometers",
    )
    errors: list[str] = Field(
        default_factory=list,
        description="List of validation error messages (empty if valid)",
    )
