"""Categories endpoint router."""

from typing import Union

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from db.database import get_db
from models.category import Category
from models.dataset import Dataset
from schemas.category import (
    CategorySchema,
    CategoryWithDatasetsAndLayersSchema,
    CategoryWithDatasetsSchema,
    PaginatedCategoryResponse,
)

router = APIRouter(tags=["Categories"])


@router.get("", response_model=PaginatedCategoryResponse)
def list_categories(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> PaginatedCategoryResponse:
    """List categories with pagination and optional title search."""
    stmt = select(Category)
    count_stmt = select(func.count()).select_from(Category)

    if search:
        search_filter = or_(
            Category.metadata_["title"]["en"].as_string().ilike(f"%{search}%"),
            Category.metadata_["title"]["fr"].as_string().ilike(f"%{search}%"),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    total = db.scalar(count_stmt)
    categories = db.scalars(stmt.offset(offset).limit(limit)).all()

    return PaginatedCategoryResponse(
        data=[CategorySchema.from_orm_category(c) for c in categories],
        total=total,
    )


@router.get(
    "/{category_id}",
    response_model=Union[CategorySchema, CategoryWithDatasetsSchema, CategoryWithDatasetsAndLayersSchema],
    responses={404: {"description": "Category not found"}},
)
def get_category(
    category_id: int,
    include_datasets: bool = Query(default=False),
    include_layers: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> Union[CategorySchema, CategoryWithDatasetsSchema, CategoryWithDatasetsAndLayersSchema]:
    """Get a single category by ID with optional nested datasets and layers."""
    stmt = select(Category).where(Category.id == category_id)

    if include_datasets:
        if include_layers:
            stmt = stmt.options(selectinload(Category.datasets).selectinload(Dataset.layers))
        else:
            stmt = stmt.options(selectinload(Category.datasets))

    category = db.scalars(stmt).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    if include_datasets and include_layers:
        return CategoryWithDatasetsAndLayersSchema.from_orm_category(category)
    if include_datasets:
        return CategoryWithDatasetsSchema.from_orm_category(category)
    return CategorySchema.from_orm_category(category)
