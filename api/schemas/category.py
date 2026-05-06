"""Pydantic schemas for Category responses."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from schemas.dataset import DatasetSchema, DatasetSeedInput, DatasetWithLayersSchema
from schemas.i18n import CategoryMetadata

_CATEGORY_ID_DESC = "Unique category identifier"
_CATEGORY_METADATA_DESC = "Bilingual metadata (title)"


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

    id: int = Field(description=_CATEGORY_ID_DESC)
    metadata: CategoryMetadata = Field(description=_CATEGORY_METADATA_DESC)

    @classmethod
    def from_orm_category(cls, category) -> "CategorySchema":
        """Convert an ORM Category to a CategorySchema."""
        return cls(id=category.id, metadata=category.metadata_)


class CategoryWithDatasetsSchema(BaseModel):
    """Response schema for a category with nested datasets (no layers)."""

    id: int = Field(description=_CATEGORY_ID_DESC)
    metadata: CategoryMetadata = Field(description=_CATEGORY_METADATA_DESC)
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

    id: int = Field(description=_CATEGORY_ID_DESC)
    metadata: CategoryMetadata = Field(description=_CATEGORY_METADATA_DESC)
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


class CategorySeedInput(BaseModel):
    """Seed payload schema for a single category. Requires an explicit integer id."""

    model_config = ConfigDict(extra="allow")

    id: int = Field(description="Explicit integer id for the category (required, deterministic across re-seeds)")
    metadata: CategoryMetadata = Field(description=_CATEGORY_METADATA_DESC)
    datasets: list[DatasetSeedInput] = Field(default_factory=list, description="Datasets belonging to this category")


class SeedPayload(BaseModel):
    """Top-level payload schema for the /seed endpoint."""

    model_config = ConfigDict(extra="allow")

    categories: list[CategorySeedInput] = Field(description="Categories with their datasets and layers")

    def to_dict(self) -> dict[str, Any]:
        """Convert to a dict that the seed service consumes (preserves unknown fields like layers)."""
        return self.model_dump(mode="python", by_alias=True)
