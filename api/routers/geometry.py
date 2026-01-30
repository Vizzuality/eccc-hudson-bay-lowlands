"""Geometry validation endpoint router."""

from typing import Union

from fastapi import APIRouter
from geojson_pydantic import MultiPolygon, Polygon

from schemas.geometry import GeometryValidationResponse
from services.geometry import validate_geometry

router = APIRouter(tags=["Geometry"])


@router.post(
    "",
    summary="Validate Geometry",
    description=(
        "Validates a GeoJSON geometry (Polygon or MultiPolygon) for CRS compliance "
        "and area constraints. The geometry must use EPSG:4326 (WGS84) coordinates "
        "and its area must not exceed 1000 square kilometers."
    ),
    response_model=GeometryValidationResponse,
    responses={
        200: {"description": "Geometry is valid and within area constraints"},
        422: {"description": "Invalid GeoJSON structure or unsupported geometry type"},
    },
)
def validate_geometry_endpoint(
    geometry: Union[Polygon, MultiPolygon],
) -> GeometryValidationResponse:
    """Validate a GeoJSON geometry for projection and area constraints."""
    geojson = geometry.model_dump(mode="python")
    result = validate_geometry(geojson)
    return GeometryValidationResponse(**result)
