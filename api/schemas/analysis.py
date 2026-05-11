"""Pydantic schemas for the POST /analysis endpoint."""

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

from schemas.dataset import DatasetWithLayersSchema


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


class TimeSeriesDataPoint(BaseModel):
    """A single point in a time-series chart — x is a numeric tick (e.g. year), y is the value."""

    x: float
    y: float


class CategoricalDataPoint(BaseModel):
    """A single slice in a categorical chart (e.g. donut, pie).

    Labels are not shipped from the API — the FE looks them up by ``key`` in its i18n bundle.
    """

    key: str
    value: float


class PeatCarbonStats(BaseModel):
    peat_depth_avg: float
    peat_depth_max: float
    carbon_total: float
    carbon_density: float


class PeatCarbonWidget(BaseModel):
    unit: str
    dataset: DatasetWithLayersSchema
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
    dataset: DatasetWithLayersSchema
    chart: dict[str, list[CategoricalDataPoint]]  # keyed by layer id: inundation_frequency_cog
    stats: WaterDynamicsStats


class FloodSusceptibilityStats(BaseModel):
    fsi_avg: float
    fsi_low_perc: float
    fsi_moderate_perc: float
    fsi_high_perc: float


class FloodSusceptibilityWidget(BaseModel):
    unit: str
    dataset: DatasetWithLayersSchema
    chart: dict[str, list[CategoricalDataPoint]]  # keyed by layer id: flood_susceptibility_cog
    stats: FloodSusceptibilityStats


class SnowDynamicsStats(BaseModel):
    """Per-winter snow dynamics — mean snow length (days) and ISO end-of-snow date.

    Six winters are returned. ``lengthT_mean_*`` is mean number of days with snow cover.
    ``endL_mean_date_*`` is an ISO ``YYYY-MM-DD`` date derived from the mean pixel value
    (days from Dec 31 of the prior calendar year).
    """

    lengthT_mean_1819: float
    lengthT_mean_1920: float
    lengthT_mean_2021: float
    lengthT_mean_2122: float
    lengthT_mean_2223: float
    lengthT_mean_2324: float
    endL_mean_date_1819: str
    endL_mean_date_1920: str
    endL_mean_date_2021: str
    endL_mean_date_2122: str
    endL_mean_date_2223: str
    endL_mean_date_2324: str


class SnowDynamicsWidget(BaseModel):
    unit: str
    dataset: DatasetWithLayersSchema
    # Single time-series under the synthetic key ``"lengthT_mean"`` (NOT a Layer.id).
    # See ``services/widgets.py::WIDGET_CONFIG['snow_dynamics']`` for the rationale.
    chart: dict[str, list[TimeSeriesDataPoint]]
    stats: SnowDynamicsStats


class TreedAreaStats(BaseModel):
    """Treed-area dynamics over 1984–2022.

    The four ``*_area`` fields are km² values derived from coverage fractions × polygon
    area; the four ``*_perc`` fields are percentages of polygon coverage per class.
    ``total_treed_area`` and ``changed_treed_area`` are derived compositions.
    """

    non_treed_area: float
    always_treed_area: float
    newly_treed_area: float
    was_treed_area: float
    total_treed_area: float
    changed_treed_area: float
    non_treed_perc: float
    always_treed_perc: float
    newly_treed_perc: float
    was_treed_perc: float


class TreedAreaWidget(BaseModel):
    unit: str
    dataset: DatasetWithLayersSchema
    chart: dict[str, list[CategoricalDataPoint]]  # keyed by layer id: treed_area_1984-2022_cog
    stats: TreedAreaStats


class EcosystemClassificationStats(BaseModel):
    """Ecosystem classification mix.

    Twelve ``eco_<class>_perc`` fields hold per-class coverage percentages.
    ``ecosystem_count`` is the number of distinct classes present in the polygon
    (``variety`` op). ``dominant_ecosystem`` is the class id of the most-covered
    class (``majority`` op), and ``dominant_ecosystem_perc`` is that class's
    coverage percentage (derived from ``frac_of_stat``).
    """

    eco_temperate_perc: float
    eco_treed_perc: float
    eco_grassland_perc: float
    eco_fire_perc: float
    eco_graminoid_perc: float
    eco_shrub_perc: float
    eco_emergent_perc: float
    eco_bog_perc: float
    eco_mudflats_perc: float
    eco_coastal_perc: float
    eco_marine_perc: float
    eco_water_perc: float
    ecosystem_count: float
    dominant_ecosystem: float
    dominant_ecosystem_perc: float


class EcosystemClassificationWidget(BaseModel):
    unit: str
    dataset: DatasetWithLayersSchema
    chart: dict[str, list[CategoricalDataPoint]]  # keyed by layer id: ecosystem_classification_cog
    stats: EcosystemClassificationStats


class AnalysisResponse(BaseModel):
    """Full analysis result returned after geometry validation and zonal stats computation."""

    peat_carbon: PeatCarbonWidget
    water_dynamics: WaterDynamicsWidget
    flood_susceptibility: FloodSusceptibilityWidget
    snow_dynamics: SnowDynamicsWidget
    treed_area: TreedAreaWidget
    ecosystem_classification: EcosystemClassificationWidget
