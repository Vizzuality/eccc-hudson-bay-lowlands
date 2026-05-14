"""Geometry validation service for POST /analysis."""

import json
import logging
from pathlib import Path

from fastapi import HTTPException
from pyproj import Transformer
from shapely.geometry import box, shape
from shapely.ops import transform, unary_union
from shapely.prepared import prep
from shapely.validation import explain_validity

from config import get_settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Validation constants — edit these to adjust thresholds without touching logic
# ─────────────────────────────────────────────────────────────────────────────

# Area thresholds (km²). Computed in EPSG:6933 (Cylindrical Equal Area, see ADR-003).
MIN_AREA_KM2: float = 1.0        # Polygons smaller than this produce meaningless stats
MAX_AREA_KM2: float = 50_000.0   # ~⅛ of the HBL region; keeps raster I/O tractable

# Hudson Bay Lowlands study area bounding box in EPSG:4326 (min_lon, min_lat, max_lon, max_lat).
# Used by the legacy ``validate_geometry_v1`` path. Derived from the map default
# view [-112, 50, -56, 64] with a +5° buffer on every side.
HBL_BBOX: tuple[float, float, float, float] = (-117.0, 45.0, -51.0, 69.0)

# ─────────────────────────────────────────────────────────────────────────────

# Module-level transformer — created once, reused across requests.
_TRANSFORMER_4326_TO_6933 = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)


def _load_hbl_shape():
    """Load the HBL study-area polygon from GeoJSON and return a prepared geometry.

    The file is expected to be in EPSG:4326 (lon/lat degrees) — same CRS as the
    analysis input — so the containment check is a pure planar comparison with
    no reprojection. See `.claude/PROJECTION.md` for rationale.

    A FeatureCollection's features are unioned. The result is validated with
    Shapely (``is_valid``) and wrapped in ``shapely.prepared.prep`` so repeated
    predicate checks (``intersects``, ``covers``) are O(log n) rather than O(n).

    Raises ``RuntimeError`` on startup if the file is missing or invalid — this
    is a deploy-time configuration error, not a runtime condition.
    """
    raw_path = Path(get_settings().hbl_shape_path)
    path = raw_path if raw_path.is_absolute() else Path(__file__).resolve().parent.parent / raw_path
    if not path.is_file():
        raise RuntimeError(f"HBL shape file not found at {path}")

    with path.open() as f:
        gj = json.load(f)

    gj_type = gj.get("type")
    if gj_type == "FeatureCollection":
        geom = unary_union([shape(feat["geometry"]) for feat in gj["features"]])
    elif gj_type == "Feature":
        geom = shape(gj["geometry"])
    else:
        geom = shape(gj)

    if not geom.is_valid:
        raise RuntimeError(f"HBL shape at {path} is not a valid geometry: {explain_validity(geom)}")

    logger.info("Loaded HBL shape from %s (type=%s, bounds=%s)", path, geom.geom_type, geom.bounds)
    return prep(geom)


HBL_SHAPE = _load_hbl_shape()


def _extract_geometry(geojson):
    """Return a Shapely geometry from a validated Feature or FeatureCollection.

    For a FeatureCollection, all feature geometries are unioned into a single shape.
    """
    if geojson.type == "FeatureCollection":
        parts = [shape(feature.geometry.model_dump()) for feature in geojson.features]
        return unary_union(parts)

    return shape(geojson.geometry.model_dump())


def _validate_structure_and_area(geojson) -> tuple:
    """Run validation steps 1–4 — the parts shared by both ``/analysis`` paths.

    Steps
    -----
    1. Extract geometry — Feature as-is; FeatureCollection → unary_union of all features.
    2. Structural validity — Shapely ``is_valid`` (no self-intersections, degenerate rings, etc.).
    3. Minimum area — projected area must be ≥ MIN_AREA_KM2.
    4. Maximum area — projected area must be ≤ MAX_AREA_KM2.

    Returns ``(geom, area_km2)`` where ``geom`` is the EPSG:4326 Shapely geometry
    and ``area_km2`` is the area projected to EPSG:6933 (Cylindrical Equal Area).
    Downstream zonal-stats code reuses ``area_km2`` to derive per-class areas
    from coverage fractions without recomputing the projection.

    Raises ``HTTPException(422)`` at the first failing step.
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

    return geom, area_km2


def validate_geometry_v1(geojson) -> tuple:
    """Validate an analysis geometry against the legacy HBL bounding box.

    Runs steps 1–4 (structural validity + area bounds) and a step 5 that accepts
    any geometry that *intersects* the HBL bbox — partial overlap is allowed.
    This matches the original ``POST /analysis`` contract that existed before
    the polygon-based study area was introduced. Kept for backward compatibility
    while clients migrate to ``/analysis/v2``.
    """
    geom, area_km2 = _validate_structure_and_area(geojson)

    # ── Step 5: Geographic scope (legacy — intersects HBL bbox) ───────────────
    hbl_box = box(*HBL_BBOX)
    if not geom.intersects(hbl_box):
        logger.warning(
            "Step 5 failed — geometry does not intersect the HBL bbox (%s)",
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
    logger.info("Step 5 passed — geometry intersects the HBL bbox")

    logger.info("Geometry validation complete (v1) [area=%.2f km²]", area_km2)
    return geom, area_km2


def validate_geometry_v2(geojson) -> tuple:
    """Validate an analysis geometry against the HBL study-area polygon.

    Runs steps 1–4 (structural validity + area bounds) and a step 5 that
    requires the geometry to lie entirely within the configured HBL polygon
    (``HBL_SHAPE``). Boundary-touching geometries pass (``covers`` rather than
    ``contains``) so users drawing right up to the highlight edge are accepted.
    Backs the ``POST /analysis/v2`` endpoint.
    """
    geom, area_km2 = _validate_structure_and_area(geojson)

    # ── Step 5: Geographic scope (full containment within HBL_SHAPE) ──────────
    # ``covers`` (vs ``contains``) accepts polygons whose edge touches the HBL
    # boundary, which matches user intent for "inside the highlighted region."
    if not HBL_SHAPE.covers(geom):
        logger.warning("Step 5 failed — geometry is not entirely within the HBL study area")
        raise HTTPException(
            status_code=422,
            detail="Geometry must lie entirely within the Hudson Bay Lowlands study area.",
        )
    logger.info("Step 5 passed — geometry lies entirely within the HBL study area")

    logger.info("Geometry validation complete (v2) [area=%.2f km²]", area_km2)
    return geom, area_km2
