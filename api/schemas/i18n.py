"""Shared i18n Pydantic types."""

from pydantic import BaseModel


class LayerLocale(BaseModel):
    """Single-language metadata for a layer."""

    title: str
    description: str | None = None


class LayerMetadata(BaseModel):
    """Bilingual metadata container for a layer."""

    en: LayerLocale
    fr: LayerLocale


class DatasetLocale(BaseModel):
    """Single-language metadata for a dataset."""

    title: str
    description: str | None = None
    citations: str | None = None
    source: str | None = None


class DatasetMetadata(BaseModel):
    """Bilingual metadata container for a dataset."""

    en: DatasetLocale
    fr: DatasetLocale
