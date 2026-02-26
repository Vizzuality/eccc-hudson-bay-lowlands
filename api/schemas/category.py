"""Pydantic schemas for Category responses."""

from pydantic import BaseModel

from schemas.dataset import DatasetSchema, DatasetWithLayersSchema
from schemas.i18n import CategoryMetadata


class CategorySchema(BaseModel):
    """Response schema for a category (without nested datasets)."""

    id: int
    metadata: CategoryMetadata

    @classmethod
    def from_orm_category(cls, category) -> "CategorySchema":
        """Convert an ORM Category to a CategorySchema."""
        return cls(id=category.id, metadata=category.metadata_)


class CategoryWithDatasetsSchema(BaseModel):
    """Response schema for a category with nested datasets (no layers)."""

    id: int
    metadata: CategoryMetadata
    datasets: list[DatasetSchema]

    @classmethod
    def from_orm_category(cls, category) -> "CategoryWithDatasetsSchema":
        """Convert an ORM Category (with datasets loaded) to schema."""
        return cls(
            id=category.id,
            metadata=category.metadata_,
            datasets=[DatasetSchema.from_orm_dataset(d) for d in category.datasets],
        )


class CategoryWithDatasetsAndLayersSchema(BaseModel):
    """Response schema for a category with nested datasets and layers."""

    id: int
    metadata: CategoryMetadata
    datasets: list[DatasetWithLayersSchema]

    @classmethod
    def from_orm_category(cls, category) -> "CategoryWithDatasetsAndLayersSchema":
        """Convert an ORM Category (with datasets+layers loaded) to schema."""
        return cls(
            id=category.id,
            metadata=category.metadata_,
            datasets=[DatasetWithLayersSchema.from_orm_dataset(d) for d in category.datasets],
        )


class PaginatedCategoryResponse(BaseModel):
    """Paginated category list response."""

    data: list[CategorySchema]
    total: int
