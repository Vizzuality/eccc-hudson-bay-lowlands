"""Pydantic schemas for Dataset responses."""

from pydantic import BaseModel

from schemas.i18n import DatasetMetadata
from schemas.layer import LayerSchema


class DatasetSchema(BaseModel):
    """Response schema for a dataset (without layers)."""

    id: int
    metadata: DatasetMetadata
    category_id: int

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

    id: int
    metadata: DatasetMetadata
    category_id: int
    layers: list[LayerSchema]

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

    data: list[DatasetSchema]
    total: int


class PaginatedDatasetWithLayersResponse(BaseModel):
    """Paginated dataset list response with layers."""

    data: list[DatasetWithLayersSchema]
    total: int
