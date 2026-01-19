"""Pydantic schemas for Raster model."""

from pydantic import BaseModel, ConfigDict


class RasterBase(BaseModel):
    """Base schema with common raster fields."""

    name: str
    crs: str
    path: str
    description: str | None = None


class RasterCreate(RasterBase):
    """Schema for creating a new raster."""

    pass


class RasterResponse(RasterBase):
    """Schema for raster response with id."""

    model_config = ConfigDict(from_attributes=True)

    id: int


class PaginatedRasterResponse(BaseModel):
    """Schema for paginated raster list response."""

    items: list[RasterResponse]
    total: int
    page: int
    size: int
    pages: int
