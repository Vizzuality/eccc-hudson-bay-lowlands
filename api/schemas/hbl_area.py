"""Pydantic schemas for the GET /hbl-area endpoint.

The endpoint returns the Hudson Bay Lowlands study-area boundary as a GeoJSON
Feature in EPSG:4326. The same file backs the analysis-input containment check
(see ``services/analysis.py``) — exposing it via this endpoint guarantees the
client renders the exact polygon the server validates against.

Coordinates are always ``[lon, lat]`` in degrees (RFC 7946 §3.1.1, §4). No
``crs`` member is included on the response — clients should treat the geometry
as WGS84 per the spec.
"""

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field


class HBLAreaPolygonGeometry(BaseModel):
    """GeoJSON Polygon geometry, EPSG:4326 lon/lat degrees."""

    type: Literal["Polygon"]
    coordinates: list[list[list[float]]] = Field(
        description=(
            "GeoJSON Polygon coordinates: a list of linear rings, each a list of "
            "[lon, lat] positions in degrees. The first ring is the exterior; "
            "any subsequent rings are interior holes. RFC 7946 §3.1.6."
        ),
    )


class HBLAreaMultiPolygonGeometry(BaseModel):
    """GeoJSON MultiPolygon geometry, EPSG:4326 lon/lat degrees."""

    type: Literal["MultiPolygon"]
    coordinates: list[list[list[list[float]]]] = Field(
        description=(
            "GeoJSON MultiPolygon coordinates: a list of Polygon coordinate arrays. "
            "Used when the HBL outline contains disjoint regions. RFC 7946 §3.1.7."
        ),
    )


_HBLAreaGeometryField = Annotated[
    Union[HBLAreaPolygonGeometry, HBLAreaMultiPolygonGeometry],
    Field(discriminator="type"),
]


class HBLAreaResponse(BaseModel):
    """GeoJSON Feature describing the Hudson Bay Lowlands study-area boundary.

    Always returned in EPSG:4326. The geometry is either a Polygon (single
    region) or a MultiPolygon (disjoint regions); clients can render either
    directly as a Mapbox GeoJSON source.

    ``properties`` is intentionally typed as a free-form dict because the
    upstream authoring tool (QGIS, hand-edited file, …) may attach metadata
    like ``area_km2`` or ``vertices``. Clients should treat unknown property
    keys as informational.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "Feature",
                "properties": {"area_km2": 350000.0},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-87.0, 54.0],
                        [-86.0, 54.0],
                        [-86.0, 55.0],
                        [-87.0, 55.0],
                        [-87.0, 54.0],
                    ]],
                },
            }
        }
    )

    type: Literal["Feature"]
    geometry: _HBLAreaGeometryField
    properties: dict | None = Field(
        default=None,
        description="Optional GeoJSON Feature properties. May include authoring metadata.",
    )
