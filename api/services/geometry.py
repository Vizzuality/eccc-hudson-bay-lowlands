"""Geometry validation service for coordinate and area checks.

Validates GeoJSON geometries against WGS84 coordinate bounds and
computes area by reprojecting to EPSG:6933 (equal-area cylindrical).
"""

import math

from pyproj import Transformer
from shapely import ops
from shapely.geometry import shape

# Maximum allowed geometry area in square kilometers
MAX_AREA_SQ_KM = 1000.0

# Reusable transformer from WGS84 (lon/lat) to World Cylindrical Equal Area
_transformer = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)


def _extract_all_coordinates(geojson: dict) -> list[tuple[float, float]]:
    """Extract all (lon, lat) coordinate pairs from a GeoJSON geometry.

    Handles nested coordinate arrays for both Polygon and MultiPolygon types.

    Args:
        geojson: A GeoJSON geometry dict with a "coordinates" key.

    Returns:
        A flat list of (longitude, latitude) tuples.
    """
    coords = []
    geometry_type = geojson.get("type", "")
    raw_coords = geojson.get("coordinates", [])

    if geometry_type == "Polygon":
        for ring in raw_coords:
            for point in ring:
                coords.append((point[0], point[1]))
    elif geometry_type == "MultiPolygon":
        for polygon in raw_coords:
            for ring in polygon:
                for point in ring:
                    coords.append((point[0], point[1]))

    return coords


def validate_coordinates_wgs84(geojson: dict) -> list[str]:
    """Validate that all coordinates fall within WGS84 bounds.

    Checks that longitude values are in [-180, 180] and latitude values
    are in [-90, 90].

    Args:
        geojson: A GeoJSON geometry dict.

    Returns:
        A list of error messages. Empty if all coordinates are valid.
    """
    errors = []
    coordinates = _extract_all_coordinates(geojson)

    for lon, lat in coordinates:
        if not (-180 <= lon <= 180):
            errors.append(f"Longitude {lon} is outside valid range [-180, 180]")
        if not (-90 <= lat <= 90):
            errors.append(f"Latitude {lat} is outside valid range [-90, 90]")

    return errors


def compute_area_sq_km(geojson: dict) -> float:
    """Compute the area of a GeoJSON geometry in square kilometers.

    Reprojects the geometry from EPSG:4326 to EPSG:6933 (World Cylindrical
    Equal Area) before computing area to get accurate measurements.

    If the reprojection produces invalid results (e.g. due to out-of-range
    coordinates), returns 0.0 instead of NaN.

    Args:
        geojson: A GeoJSON geometry dict (Polygon or MultiPolygon).

    Returns:
        The area of the geometry in square kilometers, or 0.0 if computation fails.
    """
    geom = shape(geojson)
    projected = ops.transform(_transformer.transform, geom)
    area_sq_m = projected.area
    if math.isnan(area_sq_m) or math.isinf(area_sq_m):
        return 0.0
    return area_sq_m / 1_000_000


def validate_geometry(geojson: dict) -> dict:
    """Orchestrate full geometry validation.

    Performs the following checks in order:
    1. Geometry type must be Polygon or MultiPolygon
    2. All coordinates must be within WGS84 bounds
    3. Computed area must not exceed MAX_AREA_SQ_KM

    Args:
        geojson: A GeoJSON geometry dict.

    Returns:
        A dict matching the GeometryValidationResponse schema fields.
    """
    errors: list[str] = []
    geometry_type = geojson.get("type", "Unknown")

    # Validate geometry type
    allowed_types = {"Polygon", "MultiPolygon"}
    if geometry_type not in allowed_types:
        errors.append(f"Unsupported geometry type: {geometry_type}. Must be Polygon or MultiPolygon.")
        return {
            "valid": False,
            "geometry_type": geometry_type,
            "crs": "EPSG:4326",
            "area_sq_km": 0.0,
            "max_area_sq_km": MAX_AREA_SQ_KM,
            "errors": errors,
        }

    # Validate coordinate ranges
    coord_errors = validate_coordinates_wgs84(geojson)
    errors.extend(coord_errors)

    # Compute area
    area_sq_km = compute_area_sq_km(geojson)

    # Validate area constraint
    if area_sq_km > MAX_AREA_SQ_KM:
        errors.append(f"Geometry area ({area_sq_km:.2f} sq km) exceeds maximum allowed area ({MAX_AREA_SQ_KM:.2f} sq km).")

    return {
        "valid": len(errors) == 0,
        "geometry_type": geometry_type,
        "crs": "EPSG:4326",
        "area_sq_km": round(area_sq_km, 4),
        "max_area_sq_km": MAX_AREA_SQ_KM,
        "errors": errors,
    }
