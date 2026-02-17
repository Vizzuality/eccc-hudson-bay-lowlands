"""Pydantic schemas for Layer model."""

from pydantic import BaseModel

from schemas.i18n import LayerMetadata


class LayerSchema(BaseModel):
    """Response schema for a layer."""

    id: int
    type: str
    path: str
    units: str | None = None
    legend: dict | None = None
    metadata: LayerMetadata
    dataset_id: int | None = None

    @classmethod
    def from_orm_layer(cls, layer) -> "LayerSchema":
        """Convert an ORM Layer to a LayerSchema."""
        return cls(
            id=layer.id,
            type=layer.type,
            path=layer.path,
            units=layer.units,
            legend=layer.legend,
            metadata=layer.metadata_,
            dataset_id=layer.dataset_id,
        )


class PaginatedLayerResponse(BaseModel):
    """Schema for paginated layer list response."""

    data: list[LayerSchema]
    total: int
