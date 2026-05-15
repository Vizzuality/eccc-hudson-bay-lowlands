"""Pydantic schemas for the shared-analysis endpoints."""

from uuid import UUID

from pydantic import BaseModel

from schemas.analysis import AnalysisInput, AnalysisResponse


class SharedAnalysisCreate(BaseModel):
    """Body of ``POST /analysis/v2/share`` — the rendered analysis plus the geojson used."""

    analysis: AnalysisResponse
    geojson: AnalysisInput


class SharedAnalysisCreateResponse(BaseModel):
    """Response from ``POST /analysis/v2/share``."""

    id: UUID
    url: str


class SharedAnalysisRead(BaseModel):
    """Response from ``GET /analysis/v2/share/{id}``.

    ``geojson`` is returned as an opaque dict (the exact payload that was persisted) —
    revalidating it on read would only repeat work already done on write.
    """

    id: UUID
    analysis: AnalysisResponse
    geojson: dict
