"""Pydantic schemas for Layer responses."""

from pydantic import BaseModel, Field

from schemas.i18n import LayerCategory, LayerConfig, LayerMetadata


class LayerSchema(BaseModel):
    """Response schema for a single geospatial layer."""

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "format": "raster",
                    "type": "continuous",
                    "path": "temperature/mean_annual_2024_cog.tif",
                    "unit": "celsius",
                    "categories": None,
                    "config": {
                        "colormap": [[0, "#0E2780"], [30, "#01CB2A"]],
                        "styles": [{"type": "raster", "paint": {"raster-opacity": "@@#params.opacity"}}],
                        "params_config": [
                            {"key": "opacity", "default": 1},
                            {"key": "visibility", "default": True},
                        ],
                        "legend_config": {
                            "type": "gradient",
                            "items": [
                                {"value": 0, "color": "#0E2780", "label": {"en": "0°C", "fr": "0°C"}},
                                {"value": 30, "color": "#01CB2A", "label": {"en": "30°C", "fr": "30°C"}},
                            ],
                        },
                    },
                    "metadata": {
                        "title": {"en": "Mean Annual Temperature", "fr": "Température annuelle moyenne"},
                        "description": {
                            "en": "Average daily temperature for 2024",
                            "fr": "Température quotidienne moyenne pour 2024",
                        },
                    },
                    "dataset_id": 1,
                }
            ]
        }
    }

    id: int = Field(description="Unique layer identifier")
    format: str = Field(description="Data format (e.g., 'cog', 'geojson', 'pmtiles')")
    type: str | None = Field(default=None, description="Layer type (e.g., 'raster', 'vector')")
    path: str = Field(description="Path or URL to the geospatial data file")
    unit: str | None = Field(default=None, description="Data measurement unit (e.g., 'celsius', 'percent')")
    categories: list[LayerCategory] | None = Field(
        default=None, description="Category definitions for categorical/classified layers"
    )
    config: LayerConfig | None = Field(
        default=None,
        description="Visualization configuration (source, styles, params, legend). Varies by format.",
    )
    metadata: LayerMetadata = Field(description="Bilingual metadata (title, description)")
    dataset_id: int = Field(description="ID of the parent dataset")

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
            config=layer.config,
            metadata=layer.metadata_,
            dataset_id=layer.dataset_id,
        )


class PaginatedLayerResponse(BaseModel):
    """Paginated layer list response."""

    data: list[LayerSchema] = Field(description="List of layers for the current page")
    total: int = Field(description="Total number of layers matching the query")
