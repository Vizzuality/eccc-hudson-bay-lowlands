"""Categories endpoint router."""

from typing import Annotated

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


def _escape_like(value: str) -> str:
    """Escape SQL LIKE wildcard characters."""
    return value.replace("%", r"\%").replace("_", r"\_")


@router.get(
    "",
    summary="List Categories",
    description="Returns a paginated list of categories with optional title search.",
)
def list_categories(
    db: Annotated[Session, Depends(get_db)],
    offset: Annotated[int, Query(ge=0, description="Number of items to skip")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Number of items to return")] = 10,
    search: Annotated[str | None, Query(description="Case-insensitive partial title search (en and fr)")] = None,
) -> PaginatedCategoryResponse:
    """List categories with pagination and optional title search."""
    stmt = select(Category)
    count_stmt = select(func.count()).select_from(Category)

    if search:
        escaped = _escape_like(search)
        search_filter = or_(
            Category.metadata_["title"]["en"].as_string().ilike(f"%{escaped}%"),
            Category.metadata_["title"]["fr"].as_string().ilike(f"%{escaped}%"),
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
    summary="Get Category",
    description=(
        "Returns a single category by ID. Use include_datasets=true to include nested datasets, "
        "and include_layers=true to also include each dataset's layers."
    ),
    responses={404: {"description": "Category not found"}},
)
def get_category(
    category_id: int,
    db: Annotated[Session, Depends(get_db)],
    include_datasets: Annotated[bool, Query(description="Include nested datasets in response")] = False,
    include_layers: Annotated[
        bool, Query(description="Include layers within each dataset (requires include_datasets=true)")
    ] = False,
) -> CategorySchema | CategoryWithDatasetsSchema | CategoryWithDatasetsAndLayersSchema:
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
