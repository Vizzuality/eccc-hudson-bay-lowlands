"""Pydantic schemas for Dataset responses."""

from pydantic import BaseModel, Field

from schemas.i18n import DatasetMetadata
from schemas.layer import LayerSchema


class DatasetSchema(BaseModel):
    """Response schema for a dataset (without nested layers)."""

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "metadata": {
                        "title": {"en": "Climate Observations", "fr": "Observations climatiques"},
                        "description": {
                            "en": "Temperature and precipitation data",
                            "fr": "Données de température et de précipitations",
                        },
                        "source": {"en": "Environment Canada", "fr": "Environnement Canada"},
                        "citation": None,
                    },
                    "category_id": 1,
                }
            ]
        }
    }

    id: int = Field(description="Unique dataset identifier")
    metadata: DatasetMetadata = Field(description="Bilingual metadata (title, description, source, citation)")
    category_id: int = Field(description="ID of the parent category")

    @classmethod
    def from_orm_dataset(cls, dataset) -> "DatasetSchema":
        """Convert an ORM Dataset to a DatasetSchema."""
        return cls(
            id=dataset.id,
            metadata=dataset.metadata_,
            category_id=dataset.category_id,
        )


class DatasetWithLayersSchema(BaseModel):
    """Response schema for a dataset with nested layers."""

    id: int = Field(description="Unique dataset identifier")
    metadata: DatasetMetadata = Field(description="Bilingual metadata (title, description, source, citation)")
    category_id: int = Field(description="ID of the parent category")
    layers: list[LayerSchema] = Field(description="Layers belonging to this dataset")

    @classmethod
    def from_orm_dataset(cls, dataset) -> "DatasetWithLayersSchema":
        """Convert an ORM Dataset (with layers loaded) to schema."""
        return cls(
            id=dataset.id,
            metadata=dataset.metadata_,
            category_id=dataset.category_id,
            layers=[LayerSchema.from_orm_layer(layer) for layer in dataset.layers],
        )


class PaginatedDatasetResponse(BaseModel):
    """Paginated dataset list response."""

    data: list[DatasetSchema] = Field(description="List of datasets for the current page")
    total: int = Field(description="Total number of datasets matching the query")


class PaginatedDatasetWithLayersResponse(BaseModel):
    """Paginated dataset list response with nested layers."""

    data: list[DatasetWithLayersSchema] = Field(description="List of datasets with their layers")
    total: int = Field(description="Total number of datasets matching the query")
