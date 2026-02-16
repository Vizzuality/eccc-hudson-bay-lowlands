"""Shared i18n Pydantic schemas for multilingual metadata."""

from pydantic import BaseModel


class LayerLocale(BaseModel):
    """Localized layer metadata for a single language."""

    title: str
    description: str


class DatasetLocale(BaseModel):
    """Localized dataset metadata for a single language."""

    title: str
    description: str
    citations: str | None = None
    source: str | None = None


class LayerMetadata(BaseModel):
    """i18n metadata container for layers (en/fr)."""

    en: LayerLocale
    fr: LayerLocale


class DatasetMetadata(BaseModel):
    """i18n metadata container for datasets (en/fr)."""

    en: DatasetLocale
    fr: DatasetLocale
