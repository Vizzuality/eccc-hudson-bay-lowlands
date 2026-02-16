"""Layers CRUD endpoint router."""

import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from db.database import get_db
from models.layer import Layer
from schemas.layer import LayerCreate, LayerResponse, PaginatedLayerResponse

router = APIRouter(tags=["Layers"])


@router.get(
    "",
    summary="List Layers",
    description="Returns a paginated list of layers.",
    response_model=PaginatedLayerResponse,
)
def list_layers(
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedLayerResponse:
    """List layers with pagination."""
    total = db.scalar(select(func.count()).select_from(Layer))

    pages = math.ceil(total / size) if total > 0 else 0
    offset = (page - 1) * size

    stmt = select(Layer).offset(offset).limit(size)
    layers = db.scalars(stmt).all()

    return PaginatedLayerResponse(
        items=[LayerResponse.from_orm_layer(layer) for layer in layers],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post(
    "",
    summary="Create Layer",
    description="Creates a new layer entry.",
    response_model=LayerResponse,
    status_code=201,
)
def create_layer(
    layer: LayerCreate,
    db: Session = Depends(get_db),
) -> LayerResponse:
    """Create a new layer."""
    db_layer = Layer(
        type=layer.type,
        path=layer.path,
        units=layer.units,
        legend=layer.legend,
        metadata_=layer.metadata.model_dump(),
        dataset_id=layer.dataset_id,
    )
    db.add(db_layer)
    db.commit()
    db.refresh(db_layer)
    return LayerResponse.from_orm_layer(db_layer)
