"""Geometry validation service for POST /analysis."""

import logging

from fastapi import HTTPException
from pyproj import Transformer
from shapely.geometry import box, shape
from shapely.ops import transform, unary_union
from shapely.validation import explain_validity

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Validation constants — edit these to adjust thresholds without touching logic
# ─────────────────────────────────────────────────────────────────────────────

# Area thresholds (km²). Computed in EPSG:6933 (Cylindrical Equal Area, see ADR-003).
MIN_AREA_KM2: float = 1.0        # Polygons smaller than this produce meaningless stats
MAX_AREA_KM2: float = 50_000.0   # ~⅛ of the HBL region; keeps raster I/O tractable

# Hudson Bay Lowlands study area bounding box in EPSG:4326 (min_lon, min_lat, max_lon, max_lat).
# Derived from the map default view [-112, 50, -56, 64] with a +5° buffer on every side.
HBL_BBOX: tuple[float, float, float, float] = (-117.0, 45.0, -51.0, 69.0)

# ─────────────────────────────────────────────────────────────────────────────

# Module-level transformer — created once, reused across requests.
_TRANSFORMER_4326_TO_6933 = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)


def _extract_geometry(geojson):
    """Return a Shapely geometry from a validated Feature or FeatureCollection.

    For a FeatureCollection, all feature geometries are unioned into a single shape.
    """
    if geojson.type == "FeatureCollection":
        parts = [shape(feature.geometry.model_dump()) for feature in geojson.features]
        return unary_union(parts)

    return shape(geojson.geometry.model_dump())


def validate_geometry(geojson) -> None:
    """Run the full five-step validation pipeline for an analysis geometry.

    Steps
    -----
    1. Extract geometry — Feature as-is; FeatureCollection → unary_union of all features.
    2. Structural validity — Shapely ``is_valid`` (no self-intersections, degenerate rings, etc.).
    3. Minimum area — projected area must be ≥ MIN_AREA_KM2.
    4. Maximum area — projected area must be ≤ MAX_AREA_KM2.
    5. Geographic scope — geometry must intersect HBL_BBOX.

    Raises ``HTTPException(422)`` at the first failing step.
    All steps are logged; failures are logged at WARNING level.
    """
    logger.info("Starting geometry validation [input_type=%s]", geojson.type)

    # ── Step 1: Extract ───────────────────────────────────────────────────────
    geom = _extract_geometry(geojson)
    logger.info("Step 1 passed — geometry extracted [shapely_type=%s]", geom.geom_type)

    # ── Step 2: Structural validity ───────────────────────────────────────────
    if not geom.is_valid:
        reason = explain_validity(geom)
        logger.warning("Step 2 failed — invalid geometry: %s", reason)
        raise HTTPException(
            status_code=422,
            detail=f"Geometry is structurally invalid: {reason}",
        )
    logger.info("Step 2 passed — geometry is structurally valid")

    # ── Steps 3 & 4: Area bounds (project once to equal-area CRS) ─────────────
    projected = transform(_TRANSFORMER_4326_TO_6933.transform, geom)
    area_km2 = projected.area / 1_000_000

    if area_km2 < MIN_AREA_KM2:
        logger.warning(
            "Step 3 failed — area too small: %.6f km² (minimum: %.1f km²)",
            area_km2,
            MIN_AREA_KM2,
        )
        raise HTTPException(
            status_code=422,
            detail=f"Geometry area ({area_km2:.6f} km²) is below the minimum of {MIN_AREA_KM2:.1f} km²",
        )
    logger.info("Step 3 passed — area above minimum: %.4f km²", area_km2)

    if area_km2 > MAX_AREA_KM2:
        logger.warning(
            "Step 4 failed — area too large: %.2f km² (maximum: %.0f km²)",
            area_km2,
            MAX_AREA_KM2,
        )
        raise HTTPException(
            status_code=422,
            detail=f"Geometry area ({area_km2:,.2f} km²) exceeds the maximum of {MAX_AREA_KM2:,.0f} km²",
        )
    logger.info("Step 4 passed — area within maximum: %.2f km²", area_km2)

    # ── Step 5: Geographic scope ──────────────────────────────────────────────
    hbl_box = box(*HBL_BBOX)
    if not geom.intersects(hbl_box):
        logger.warning(
            "Step 5 failed — geometry does not intersect the HBL study area (bbox=%s)",
            HBL_BBOX,
        )
        raise HTTPException(
            status_code=422,
            detail=(
                "Geometry does not intersect the Hudson Bay Lowlands study area. "
                f"Expected overlap with bounding box lon=[{HBL_BBOX[0]}, {HBL_BBOX[2]}] "
                f"lat=[{HBL_BBOX[1]}, {HBL_BBOX[3]}] (EPSG:4326)."
            ),
        )
    logger.info("Step 5 passed — geometry intersects the HBL study area")

    logger.info("Geometry validation complete [area=%.2f km²]", area_km2)
    return geom
