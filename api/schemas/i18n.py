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
