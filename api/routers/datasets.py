"""Datasets endpoint router."""

from typing import Union

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from db.database import get_db
from models.dataset import Dataset
from schemas.dataset import (
    DatasetSchema,
    DatasetWithLayersSchema,
    PaginatedDatasetResponse,
    PaginatedDatasetWithLayersResponse,
)

router = APIRouter(tags=["Datasets"])


@router.get(
    "",
    summary="List Datasets",
    description=(
        "Returns a paginated list of datasets with optional title search. Use include_layers=true to include related layers."
    ),
    response_model=Union[PaginatedDatasetResponse, PaginatedDatasetWithLayersResponse],
)
def list_datasets(
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=10, ge=1, le=100, description="Number of items to return"),
    search: str | None = Query(default=None, description="Case-insensitive partial title search (en and fr)"),
    include_layers: bool = Query(default=False, description="Include related layers in response"),
    db: Session = Depends(get_db),
) -> Union[PaginatedDatasetResponse, PaginatedDatasetWithLayersResponse]:
    """List datasets with pagination and optional title search."""
    stmt = select(Dataset)
    count_stmt = select(func.count()).select_from(Dataset)

    if search:
        search_filter = or_(
            Dataset.metadata_["en"]["title"].as_string().ilike(f"%{search}%"),
            Dataset.metadata_["fr"]["title"].as_string().ilike(f"%{search}%"),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    if include_layers:
        stmt = stmt.options(selectinload(Dataset.layers))

    total = db.scalar(count_stmt)
    datasets = db.scalars(stmt.offset(offset).limit(limit)).all()

    if include_layers:
        return PaginatedDatasetWithLayersResponse(
            data=[DatasetWithLayersSchema.from_orm_dataset(d) for d in datasets],
            total=total,
        )
    return PaginatedDatasetResponse(
        data=[DatasetSchema.from_orm_dataset(d) for d in datasets],
        total=total,
    )


@router.get(
    "/{dataset_id}",
    summary="Get Dataset",
    description=("Returns a single dataset by ID. Use include_layers=true to include related layers."),
    response_model=Union[DatasetSchema, DatasetWithLayersSchema],
    responses={404: {"description": "Dataset not found"}},
)
def get_dataset(
    dataset_id: int,
    include_layers: bool = Query(default=False, description="Include related layers in response"),
    db: Session = Depends(get_db),
) -> Union[DatasetSchema, DatasetWithLayersSchema]:
    """Get a single dataset by ID."""
    stmt = select(Dataset).where(Dataset.id == dataset_id)

    if include_layers:
        stmt = stmt.options(selectinload(Dataset.layers))

    dataset = db.scalars(stmt).first()
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if include_layers:
        return DatasetWithLayersSchema.from_orm_dataset(dataset)
    return DatasetSchema.from_orm_dataset(dataset)
