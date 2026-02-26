"""Pydantic schemas for Category responses."""

from pydantic import BaseModel, Field

from schemas.dataset import DatasetSchema, DatasetWithLayersSchema
from schemas.i18n import CategoryMetadata


class CategorySchema(BaseModel):
    """Response schema for a category (without nested datasets)."""

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "metadata": {"title": {"en": "Climate", "fr": "Climat"}},
                }
            ]
        }
    }

    id: int = Field(description="Unique category identifier")
    metadata: CategoryMetadata = Field(description="Bilingual metadata (title)")

    @classmethod
    def from_orm_category(cls, category) -> "CategorySchema":
        """Convert an ORM Category to a CategorySchema."""
        return cls(id=category.id, metadata=category.metadata_)


class CategoryWithDatasetsSchema(BaseModel):
    """Response schema for a category with nested datasets (no layers)."""

    id: int = Field(description="Unique category identifier")
    metadata: CategoryMetadata = Field(description="Bilingual metadata (title)")
    datasets: list[DatasetSchema] = Field(description="Datasets belonging to this category")

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

    id: int = Field(description="Unique category identifier")
    metadata: CategoryMetadata = Field(description="Bilingual metadata (title)")
    datasets: list[DatasetWithLayersSchema] = Field(description="Datasets with their layers")

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

    data: list[CategorySchema] = Field(description="List of categories for the current page")
    total: int = Field(description="Total number of categories matching the query")
