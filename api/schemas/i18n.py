"""Shared i18n Pydantic types for field-first internationalization."""

from pydantic import BaseModel, Field


class I18nText(BaseModel):
    """Bilingual text field with required English and optional French translations."""

    model_config = {"json_schema_extra": {"examples": [{"en": "English text", "fr": "French text"}]}}

    en: str = Field(description="English text (required)")
    fr: str | None = Field(default=None, description="French text (optional)")


class CategoryMetadata(BaseModel):
    """Field-first metadata for a category."""

    title: I18nText = Field(description="Bilingual title for the category")


class DatasetMetadata(BaseModel):
    """Field-first metadata for a dataset."""

    title: I18nText = Field(description="Bilingual title for the dataset")
    description: I18nText | None = Field(default=None, description="Bilingual description of the dataset")
    source: I18nText | None = Field(default=None, description="Bilingual data source attribution")
    citation: I18nText | None = Field(default=None, description="Bilingual citation for the dataset")


class LayerMetadata(BaseModel):
    """Field-first metadata for a layer."""

    title: I18nText = Field(description="Bilingual title for the layer")
    description: I18nText | None = Field(default=None, description="Bilingual description of the layer")


class LayerCategory(BaseModel):
    """A single category entry for categorical layers (e.g., land cover classes)."""

    value: int = Field(description="Numeric class value in the raster data")
    label: I18nText = Field(description="Bilingual human-readable label for this category")


class LegendItem(BaseModel):
    """A single legend entry. Extra fields (e.g., line-width, fill-color) are allowed for vector legends."""

    model_config = {"extra": "allow"}

    color: str | None = Field(default=None, description="Color value (hex or rgba)")
    label: I18nText = Field(description="Bilingual label for this legend entry")
    value: float | int | None = Field(default=None, description="Numeric value (used for gradient legends)")


class LegendConfig(BaseModel):
    """Legend rendering configuration."""

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "type": "gradient",
                    "items": [
                        {"value": 0, "color": "#f7fbff", "label": {"en": "0%", "fr": "0%"}},
                        {"value": 100, "color": "#08306b", "label": {"en": "100%", "fr": "100%"}},
                    ],
                }
            ]
        }
    }

    type: str = Field(description="Legend type: 'basic' for categorical data, 'gradient' for continuous data")
    items: list[LegendItem] = Field(description="Legend entries")


class ParamsConfigEntry(BaseModel):
    """A configurable UI parameter for a layer."""

    key: str = Field(description="Parameter key (e.g., 'opacity', 'visibility')")
    default: bool | int | float = Field(description="Default value for the parameter")


class InteractionConfig(BaseModel):
    """Click/hover interaction configuration for vector layers."""

    keys: list[str] = Field(description="Feature property keys to surface on interaction (e.g. ['NAME_EN', 'NAME_FR'])")
    type: str = Field(description="Interaction type (e.g. 'feature-value')")
    event: str = Field(description="Event that triggers the interaction (e.g. 'click')")


class LayerConfig(BaseModel):
    """Visualization configuration for a map layer.

    The layer's `format` and `path` fields provide the data source; this config only
    holds rendering instructions. Structure varies by format:

    - **Raster layers** (format='raster'): includes `colormap` (array for continuous,
      dict for categorical) plus raster `styles`.
    - **Vector layers** (format='vector'): includes `styles` with Mapbox GL paint
      properties and `source-layer` references. No `colormap`.
    """

    model_config = {
        "extra": "allow",
        "json_schema_extra": {
            "examples": [
                {
                    "colormap": [[0, "#0E2780"], [100, "#01CB2A"]],
                    "styles": [{"type": "raster", "paint": {"raster-opacity": "@@#params.opacity"}}],
                    "params_config": [{"key": "opacity", "default": 1}, {"key": "visibility", "default": True}],
                    "legend_config": {
                        "type": "gradient",
                        "items": [
                            {"value": 0, "color": "#0E2780", "label": {"en": "0 cm", "fr": "0 cm"}},
                            {"value": 100, "color": "#01CB2A", "label": {"en": "100 cm", "fr": "100 cm"}},
                        ],
                    },
                },
                {
                    "styles": [
                        {
                            "type": "line",
                            "paint": {"line-color": "#6e6e6e", "line-width": 1},
                            "source-layer": "ecozones",
                        }
                    ],
                    "params_config": [{"key": "opacity", "default": 1}, {"key": "visibility", "default": True}],
                    "legend_config": {
                        "type": "basic",
                        "items": [{"color": "#6e6e6e", "line-width": 1, "label": {"en": "Ecozones", "fr": "Écozones"}}],
                    },
                },
            ]
        },
    }

    colormap: list | dict | None = Field(
        default=None,
        description="Color mapping for raster layers. Array of [value, color] pairs for continuous data, "
        "or dict of {value: color} for categorical data. Not used for vector layers.",
    )
    styles: list[dict] = Field(description="Mapbox GL style layers (paint, layout, source-layer)")
    params_config: list[ParamsConfigEntry] = Field(description="Configurable UI parameters (opacity, visibility)")
    legend_config: LegendConfig = Field(description="Legend display configuration")
    interaction_config: InteractionConfig | None = Field(
        default=None,
        description="Click/hover interaction config for vector layers (which feature properties to surface).",
    )
