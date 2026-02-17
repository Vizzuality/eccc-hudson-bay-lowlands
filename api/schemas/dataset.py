"""Pydantic schemas for Dataset model."""

from pydantic import BaseModel

from schemas.i18n import DatasetMetadata
from schemas.layer import LayerSchema


class DatasetSchema(BaseModel):
    """Response schema for a dataset (without layers)."""

    id: int
    metadata: DatasetMetadata

    @classmethod
    def from_orm_dataset(cls, dataset) -> "DatasetSchema":
        """Convert an ORM Dataset to a DatasetSchema."""
        return cls(
            id=dataset.id,
            metadata=dataset.metadata_,
        )


class DatasetWithLayersSchema(BaseModel):
    """Response schema for a dataset with its layers."""

    id: int
    metadata: DatasetMetadata
    layers: list[LayerSchema]

    @classmethod
    def from_orm_dataset(cls, dataset) -> "DatasetWithLayersSchema":
        """Convert an ORM Dataset (with layers loaded) to schema."""
        return cls(
            id=dataset.id,
            metadata=dataset.metadata_,
            layers=[LayerSchema.from_orm_layer(layer) for layer in dataset.layers],
        )


class PaginatedDatasetResponse(BaseModel):
    """Schema for paginated dataset list response (without layers)."""

    data: list[DatasetSchema]
    total: int


class PaginatedDatasetWithLayersResponse(BaseModel):
    """Schema for paginated dataset list response (with layers)."""

    data: list[DatasetWithLayersSchema]
    total: int
