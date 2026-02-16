"""Pydantic schemas for Dataset model."""

from pydantic import BaseModel, ConfigDict

from schemas.i18n import DatasetMetadata
from schemas.layer import LayerResponse


class DatasetCreate(BaseModel):
    """Schema for creating a new dataset."""

    metadata: DatasetMetadata


class DatasetResponse(BaseModel):
    """Schema for dataset response with id and layer count."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    metadata: DatasetMetadata
    layer_count: int = 0

    @classmethod
    def from_orm_dataset(cls, dataset) -> "DatasetResponse":
        """Create a DatasetResponse from an ORM Dataset instance."""
        return cls(
            id=dataset.id,
            metadata=dataset.metadata_,
            layer_count=len(dataset.layers) if dataset.layers else 0,
        )


class DatasetWithLayersResponse(BaseModel):
    """Schema for dataset response including its layers."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    metadata: DatasetMetadata
    layers: list[LayerResponse]

    @classmethod
    def from_orm_dataset(cls, dataset) -> "DatasetWithLayersResponse":
        """Create a DatasetWithLayersResponse from an ORM Dataset instance."""
        return cls(
            id=dataset.id,
            metadata=dataset.metadata_,
            layers=[LayerResponse.from_orm_layer(layer) for layer in dataset.layers],
        )
