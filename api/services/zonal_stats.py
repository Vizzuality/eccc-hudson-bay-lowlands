"""Zonal statistics computation service."""

import logging
import math
from datetime import date, timedelta
from functools import lru_cache
from typing import Any

import numpy as np
import rasterio
from exactextract import exact_extract
from pyproj import Transformer
from shapely.geometry import mapping
from shapely.ops import transform

from schemas.dataset import DatasetWithLayersSchema
from services.widgets import WIDGET_CONFIG

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=None)
def _transformer(src_crs: str, dst_crs: str) -> Transformer:
    # Built once per CRS pair per process; construction is expensive.
    return Transformer.from_crs(src_crs, dst_crs, always_xy=True)


def _reproject(geom, src_crs: str, dst_crs: str):
    return transform(_transformer(src_crs, dst_crs).transform, geom)


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


def _build_frac_dict(result: dict) -> dict[float, float]:
    """Build {pixel_value: coverage_fraction} from exactextract ``unique`` + ``frac`` arrays."""
    unique = np.asarray(result.get("unique", [])).tolist()
    frac = np.asarray(result.get("frac", [])).tolist()
    return dict(zip(unique, frac))


def _compute_stat(
    result: dict,
    stat_def: dict,
    polygon_area_km2: float,
    stats: dict[str, float | str],
) -> float | str:
    """Compute a single stat value from exactextract output, applying scale and precision.

    Supported ``op`` values:
      - any exactextract op key present in ``result`` ("mean", "max", "sum", ...) — read directly
      - ``frac_sum``  + ``values: [v1, v2, ...]``  — sum coverage fractions for those pixel values
      - ``frac_range`` + ``range: [lo, hi]``       — sum coverage fractions for closed range [lo, hi]
      - ``frac_area`` + ``values: [v1, v2, ...]``  — area (km²) covered by those pixel values,
        computed as ``frac_sum × polygon_area_km2``. Overview-safe because it scales the
        coverage fraction by the polygon's projected area rather than a per-pixel constant.
      - ``date_offset`` + ``base_year: int``        — interpret the ``mean`` op result as a
        day offset from Dec 31 of ``base_year`` and return an ISO ``YYYY-MM-DD`` string.
        Returns ``""`` when the mean is missing or non-finite.
      - ``stat_sum``  + ``terms: [name, ...]``      — sum of already-computed stats.
      - ``stat_diff`` + ``terms: [a, b, ...]``      — first term minus the sum of the rest.
        Both composition ops depend on their referenced stats appearing earlier in the
        layer's ``stats`` list so they're already in ``stats``.
      - ``frac_of_stat`` + ``stat: name``           — coverage fraction of the pixel value
        held in the named, already-computed stat (e.g. the ``majority`` stat). Used to derive
        "% of the dominant class" without hardcoding the class id.
    """
    op = stat_def["op"]

    if op == "date_offset":
        days = result.get("mean")
        if days is None or not math.isfinite(float(days)):
            return ""
        base = date(stat_def["base_year"], 12, 31)
        return (base + timedelta(days=round(float(days)))).isoformat()

    if op == "frac_sum":
        fracs = _build_frac_dict(result)
        raw = sum(fracs.get(v, 0.0) for v in stat_def["values"])
    elif op == "frac_range":
        fracs = _build_frac_dict(result)
        lo, hi = stat_def["range"]
        raw = sum(fracs.get(v, 0.0) for v in range(lo, hi + 1))
    elif op == "frac_area":
        # polygon_area_km2 is EPSG:6933 but frac is in the raster's CRS — only exact when
        # the raster is equal-area. ~1% off in EPSG:3978 (HBL); don't use with Web Mercator.
        fracs = _build_frac_dict(result)
        raw = sum(fracs.get(v, 0.0) for v in stat_def["values"]) * polygon_area_km2
    elif op == "frac_of_stat":
        fracs = _build_frac_dict(result)
        raw = fracs.get(stats[stat_def["stat"]], 0.0)
    elif op == "stat_sum":
        raw = sum(float(stats[t]) for t in stat_def["terms"])
    elif op == "stat_diff":
        first, *rest = stat_def["terms"]
        raw = float(stats[first]) - sum(float(stats[t]) for t in rest)
    else:
        raw = result.get(op, 0)

    scale = stat_def.get("scale", 1.0)
    precision = stat_def.get("precision", 2)
    return round(float(raw or 0) * scale, precision)


# ─────────────────────────────────────────────────────────────────────────────
# Generic widget builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_chart(layer_id: str, chart_cfg: dict, result: dict, stats: dict[str, float | str]) -> list:
    """Build a chart payload for one layer based on its chart config.

    ``histogram``: coverage-weighted histogram of pixel values (returns ``HistogramPoint[]``).
    ``categorical``: donut/pie slices sourced from already-computed stats (returns ``CategoricalDataPoint[]``).
    """
    chart_type = chart_cfg["type"]

    if chart_type == "histogram":
        return _histogram(result.get("values", []), result.get("coverage", []))

    if chart_type == "categorical":
        return [
            {"key": s["stat"], "value": stats[s["stat"]]}
            for s in chart_cfg["slices"]
        ]

    raise ValueError(f"Unknown chart type '{chart_type}' for layer '{layer_id}'")


def _build_widget_chart(chart_cfg: dict, stats: dict[str, float | str]) -> list:
    """Build a widget-level chart payload that aggregates across layers' computed stats.

    ``time_series``: list of ``{x, y}`` points sourced from already-computed stats.
        Used when a single chart spans multiple layers (e.g. one mean per winter raster).
    """
    chart_type = chart_cfg["type"]

    if chart_type == "time_series":
        return [{"x": p["x"], "y": stats[p["stat"]]} for p in chart_cfg["points"]]

    raise ValueError(f"Unknown widget-level chart type '{chart_type}'")


def _build_widget(
    widget_id: str,
    layer_results: dict[str, dict],
    dataset,
    layers_by_id: dict[str, Any],
    polygon_area_km2: float,
) -> dict:
    """Build a widget response dict driven entirely by WIDGET_CONFIG.

    Parameters
    ----------
    widget_id:         key in WIDGET_CONFIG (e.g. "peat_carbon")
    layer_results:     exactextract outputs keyed by layer id
    dataset:           ORM Dataset (with ``layers`` eager-loaded) referenced by the widget
    layers_by_id:      flat ``{layer_id: Layer}`` lookup across all datasets; used to
                       resolve the widget's display unit when ``unit_layer`` is set
    polygon_area_km2:  polygon area in km² (EPSG:6933), needed by ``frac_area`` stats

    Returns
    -------
    dict with keys: unit, dataset, chart, stats
    """
    config = WIDGET_CONFIG[widget_id]
    stats: dict[str, float | str] = {}
    chart: dict[str, list] = {}

    for layer_id, layer_cfg in config["layers"].items():
        result = layer_results.get(layer_id, {})

        for stat_def in layer_cfg["stats"]:
            stats[stat_def["name"]] = _compute_stat(result, stat_def, polygon_area_km2, stats)

        chart_cfg = layer_cfg.get("chart")
        if chart_cfg:
            chart[layer_id] = _build_chart(layer_id, chart_cfg, result, stats)

    # Widget-level chart aggregates across layers (e.g. time_series). Keyed by the
    # synthetic ``key`` declared in the chart config — this key is NOT a Layer.id.
    widget_chart_cfg = config.get("chart")
    if widget_chart_cfg:
        chart[widget_chart_cfg["key"]] = _build_widget_chart(widget_chart_cfg, stats)

    unit_layer_id = config.get("unit_layer", "")
    unit_layer = layers_by_id.get(unit_layer_id) if unit_layer_id else None
    unit = config.get("unit") or (unit_layer.unit if unit_layer else None) or ""

    return {
        "unit": unit,
        "dataset": DatasetWithLayersSchema.from_orm_dataset(dataset),
        "chart": chart,
        "stats": stats,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def compute_zonal_stats(geom_4326, datasets, bucket: str, polygon_area_km2: float) -> dict:
    """Compute all widget statistics for a validated polygon.

    Parameters
    ----------
    geom_4326:         Shapely geometry in EPSG:4326 (returned by validate_geometry)
    datasets:          Sequence of ORM Dataset rows with ``layers`` eager-loaded
    bucket:            S3 bucket name used to resolve full raster URIs
    polygon_area_km2:  Polygon area in km² (EPSG:6933, returned by validate_geometry).
                       Used by ``frac_area`` stats to convert coverage fractions to areas.

    Returns
    -------
    dict matching the AnalysisResult shape expected by the FE, keyed by widget id.
    """
    datasets_by_id = {ds.id: ds for ds in datasets}
    layers_by_id = {layer.id: layer for ds in datasets for layer in ds.layers}

    results: dict[str, dict] = {}
    for widget_id, widget_cfg in WIDGET_CONFIG.items():
        dataset = datasets_by_id.get(widget_cfg["dataset_id"])
        if dataset is None:
            logger.warning(
                "Dataset id=%s not found in DB — skipping widget '%s'",
                widget_cfg["dataset_id"], widget_id,
            )
            continue

        layer_results: dict[str, dict] = {}
        for layer_id, layer_cfg in widget_cfg["layers"].items():
            layer = layers_by_id.get(layer_id)
            if layer is None:
                logger.warning("Layer '%s' not found in DB — skipping widget '%s'", layer_id, widget_id)
                continue

            uri = _s3_uri(layer.path, bucket)
            logger.info("Processing layer '%s' for widget '%s'", layer_id, widget_id)
            layer_results[layer_id] = _run_exact_extract(uri, geom_4326, layer_cfg["ops"])

        results[widget_id] = _build_widget(widget_id, layer_results, dataset, layers_by_id, polygon_area_km2)

    return results
