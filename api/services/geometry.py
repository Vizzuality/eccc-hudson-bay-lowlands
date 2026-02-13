"""Geometry validation and transformation service.

Provides coordinate validation, CRS transformation, area computation,
and bounding box calculation for GeoJSON geometries.
"""

from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely.ops import transform
from shapely.validation import explain_validity

MAX_AREA_SQ_KM = 1000

# Module-level Transformer instances (thread-safe, expensive to create)
_transformer_3857_to_4326 = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)
_transformer_4326_to_6933 = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)


def validate_geojson(geojson: dict) -> tuple[bool, str | None]:
    """Validate that a dict is a valid GeoJSON Polygon or MultiPolygon.

    Returns a tuple of (is_valid, error_message).
    """
    if not isinstance(geojson, dict):
        return False, "Geometry must be a GeoJSON object"

    geom_type = geojson.get("type")
    if geom_type not in ("Polygon", "MultiPolygon"):
        return False, "Geometry type must be Polygon or MultiPolygon"

    if "coordinates" not in geojson:
        return False, "Geometry must have coordinates"

    try:
        geom = shape(geojson)
    except (ValueError, TypeError, AttributeError):
        return False, "Invalid GeoJSON geometry"

    if not geom.is_valid:
        return False, f"Invalid geometry: {explain_validity(geom)}"

    return True, None


def validate_coordinates_wgs84(geojson: dict) -> list[str]:
    """Validate that all coordinates are within WGS84 bounds.

    Longitude must be in [-180, 180], latitude in [-90, 90].
    Returns a list of error messages (empty if valid).
    """
    errors = []
    coords = _extract_coordinates(geojson)

    for lon, lat in coords:
        if not (-180 <= lon <= 180):
            errors.append(f"Longitude {lon} out of range [-180, 180]")
        if not (-90 <= lat <= 90):
            errors.append(f"Latitude {lat} out of range [-90, 90]")

    return errors


def validate_coordinates_web_mercator(geojson: dict) -> list[str]:
    """Validate that all coordinates are within Web Mercator (EPSG:3857) bounds.

    X must be in [-20037508.34, 20037508.34], Y in [-20048966.10, 20048966.10].
    Returns a list of error messages (empty if valid).
    """
    errors = []
    coords = _extract_coordinates(geojson)

    x_max = 20037508.34
    y_max = 20048966.10

    for x, y in coords:
        if not (-x_max <= x <= x_max):
            errors.append(f"X coordinate {x} out of range [-{x_max}, {x_max}]")
        if not (-y_max <= y <= y_max):
            errors.append(f"Y coordinate {y} out of range [-{y_max}, {y_max}]")

    return errors


def transform_3857_to_4326(geojson: dict) -> dict:
    """Transform a GeoJSON geometry from EPSG:3857 to EPSG:4326.

    Returns a new GeoJSON dict with transformed coordinates.
    """
    geom = shape(geojson)
    transformed = transform(_transformer_3857_to_4326.transform, geom)
    return mapping(transformed)


def compute_area_sq_km(geojson_4326: dict) -> float:
    """Compute the area of a WGS84 GeoJSON geometry in square kilometers.

    Reprojects to EPSG:6933 (cylindrical equal-area) for accurate area computation.
    """
    geom = shape(geojson_4326)
    projected = transform(_transformer_4326_to_6933.transform, geom)
    area_sq_m = projected.area
    return area_sq_m / 1_000_000


def compute_bounding_box(geojson: dict) -> list[float]:
    """Compute the bounding box of a GeoJSON geometry.

    Returns [minx, miny, maxx, maxy] from shapely bounds.
    """
    geom = shape(geojson)
    return list(geom.bounds)


def _extract_coordinates(geojson: dict) -> list[tuple[float, float]]:
    """Extract all coordinate pairs from a GeoJSON geometry.

    Returns a flat list of (x, y) tuples.
    """
    coords = []
    geom_type = geojson.get("type")
    raw_coords = geojson.get("coordinates", [])

    if geom_type == "Polygon":
        for ring in raw_coords:
            for point in ring:
                coords.append((point[0], point[1]))
    elif geom_type == "MultiPolygon":
        for polygon in raw_coords:
            for ring in polygon:
                for point in ring:
                    coords.append((point[0], point[1]))

    return coords
