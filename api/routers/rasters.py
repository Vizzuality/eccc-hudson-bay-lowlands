"""Rasters CRUD endpoint router."""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.raster import Raster
from schemas.raster import PaginatedRasterResponse, RasterCreate, RasterResponse

router = APIRouter(tags=["Rasters"])


@router.get(
    "",
    summary="List Rasters",
    description="Returns a paginated list of rasters.",
    response_model=PaginatedRasterResponse,
)
def list_rasters(
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    location_id: int | None = Query(default=None, description="Filter by location ID"),
    db: Session = Depends(get_db),
) -> PaginatedRasterResponse:
    """List rasters with pagination and optional location filter."""
    # Build base query with optional location filter
    count_stmt = select(func.count()).select_from(Raster)
    items_stmt = select(Raster)

    if location_id is not None:
        count_stmt = count_stmt.where(Raster.location_id == location_id)
        items_stmt = items_stmt.where(Raster.location_id == location_id)

    total = db.scalar(count_stmt)

    # Calculate pagination
    pages = math.ceil(total / size) if total > 0 else 0
    offset = (page - 1) * size

    # Get paginated items
    items_stmt = items_stmt.offset(offset).limit(size)
    rasters = db.scalars(items_stmt).all()

    return PaginatedRasterResponse(
        items=[RasterResponse.model_validate(r) for r in rasters],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post(
    "",
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
        location_id=raster.location_id,
    )
    db.add(db_raster)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail=f"Location with id {raster.location_id} does not exist",
        )
    db.refresh(db_raster)
    return RasterResponse.model_validate(db_raster)
