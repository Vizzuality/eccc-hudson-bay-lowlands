"""Pydantic schemas for the POST /analysis endpoint."""

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field


class PolygonGeometry(BaseModel):
    """GeoJSON Polygon geometry."""

    type: Literal["Polygon"]
    coordinates: list[list[list[float]]]


class MultiPolygonGeometry(BaseModel):
    """GeoJSON MultiPolygon geometry."""

    type: Literal["MultiPolygon"]
    coordinates: list[list[list[list[float]]]]


_GeometryField = Annotated[
    Union[PolygonGeometry, MultiPolygonGeometry],
    Field(discriminator="type"),
]


class GeoJSONFeature(BaseModel):
    """GeoJSON Feature with a Polygon or MultiPolygon geometry.

    Null geometries and non-polygon geometry types are rejected.
    """

    type: Literal["Feature"]
    geometry: _GeometryField
    properties: dict | None = None


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection.

    Must contain at least one Feature, all with non-null Polygon or MultiPolygon geometries.
    The service will union all features into a single geometry before validation.
    """

    type: Literal["FeatureCollection"]
    features: list[GeoJSONFeature] = Field(
        min_length=1,
        description="Must contain at least one Feature with a Polygon or MultiPolygon geometry.",
    )


AnalysisInput = Annotated[
    Union[GeoJSONFeature, GeoJSONFeatureCollection],
    Field(discriminator="type"),
]
"""Discriminated union — parsed as Feature or FeatureCollection based on the ``type`` field."""


class HistogramPoint(BaseModel):
    """A single bin in a histogram — x is the bin midpoint, y is the weighted count."""

    x: float
    y: float


class PeatCarbonStats(BaseModel):
    peat_depth_avg: float
    peat_depth_max: float
    carbon_total: float
    carbon_density: float


class PeatCarbonWidget(BaseModel):
    unit: str
    chart: dict[str, list[HistogramPoint]]  # keyed by layer id: peat_cog, carbon_cog
    stats: PeatCarbonStats


class AnalysisResponse(BaseModel):
    """Full analysis result returned after geometry validation and zonal stats computation."""

    peat_carbon: PeatCarbonWidget
