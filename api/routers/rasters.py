"""Rasters CRUD endpoint router."""

import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from db.database import get_db
from models.raster import Raster
from schemas.raster import PaginatedRasterResponse, RasterCreate, RasterResponse

router = APIRouter(tags=["Rasters"])


@router.get(
    "/",
    summary="List Rasters",
    description="Returns a paginated list of rasters.",
    response_model=PaginatedRasterResponse,
)
def list_rasters(
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedRasterResponse:
    """List rasters with pagination."""
    # Get total count
    total = db.scalar(select(func.count()).select_from(Raster))

    # Calculate pagination
    pages = math.ceil(total / size) if total > 0 else 0
    offset = (page - 1) * size

    # Get paginated items
    stmt = select(Raster).offset(offset).limit(size)
    rasters = db.scalars(stmt).all()

    return PaginatedRasterResponse(
        items=[RasterResponse.model_validate(r) for r in rasters],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post(
    "/",
    summary="Create Raster",
    description="Creates a new raster entry.",
    response_model=RasterResponse,
    status_code=201,
)
def create_raster(
    raster: RasterCreate,
    db: Session = Depends(get_db),
) -> RasterResponse:
    """Create a new raster."""
    db_raster = Raster(
        name=raster.name,
        crs=raster.crs,
        path=raster.path,
        description=raster.description,
    )
    db.add(db_raster)
    db.commit()
    db.refresh(db_raster)
    return RasterResponse.model_validate(db_raster)
