"""Pydantic schemas for the POST /analysis endpoint."""

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

from schemas.i18n import I18nText


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


class CategoricalDataPoint(BaseModel):
    """A single slice in a categorical chart (e.g. donut, pie).

    Labels are not shipped from the API — the FE looks them up by ``key`` in its i18n bundle.
    """

    key: str
    value: float


class WidgetLayer(BaseModel):
    """Reference to a layer that contributed to a widget's stats and chart.

    The ``id`` matches both ``Layer.id`` in the DB and the keys in the widget's
    ``chart`` dict, so the FE can render layer-aware sections without an extra fetch.
    """

    id: str = Field(description="Layer id (matches Layer.id in DB and chart keys)")
    title: I18nText = Field(description="Bilingual layer title")
    path: str = Field(description="Layer storage path as stored in the DB")


class PeatCarbonStats(BaseModel):
    peat_depth_avg: float
    peat_depth_max: float
    carbon_total: float
    carbon_density: float


class PeatCarbonWidget(BaseModel):
    unit: str
    layers: list[WidgetLayer]
    chart: dict[str, list[HistogramPoint]]  # keyed by layer id: peat_cog, carbon_cog
    stats: PeatCarbonStats


class WaterDynamicsStats(BaseModel):
    water_perm_perc: float
    water_ephemeral_perc: float
    land_perm_perc: float
    freq_mean: float
    trend_wetter_perc: float
    trend_drier_perc: float
    trend_stable_perc: float


class WaterDynamicsWidget(BaseModel):
    unit: str
    layers: list[WidgetLayer]
    chart: dict[str, list[CategoricalDataPoint]]  # keyed by layer id: inundation_frequency_cog
    stats: WaterDynamicsStats


class FloodSusceptibilityStats(BaseModel):
    fsi_avg: float
    fsi_low_perc: float
    fsi_moderate_perc: float
    fsi_high_perc: float


class FloodSusceptibilityWidget(BaseModel):
    unit: str
    layers: list[WidgetLayer]
    chart: dict[str, list[CategoricalDataPoint]]  # keyed by layer id: flood_susceptibility_cog
    stats: FloodSusceptibilityStats


class AnalysisResponse(BaseModel):
    """Full analysis result returned after geometry validation and zonal stats computation."""

    peat_carbon: PeatCarbonWidget
    water_dynamics: WaterDynamicsWidget
    flood_susceptibility: FloodSusceptibilityWidget
