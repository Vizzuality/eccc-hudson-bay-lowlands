"""Exactextract helpers for zonal statistics computation."""

import numpy as np
import rasterio
from exactextract import exact_extract
from pyproj import Transformer
from shapely.geometry import mapping
from shapely.ops import transform


def reproject(geom, src_crs: str, dst_crs: str):
    """Reproject a Shapely geometry between two CRS strings."""
    t = Transformer.from_crs(src_crs, dst_crs, always_xy=True)
    return transform(t.transform, geom)


def run_extract(raster_path, geom_3857, ops: list[str]) -> dict:
    """Run exactextract on a raster for a single polygon in EPSG:3857.

    The geometry is reprojected to the raster's native CRS before extraction,
    so all statistics are computed in the raster's native CRS.

    Parameters
    ----------
    raster_path : path-like or str
        Local file path or S3 URI (s3://bucket/key).
    geom_3857 : Shapely geometry
        Polygon in EPSG:3857 (Web Mercator).
    ops : list[str]
        exactextract operation names, e.g. ["mean", "frac", "unique"].

    Returns
    -------
    dict
        Flat dict of operation results, e.g. {"mean": 12.3, "frac": array([...])}.
    """
    with rasterio.open(raster_path) as src:
        native_crs = src.crs.to_string()
        geom = reproject(geom_3857, "EPSG:3857", native_crs)
        vec = {"type": "Feature", "geometry": mapping(geom), "properties": {}}
        results = exact_extract(src, vec, ops)

    if not results or not results[0].get("properties"):
        return {}
    return results[0]["properties"]


def build_frac_dict(unique_arr, frac_arr) -> dict[int, float]:
    """Build {pixel_value: coverage_fraction} from exactextract frac + unique arrays.

    ``frac`` returns the coverage-weighted fraction of the polygon area covered
    by each unique pixel value (sums to 1.0). ``unique`` returns the corresponding
    pixel values in the same order.
    """
    return dict(zip(unique_arr.tolist(), frac_arr.tolist()))


def frac_sum(fracs: dict, values) -> float:
    """Sum coverage fractions for an explicit list of pixel values.

    Multiply the result by 100 to obtain a percentage.
    """
    return sum(fracs.get(v, 0.0) for v in values)


def frac_range(fracs: dict, lo: int, hi: int) -> float:
    """Sum coverage fractions for the closed integer range [lo, hi].

    Multiply the result by 100 to obtain a percentage.
    """
    return frac_sum(fracs, range(lo, hi + 1))


def build_histogram(values_raw, coverage_raw, n_bins: int = 10) -> list[dict]:
    """Build a coverage-weighted histogram from exactextract values + coverage arrays.

    Parameters
    ----------
    values_raw   : array-like — pixel values returned by the exactextract "values" op
    coverage_raw : array-like — coverage fractions returned by the "coverage" op
    n_bins       : number of histogram bins (default 10)

    Returns
    -------
    List of {"x": bin_midpoint, "y": weighted_count} dicts, one per bin.
    """
    arr = np.asarray(values_raw, dtype=float)
    w   = np.asarray(coverage_raw, dtype=float)
    mask = np.isfinite(arr) & (w > 0)
    arr, w = arr[mask], w[mask]
    if arr.size == 0:
        return []
    counts, edges = np.histogram(arr, bins=n_bins, weights=w)
    return [
        {"x": round(float((edges[i] + edges[i + 1]) / 2), 2), "y": round(float(counts[i]), 4)}
        for i in range(n_bins)
    ]
