"""Analysis endpoint router.

Exposes two parallel endpoints sharing the same zonal-stats pipeline. They
differ only in step 5 of geometry validation:

* ``POST /analysis``  (v1, legacy) — geometry must *intersect* the HBL bounding
  box. Partial overlap is allowed. Kept for backward compatibility while
  clients migrate to v2.
* ``POST /analysis/v2`` — geometry must lie *entirely within* the HBL
  study-area polygon (see ``GET /hbl-area`` for the polygon clients should
  render as a highlight).
"""

import logging
from typing import Annotated
from uuid import UUID

import rasterio.errors
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from config import get_settings
from db.database import get_db
from models.dataset import Dataset
from schemas.analysis import AnalysisInput, AnalysisResponse
from schemas.shared_analysis import (
    SharedAnalysisCreate,
    SharedAnalysisCreateResponse,
    SharedAnalysisRead,
)
from services.analysis import (
    MAX_AREA_KM2,
    MIN_AREA_KM2,
    validate_geometry_v1,
    validate_geometry_v2,
)
from services.shared_analysis import SHARED_ANALYSIS_TTL_DAYS, create_shared, get_shared
from services.zonal_stats import compute_zonal_stats

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])


def _run_analysis(
    geom,
    polygon_area_km2: float,
    db: Session,
) -> AnalysisResponse:
    """Shared post-validation pipeline: fetch datasets and compute zonal stats.

    Lives outside the per-endpoint handlers because both v1 and v2 do the same
    work after their respective validators succeed. Keeping it as a helper (not
    a FastAPI dependency) keeps the call sites linear and the request lifecycle
    obvious: validate → run analysis → return.
    """
    settings = get_settings()
    if not settings.s3_bucket_name:
        logger.error("S3_BUCKET_NAME is not configured")
        raise HTTPException(status_code=500, detail="Analysis is unavailable")

    datasets = db.execute(
        select(Dataset).options(selectinload(Dataset.layers))
    ).scalars().all()
    logger.info("Retrieved %d datasets", len(datasets))

    try:
        result = compute_zonal_stats(geom, datasets, settings.s3_bucket_name, polygon_area_km2)
    except rasterio.errors.RasterioIOError:
        logger.exception("Failed to read raster data")
        raise HTTPException(status_code=500, detail="Analysis is unavailable")
    return AnalysisResponse(
        peat_carbon=result["peat_carbon"],
        water_dynamics=result["water_dynamics"],
        flood_susceptibility=result["flood_susceptibility"],
        snow_dynamics=result["snow_dynamics"],
        treed_area=result["treed_area"],
        ecosystem_classification=result["ecosystem_classification"],
    )


@router.post(
    "",
    summary="Run analysis (v1, legacy — geometry intersects HBL bbox)",
    description=(
        "Legacy analysis endpoint. Accepts a GeoJSON Feature or FeatureCollection "
        "(EPSG:4326) and runs zonal statistics if the geometry intersects the HBL "
        "bounding box. Partial overlap is allowed.\n\n"
        "New clients should prefer `POST /analysis/v2`, which validates against the "
        "actual HBL study-area polygon (`GET /hbl-area`) and requires the geometry "
        "to lie entirely within it.\n\n"
        "Validation steps:\n"
        "1. Schema — body must be Feature or FeatureCollection with Polygon/MultiPolygon geometry\n"
        "2. Structural validity — no self-intersections or degenerate rings\n"
        f"3. Minimum area — must be ≥ {MIN_AREA_KM2:g} km²\n"
        f"4. Maximum area — must be ≤ {MAX_AREA_KM2:,.0f} km²\n"
        "5. Geographic scope — must intersect the HBL bounding box (EPSG:4326)"
    ),
    responses={
        200: {"description": "Geometry is valid and analysis succeeded"},
        422: {"description": "Geometry failed one or more validation checks"},
        500: {"description": "Analysis failed due to an internal error"},
    },
)
def analyze_v1(body: AnalysisInput, db: Annotated[Session, Depends(get_db)]) -> AnalysisResponse:
    """Validate against the HBL bbox (intersects) and compute zonal statistics."""
    logger.info("POST /analysis received (v1)")
    geom, polygon_area_km2 = validate_geometry_v1(body)
    return _run_analysis(geom, polygon_area_km2, db)


@router.post(
    "/v2",
    summary="Run analysis (v2 — geometry must lie entirely within HBL study area)",
    description=(
        "Accepts a GeoJSON Feature or FeatureCollection (EPSG:4326) and runs "
        "zonal statistics if the geometry lies entirely within the HBL study-area "
        "polygon served by `GET /hbl-area`. Boundary-touching geometries are "
        "accepted (`covers` predicate); partial overlap is rejected.\n\n"
        "Validation steps:\n"
        "1. Schema — body must be Feature or FeatureCollection with Polygon/MultiPolygon geometry\n"
        "2. Structural validity — no self-intersections or degenerate rings\n"
        f"3. Minimum area — must be ≥ {MIN_AREA_KM2:g} km²\n"
        f"4. Maximum area — must be ≤ {MAX_AREA_KM2:,.0f} km²\n"
        "5. Geographic scope — must lie entirely within the HBL study area "
        "(see `GET /hbl-area`)"
    ),
    responses={
        200: {"description": "Geometry is valid and analysis succeeded"},
        422: {"description": "Geometry failed one or more validation checks"},
        500: {"description": "Analysis failed due to an internal error"},
    },
)
def analyze_v2(body: AnalysisInput, db: Annotated[Session, Depends(get_db)]) -> AnalysisResponse:
    """Validate against the HBL polygon (covers) and compute zonal statistics."""
    logger.info("POST /analysis/v2 received")
    geom, polygon_area_km2 = validate_geometry_v2(body)
    return _run_analysis(geom, polygon_area_km2, db)


@router.post(
    "/v2/share",
    status_code=201,
    summary="Persist an analysis snapshot for public sharing (v2)",
    description=(
        "Persists a successful v2 analysis snapshot so it can be re-displayed via a "
        "public link. The body must include the rendered ``AnalysisResponse`` and the "
        "GeoJSON Feature/FeatureCollection used to produce it. The geometry is "
        "re-validated through the same v2 pipeline (steps 1–5) before the row is "
        "inserted — invalid geometries are rejected with 422.\n\n"
        f"Shared analyses are automatically deleted after {SHARED_ANALYSIS_TTL_DAYS} days. "
        "Clients build the public-facing URL themselves from the returned ``id``."
    ),
    responses={
        201: {"description": "Snapshot persisted; returns the share id"},
        422: {"description": "Payload failed validation (analysis schema or geometry)"},
    },
)
def share_analysis_v2(
    body: SharedAnalysisCreate,
    db: Annotated[Session, Depends(get_db)],
) -> SharedAnalysisCreateResponse:
    """Persist an analysis snapshot and return the share id."""
    logger.info("POST /analysis/v2/share received")
    row = create_shared(db, body.analysis, body.geojson)
    db.commit()
    return SharedAnalysisCreateResponse(id=row.id)


@router.get(
    "/v2/share/{share_id}",
    summary="Retrieve a previously shared analysis (v2)",
    description=(
        "Returns the stored ``AnalysisResponse`` and original geojson for a shared "
        "analysis link. The stored payload is revalidated against the current "
        "``AnalysisResponse`` schema on every read — if it no longer conforms, or "
        "the row has been cleaned up, the endpoint responds with 410 Gone."
    ),
    responses={
        200: {"description": "Stored analysis + geojson"},
        410: {"description": "Share link has expired or is no longer available"},
    },
)
def get_shared_analysis_v2(
    share_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> SharedAnalysisRead:
    """Retrieve a previously shared analysis by id."""
    logger.info("GET /analysis/v2/share/%s received", share_id)
    return get_shared(db, share_id)
