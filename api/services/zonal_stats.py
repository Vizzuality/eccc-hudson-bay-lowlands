"""Zonal statistics computation service."""

import logging
import math
from typing import Any

import numpy as np
import rasterio
from exactextract import exact_extract
from pyproj import Transformer
from shapely.geometry import mapping
from shapely.ops import transform

from services.widgets import WIDGET_CONFIG

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

_TRANSFORMERS: dict[str, Transformer] = {}


def _transformer(src_crs: str, dst_crs: str) -> Transformer:
    """Return a cached Transformer for the given CRS pair."""
    key = f"{src_crs}→{dst_crs}"
    if key not in _TRANSFORMERS:
        _TRANSFORMERS[key] = Transformer.from_crs(src_crs, dst_crs, always_xy=True)
    return _TRANSFORMERS[key]


def _reproject(geom, src_crs: str, dst_crs: str):
    """Reproject a Shapely geometry between two CRS."""
    t = _transformer(src_crs, dst_crs)
    return transform(t.transform, geom)


def _s3_uri(db_path: str, bucket: str) -> str:
    """Build an S3 URI from a DB layer path (strips leading slash)."""
    return f"s3://{bucket}/{db_path.lstrip('/')}"


def _optimal_overview_level(src: rasterio.DatasetReader, geom) -> int | None:
    """Return the 0-based overview level where polygon pixel count fits within one raster block.

    Solves polygon_pixels <= block_pixels / 4^(level+1) for the smallest valid level.
    Returns None when native resolution is already appropriate or no overviews exist.
    Block size is read from the file so this works for both COGs and plain GeoTIFFs.
    """
    n_overviews = len(src.overviews(1))
    raster_res_area = math.prod(src.res)
    polygon_pixels = geom.area / raster_res_area
    block_pixels = math.prod(src.block_shapes[0]) if src.block_shapes else 512 * 512
    level = math.ceil(math.log(max(1, polygon_pixels / block_pixels), 4)) - 1
    level = min(level, n_overviews - 1 if n_overviews > 0 else -1)
    return level if level >= 0 else None


def _run_exact_extract(path: str, geom_4326, ops: list[str]) -> dict[str, Any]:
    """Open a raster at its optimal overview level and run exactextract.

    The geometry is provided in EPSG:4326 and reprojected to the raster's
    native CRS (read from the file) before extraction.

    Returns a flat dict of operation results keyed by op name.
    """
    with rasterio.open(path) as src:
        native_crs = src.crs.to_string()
        geom = _reproject(geom_4326, "EPSG:4326", native_crs)
        level = _optimal_overview_level(src, geom)

    open_kwargs: dict[str, Any] = {}
    if level is not None:
        open_kwargs["overview_level"] = level

    with rasterio.open(path, **open_kwargs) as src:
        vec = {"type": "Feature", "geometry": mapping(geom), "properties": {}}
        results = exact_extract(src, vec, ops)

    if not results or not results[0].get("properties"):
        return {}

    return results[0]["properties"]


def _histogram(values: Any, weights: Any, n_bins: int = 10) -> list[dict]:
    """Build a coverage-weighted histogram from pixel values.

    Parameters
    ----------
    values:  numpy array of pixel values (from exactextract 'values' op)
    weights: numpy array of coverage fractions (from exactextract 'coverage' op)
    n_bins:  number of histogram bins

    Returns
    -------
    List of {x: bin_midpoint, y: weighted_count} dicts.
    """
    arr = np.asarray(values, dtype=float)
    w = np.asarray(weights, dtype=float)

    mask = np.isfinite(arr) & (w > 0)
    arr, w = arr[mask], w[mask]

    if arr.size == 0:
        return []

    counts, edges = np.histogram(arr, bins=n_bins, weights=w)
    return [
        {"x": round(float((edges[i] + edges[i + 1]) / 2), 1), "y": round(float(counts[i]), 2)}
        for i in range(n_bins)
    ]


def _compute_stat(raw_value: Any, stat_def: dict) -> float:
    """Apply scale and precision from a stat definition to a raw exactextract result."""
    scale = stat_def.get("scale", 1.0)
    precision = stat_def.get("precision", 2)
    return round(float(raw_value or 0) * scale, precision)


# ─────────────────────────────────────────────────────────────────────────────
# Generic widget builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_widget(widget_id: str, layer_results: dict[str, dict]) -> dict:
    """Build a widget response dict driven entirely by WIDGET_CONFIG.

    Parameters
    ----------
    widget_id:      key in WIDGET_CONFIG (e.g. "peat_carbon")
    layer_results:  exactextract outputs keyed by layer id

    Returns
    -------
    dict with keys: unit, chart, stats
    """
    config = WIDGET_CONFIG[widget_id]
    stats: dict[str, float] = {}
    chart: dict[str, list] = {}

    for layer_id, layer_cfg in config["layers"].items():
        result = layer_results.get(layer_id, {})

        for stat_def in layer_cfg["stats"]:
            stats[stat_def["name"]] = _compute_stat(result.get(stat_def["op"]), stat_def)

        if layer_cfg.get("chart"):
            chart[layer_id] = _histogram(result.get("values", []), result.get("coverage", []))

    return {"unit": config["unit"], "chart": chart, "stats": stats}


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def compute_zonal_stats(geom_4326, raster_rows, bucket: str) -> dict:
    """Compute all widget statistics for a validated polygon.

    Parameters
    ----------
    geom_4326:   Shapely geometry in EPSG:4326 (returned by validate_geometry)
    raster_rows: Sequence of DB rows with .id and .path attributes
    bucket:      S3 bucket name used to resolve full raster URIs

    Returns
    -------
    dict matching the AnalysisResult shape expected by the FE, keyed by widget id.
    """
    layer_paths: dict[str, str] = {row.id: row.path for row in raster_rows}

    results: dict[str, dict] = {}
    for widget_id, widget_cfg in WIDGET_CONFIG.items():
        layer_results: dict[str, dict] = {}

        for layer_id, layer_cfg in widget_cfg["layers"].items():
            path = layer_paths.get(layer_id)
            if path is None:
                logger.warning("Layer '%s' not found in DB — skipping widget '%s'", layer_id, widget_id)
                continue

            uri = _s3_uri(path, bucket)
            logger.info("Processing layer '%s' for widget '%s'", layer_id, widget_id)
            layer_results[layer_id] = _run_exact_extract(uri, geom_4326, layer_cfg["ops"])

        results[widget_id] = _build_widget(widget_id, layer_results)

    return results
