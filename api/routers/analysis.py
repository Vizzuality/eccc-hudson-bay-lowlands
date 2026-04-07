"""Analysis endpoint router."""

import logging

from fastapi import APIRouter

from schemas.analysis import AnalysisInput, AnalysisResponse
from services.analysis import HBL_BBOX, MAX_AREA_KM2, MIN_AREA_KM2, validate_geometry

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])


@router.post(
    "",
    summary="Validate Analysis Geometry",
    description=(
        "Accepts a GeoJSON Feature or FeatureCollection (EPSG:4326) and validates it "
        "for zonal statistics analysis. Returns 200 if the geometry passes all checks, "
        "or 422 with a descriptive error if any check fails.\n\n"
        "Validation steps:\n"
        "1. Schema — body must be Feature or FeatureCollection with Polygon/MultiPolygon geometry\n"
        "2. Structural validity — no self-intersections or degenerate rings\n"
        f"3. Minimum area — must be ≥ {MIN_AREA_KM2:g} km²\n"
        f"4. Maximum area — must be ≤ {MAX_AREA_KM2:,.0f} km²\n"
        f"5. Geographic scope — must intersect the Hudson Bay Lowlands study area "
        f"(lon=[{HBL_BBOX[0]}, {HBL_BBOX[2]}], lat=[{HBL_BBOX[1]}, {HBL_BBOX[3]}], EPSG:4326)"
    ),
    responses={
        200: {"description": "Geometry is valid and ready for analysis"},
        422: {"description": "Geometry failed one or more validation checks"},
    },
)
def analyze(body: AnalysisInput) -> AnalysisResponse:
    """Validate a GeoJSON geometry for zonal statistics analysis."""
    logger.info("POST /analysis received")
    validate_geometry(body)
    return AnalysisResponse()
