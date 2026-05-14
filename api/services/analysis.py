"""Geometry validation service for POST /analysis."""

import json
import logging
from pathlib import Path

from fastapi import HTTPException
from pyproj import Transformer
from shapely.geometry import shape
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


def validate_geometry(geojson) -> tuple:
    """Run the full five-step validation pipeline for an analysis geometry.

    Steps
    -----
    1. Extract geometry — Feature as-is; FeatureCollection → unary_union of all features.
    2. Structural validity — Shapely ``is_valid`` (no self-intersections, degenerate rings, etc.).
    3. Minimum area — projected area must be ≥ MIN_AREA_KM2.
    4. Maximum area — projected area must be ≤ MAX_AREA_KM2.
    5. Geographic scope — geometry must lie entirely within the HBL study-area shape (HBL_SHAPE).

    Returns a ``(geom, area_km2)`` tuple where ``geom`` is the EPSG:4326 Shapely
    geometry and ``area_km2`` is its area projected to EPSG:6933 (Cylindrical
    Equal Area). Downstream zonal-stats code reuses ``area_km2`` to derive
    per-class areas from coverage fractions without recomputing the projection.

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
    # ``covers`` (vs ``contains``) accepts polygons whose edge touches the HBL
    # boundary, which matches user intent for "inside the highlighted region."
    if not HBL_SHAPE.covers(geom):
        logger.warning("Step 5 failed — geometry is not entirely within the HBL study area")
        raise HTTPException(
            status_code=422,
            detail="Geometry must lie entirely within the Hudson Bay Lowlands study area.",
        )
    logger.info("Step 5 passed — geometry lies entirely within the HBL study area")

    logger.info("Geometry validation complete [area=%.2f km²]", area_km2)
    return geom, area_km2
