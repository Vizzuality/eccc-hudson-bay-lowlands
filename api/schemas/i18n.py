"""Shared i18n Pydantic types for field-first internationalization."""

from pydantic import BaseModel


class I18nText(BaseModel):
    """Bilingual text field."""

    en: str
    fr: str | None = None


class CategoryMetadata(BaseModel):
    """Field-first metadata for a category."""

    title: I18nText


class DatasetMetadata(BaseModel):
    """Field-first metadata for a dataset."""

    title: I18nText
    description: I18nText | None = None
    source: I18nText | None = None
    citation: I18nText | None = None


class LayerMetadata(BaseModel):
    """Field-first metadata for a layer."""

    title: I18nText
    description: I18nText | None = None


class LayerCategory(BaseModel):
    """A single category entry for categorical layers."""

    value: int
    label: I18nText
