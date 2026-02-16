"""Pydantic schemas for Layer model."""

from pydantic import BaseModel, ConfigDict

from schemas.i18n import LayerMetadata


class LayerBase(BaseModel):
    """Base schema with common layer fields."""

    type: str
    path: str
    units: str | None = None
    legend: dict | None = None
    metadata: LayerMetadata
    dataset_id: int | None = None


class LayerCreate(LayerBase):
    """Schema for creating a new layer."""

    pass


class LayerResponse(BaseModel):
    """Schema for layer response with id.

    Uses a custom validator to map the ORM `metadata_` attribute
    to the `metadata` field in the response.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    path: str
    units: str | None = None
    legend: dict | None = None
    metadata: LayerMetadata
    dataset_id: int | None = None

    @classmethod
    def from_orm_layer(cls, layer) -> "LayerResponse":
        """Create a LayerResponse from an ORM Layer instance."""
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

    items: list[LayerResponse]
    total: int
    page: int
    size: int
    pages: int
