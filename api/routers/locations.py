"""Locations CRUD endpoint router."""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import mapping, shape
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from db.database import get_db
from models.location import Location
from schemas.location import (
    LocationCreate,
    LocationResponse,
    LocationWithRastersResponse,
    PaginatedLocationResponse,
)
from schemas.raster import RasterResponse
from services.geometry import (
    MAX_AREA_SQ_KM,
    compute_area_sq_km,
    compute_bounding_box,
    transform_3857_to_4326,
    validate_coordinates_web_mercator,
    validate_coordinates_wgs84,
    validate_geojson,
)

router = APIRouter(tags=["Locations"])


def _location_to_response(location: Location) -> LocationResponse:
    """Convert a Location ORM instance to a LocationResponse.

    Handles GeoAlchemy2 WKBElement to GeoJSON dict conversion.
    """
    geojson = mapping(to_shape(location.geometry))
    return LocationResponse(
        id=location.id,
        name=location.name,
        geometry=geojson,
        bounding_box=location.bounding_box,
        area_sq_km=location.area_sq_km,
        crs="EPSG:4326",
    )


def _location_with_rasters_to_response(location: Location) -> LocationWithRastersResponse:
    """Convert a Location ORM instance to a LocationWithRastersResponse.

    Includes nested raster serialization.
    """
    geojson = mapping(to_shape(location.geometry))
    rasters = [RasterResponse.model_validate(r) for r in location.rasters]
    return LocationWithRastersResponse(
        id=location.id,
        name=location.name,
        geometry=geojson,
        bounding_box=location.bounding_box,
        area_sq_km=location.area_sq_km,
        crs="EPSG:4326",
        rasters=rasters,
    )


@router.get(
    "",
    summary="List Locations",
    description="Returns a paginated list of locations.",
    response_model=PaginatedLocationResponse,
)
def list_locations(
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedLocationResponse:
    """List locations with pagination."""
    total = db.scalar(select(func.count()).select_from(Location))

    pages = math.ceil(total / size) if total > 0 else 0
    offset = (page - 1) * size

    stmt = select(Location).offset(offset).limit(size)
    locations = db.scalars(stmt).all()

    return PaginatedLocationResponse(
        items=[_location_to_response(loc) for loc in locations],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/{location_id}",
    summary="Get Location",
    description="Returns a single location with its associated rasters.",
    response_model=LocationWithRastersResponse,
)
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
) -> LocationWithRastersResponse:
    """Get a location by ID with nested rasters."""
    stmt = select(Location).where(Location.id == location_id).options(selectinload(Location.rasters))
    location = db.scalars(stmt).first()

    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")

    return _location_with_rasters_to_response(location)


@router.post(
    "",
    summary="Create Location",
    description="Creates a new location entry. Accepts EPSG:4326 or EPSG:3857 geometries.",
    response_model=LocationResponse,
    status_code=201,
)
def create_location(
    location: LocationCreate,
    db: Session = Depends(get_db),
) -> LocationResponse:
    """Create a new location.

    Validates GeoJSON structure and coordinates, transforms from EPSG:3857
    if needed, computes area and bounding box, and stores as PostGIS geometry.
    """
    geojson = location.geometry

    # Validate GeoJSON structure
    is_valid, error = validate_geojson(geojson)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error)

    # Validate coordinates based on input CRS
    if location.crs == "EPSG:3857":
        coord_errors = validate_coordinates_web_mercator(geojson)
    else:
        coord_errors = validate_coordinates_wgs84(geojson)

    if coord_errors:
        raise HTTPException(status_code=422, detail=coord_errors)

    # Transform to WGS84 if input is Web Mercator
    if location.crs == "EPSG:3857":
        geojson = transform_3857_to_4326(geojson)

    # Compute area and validate against maximum
    area_sq_km = compute_area_sq_km(geojson)
    if area_sq_km > MAX_AREA_SQ_KM:
        raise HTTPException(
            status_code=422,
            detail=f"Area {area_sq_km:.2f} sq km exceeds maximum allowed area of {MAX_AREA_SQ_KM} sq km",
        )

    # Compute bounding box from the WGS84 geometry
    bounding_box = compute_bounding_box(geojson)

    # Convert to WKB for PostGIS storage
    geom_shape = shape(geojson)
    wkb_element = from_shape(geom_shape, srid=4326)

    db_location = Location(
        name=location.name,
        geometry=wkb_element,
        bounding_box=bounding_box,
        area_sq_km=area_sq_km,
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)

    return _location_to_response(db_location)
