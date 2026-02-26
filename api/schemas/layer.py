"""Pydantic schemas for Layer responses."""

from pydantic import BaseModel

from schemas.i18n import LayerCategory, LayerMetadata


class LayerSchema(BaseModel):
    """Response schema for a layer."""

    id: int
    format: str
    type: str | None = None
    path: str
    unit: str | None = None
    categories: list[LayerCategory] | None = None
    metadata: LayerMetadata
    dataset_id: int | None = None

    @classmethod
    def from_orm_layer(cls, layer) -> "LayerSchema":
        """Convert an ORM Layer to a LayerSchema."""
        return cls(
            id=layer.id,
            format=layer.format_,
            type=layer.type_,
            path=layer.path,
            unit=layer.unit,
            categories=layer.categories,
            metadata=layer.metadata_,
            dataset_id=layer.dataset_id,
        )


class PaginatedLayerResponse(BaseModel):
    """Paginated layer list response."""

    data: list[LayerSchema]
    total: int
