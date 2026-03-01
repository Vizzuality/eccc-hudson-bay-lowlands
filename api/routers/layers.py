"""Layers endpoint router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from db.database import get_db
from models.layer import Layer
from schemas.layer import LayerSchema, PaginatedLayerResponse

router = APIRouter(tags=["Layers"])


def _escape_like(value: str) -> str:
    """Escape SQL LIKE wildcard characters."""
    return value.replace("%", r"\%").replace("_", r"\_")


@router.get(
    "",
    summary="List Layers",
    description="Returns a paginated list of layers with optional title search.",
    response_model=PaginatedLayerResponse,
)
def list_layers(
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=10, ge=1, le=100, description="Number of items to return"),
    search: str | None = Query(default=None, description="Case-insensitive partial title search (en and fr)"),
    db: Session = Depends(get_db),
) -> PaginatedLayerResponse:
    """List layers with pagination and optional title search."""
    stmt = select(Layer)
    count_stmt = select(func.count()).select_from(Layer)

    if search:
        escaped = _escape_like(search)
        search_filter = or_(
            Layer.metadata_["title"]["en"].as_string().ilike(f"%{escaped}%"),
            Layer.metadata_["title"]["fr"].as_string().ilike(f"%{escaped}%"),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    total = db.scalar(count_stmt)
    layers = db.scalars(stmt.offset(offset).limit(limit)).all()

    return PaginatedLayerResponse(
        data=[LayerSchema.from_orm_layer(layer) for layer in layers],
        total=total,
    )


@router.get(
    "/{layer_id}",
    summary="Get Layer",
    description="Returns a single layer by ID.",
    response_model=LayerSchema,
    responses={404: {"description": "Layer not found"}},
)
def get_layer(
    layer_id: int,
    db: Session = Depends(get_db),
) -> LayerSchema:
    """Get a single layer by ID."""
    layer = db.get(Layer, layer_id)
    if layer is None:
        raise HTTPException(status_code=404, detail="Layer not found")
    return LayerSchema.from_orm_layer(layer)
