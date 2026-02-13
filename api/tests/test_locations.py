"""Tests for locations endpoints."""

import pytest
from sqlalchemy.orm import Session

from models import Location

# =============================================================================
# List Endpoint Tests
# =============================================================================


def test_list_locations_returns_200(client):
    """Test that list locations endpoint returns 200 status code."""
    response = client.get("/locations/")
    assert response.status_code == 200


def test_list_locations_returns_empty_list(client):
    """Test that list locations returns empty list when no locations exist."""
    response = client.get("/locations/")
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 10
    assert data["pages"] == 0


def test_list_locations_pagination_validation(client):
    """Test that invalid pagination parameters are rejected."""
    # Page must be >= 1
    response = client.get("/locations/?page=0")
    assert response.status_code == 422

    # Size must be >= 1
    response = client.get("/locations/?size=0")
    assert response.status_code == 422

    # Size must be <= 100
    response = client.get("/locations/?size=101")
    assert response.status_code == 422


def test_list_locations_response_structure(client):
    """Test that response structure matches PaginatedLocationResponse schema."""
    response = client.get("/locations/")
    data = response.json()

    # Check required fields in paginated response
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert "pages" in data

    # Check types
    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)
    assert isinstance(data["page"], int)
    assert isinstance(data["size"], int)
    assert isinstance(data["pages"], int)


# =============================================================================
# Create Endpoint Tests
# =============================================================================


def test_create_location_returns_201(client, sample_geometry):
    """Test that create location returns 201 status code."""
    location_data = {
        "name": "New Location",
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 201


def test_create_location_returns_created_with_id(client, sample_geometry):
    """Test that create location returns the created location with id."""
    location_data = {
        "name": "Created Location",
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    data = response.json()

    assert "id" in data
    assert isinstance(data["id"], int)
    assert data["name"] == location_data["name"]


def test_create_location_response_fields(client, sample_geometry):
    """Test that create location response includes all expected fields."""
    location_data = {
        "name": "Full Response Location",
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    data = response.json()

    assert response.status_code == 201
    assert "id" in data
    assert "name" in data
    assert "geometry" in data
    assert "bounding_box" in data
    assert "area_sq_km" in data
    assert "crs" in data
    assert data["crs"] == "EPSG:4326"
    assert isinstance(data["area_sq_km"], float)
    assert isinstance(data["bounding_box"], list)
    assert len(data["bounding_box"]) == 4


def test_create_location_auto_computes_bounding_box(client, sample_geometry):
    """Test that bounding box is auto-computed from geometry."""
    location_data = {
        "name": "Auto BBox Location",
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    data = response.json()

    assert response.status_code == 201
    bbox = data["bounding_box"]
    # The sample geometry spans from -85.0 to -84.9 in lon, 53.0 to 53.1 in lat
    assert bbox[0] == pytest.approx(-85.0, abs=0.01)
    assert bbox[1] == pytest.approx(53.0, abs=0.01)
    assert bbox[2] == pytest.approx(-84.9, abs=0.01)
    assert bbox[3] == pytest.approx(53.1, abs=0.01)


def test_create_location_computes_area(client, sample_geometry):
    """Test that area_sq_km is computed and within reasonable range."""
    location_data = {
        "name": "Area Location",
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    data = response.json()

    assert response.status_code == 201
    # Small polygon ~0.1 x 0.1 degrees at latitude 53 should be roughly 40-80 sq km
    assert data["area_sq_km"] > 0
    assert data["area_sq_km"] < 1000


def test_create_location_geometry_returned_as_geojson(client, sample_geometry):
    """Test that stored geometry is returned as GeoJSON dict."""
    location_data = {
        "name": "GeoJSON Response Location",
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    data = response.json()

    assert response.status_code == 201
    geom = data["geometry"]
    assert isinstance(geom, dict)
    assert geom["type"] == "Polygon"
    assert "coordinates" in geom


def test_create_location_with_multipolygon(client):
    """Test that MultiPolygon geometry type is accepted."""
    multipolygon = {
        "type": "MultiPolygon",
        "coordinates": [
            [
                [
                    [-85.0, 53.0],
                    [-84.95, 53.0],
                    [-84.95, 53.05],
                    [-85.0, 53.05],
                    [-85.0, 53.0],
                ]
            ],
            [
                [
                    [-84.9, 53.0],
                    [-84.85, 53.0],
                    [-84.85, 53.05],
                    [-84.9, 53.05],
                    [-84.9, 53.0],
                ]
            ],
        ],
    }
    location_data = {
        "name": "MultiPolygon Location",
        "geometry": multipolygon,
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 201
    data = response.json()
    assert data["geometry"]["type"] == "MultiPolygon"
    # Bounding box should encompass both polygons
    bbox = data["bounding_box"]
    assert bbox[0] == pytest.approx(-85.0, abs=0.01)
    assert bbox[2] == pytest.approx(-84.85, abs=0.01)


def test_create_location_validation_missing_name(client, sample_geometry):
    """Test that name is required."""
    location_data = {
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422


def test_create_location_validation_missing_geometry(client):
    """Test that geometry is required."""
    location_data = {
        "name": "No Geometry Location",
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422


def test_create_location_validation_invalid_geometry_type(client):
    """Test that non-Polygon/MultiPolygon geometry types are rejected."""
    location_data = {
        "name": "Point Location",
        "geometry": {
            "type": "Point",
            "coordinates": [-85.0, 53.0],
        },
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422


def test_create_location_validation_invalid_geojson(client):
    """Test that malformed GeoJSON is rejected."""
    location_data = {
        "name": "Invalid GeoJSON",
        "geometry": {
            "type": "Polygon",
            "coordinates": "not a valid coordinate array",
        },
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422


def test_create_location_area_exceeds_limit(client):
    """Test that geometry exceeding 1000 sq km is rejected."""
    # Large polygon: ~10 x 10 degrees is way over 1000 sq km
    large_polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [-90.0, 50.0],
                [-80.0, 50.0],
                [-80.0, 60.0],
                [-90.0, 60.0],
                [-90.0, 50.0],
            ]
        ],
    }
    location_data = {
        "name": "Too Large Location",
        "geometry": large_polygon,
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422
    assert "exceeds" in response.json()["detail"].lower()


def test_create_location_with_epsg_3857(client):
    """Test that EPSG:3857 input is transformed and stored as EPSG:4326."""
    # Web Mercator coordinates corresponding approximately to a small area
    web_mercator_polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [-9458523, 6982998],
                [-9447254, 6982998],
                [-9447254, 6996398],
                [-9458523, 6996398],
                [-9458523, 6982998],
            ]
        ],
    }
    location_data = {
        "name": "Web Mercator Location",
        "geometry": web_mercator_polygon,
        "crs": "EPSG:3857",
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 201

    data = response.json()
    # Response should be in EPSG:4326
    assert data["crs"] == "EPSG:4326"
    # The geometry should have been transformed to WGS84 coordinates
    geom = data["geometry"]
    assert geom["type"] == "Polygon"
    coords = geom["coordinates"][0]
    # Transformed coordinates should be in lon/lat range
    for lon, lat in coords:
        assert -180 <= lon <= 180
        assert -90 <= lat <= 90


def test_create_location_with_invalid_epsg_3857_coordinates(client):
    """Test that out-of-range EPSG:3857 coordinates are rejected."""
    invalid_web_mercator = {
        "type": "Polygon",
        "coordinates": [
            [
                [-30000000, 6982998],
                [-29990000, 6982998],
                [-29990000, 6996398],
                [-30000000, 6996398],
                [-30000000, 6982998],
            ]
        ],
    }
    location_data = {
        "name": "Invalid Web Mercator",
        "geometry": invalid_web_mercator,
        "crs": "EPSG:3857",
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422


def test_create_location_with_invalid_crs(client, sample_geometry):
    """Test that an unsupported CRS value is rejected."""
    location_data = {
        "name": "Bad CRS Location",
        "geometry": sample_geometry,
        "crs": "EPSG:32618",
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422


def test_create_location_with_invalid_wgs84_coordinates(client):
    """Test that out-of-range WGS84 coordinates are rejected."""
    invalid_wgs84 = {
        "type": "Polygon",
        "coordinates": [
            [
                [-200.0, 53.0],
                [-199.0, 53.0],
                [-199.0, 54.0],
                [-200.0, 54.0],
                [-200.0, 53.0],
            ]
        ],
    }
    location_data = {
        "name": "Invalid WGS84",
        "geometry": invalid_wgs84,
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 422


def test_create_location_persists_to_database(client, db_session: Session, sample_geometry):
    """Test that creating a location actually persists it to the database."""
    location_data = {
        "name": "Persisted Location",
        "geometry": sample_geometry,
    }
    response = client.post("/locations/", json=location_data)
    assert response.status_code == 201
    created_id = response.json()["id"]

    # Verify directly in database using the session
    db_location = db_session.get(Location, created_id)
    assert db_location is not None
    assert db_location.name == location_data["name"]


# =============================================================================
# Get By ID Endpoint Tests
# =============================================================================


def test_get_location_returns_200(client, sample_location: Location):
    """Test that get location endpoint returns 200 status code."""
    response = client.get(f"/locations/{sample_location.id}")
    assert response.status_code == 200


def test_get_location_returns_correct_data(client, sample_location: Location):
    """Test that get location returns correct data."""
    response = client.get(f"/locations/{sample_location.id}")
    data = response.json()

    assert data["id"] == sample_location.id
    assert data["name"] == sample_location.name
    assert data["bounding_box"] == sample_location.bounding_box
    assert data["crs"] == "EPSG:4326"


def test_get_location_returns_404_for_nonexistent(client):
    """Test that get location returns 404 for non-existent ID."""
    response = client.get("/locations/99999")
    assert response.status_code == 404


def test_get_location_includes_empty_rasters_list(client, sample_location: Location):
    """Test that get location includes empty rasters list when no rasters associated."""
    response = client.get(f"/locations/{sample_location.id}")
    data = response.json()

    assert "rasters" in data
    assert data["rasters"] == []


def test_get_location_includes_associated_rasters(client, sample_location_with_rasters: Location):
    """Test that get location includes associated rasters."""
    response = client.get(f"/locations/{sample_location_with_rasters.id}")
    data = response.json()

    assert "rasters" in data
    assert len(data["rasters"]) == 3

    # Verify raster data structure
    for raster in data["rasters"]:
        assert "id" in raster
        assert "name" in raster
        assert "crs" in raster
        assert "path" in raster


def test_get_location_raster_count_matches(client, sample_location_with_rasters: Location):
    """Test that the number of returned rasters matches the expected count."""
    response = client.get(f"/locations/{sample_location_with_rasters.id}")
    data = response.json()

    assert len(data["rasters"]) == len(sample_location_with_rasters.rasters)


def test_get_location_response_includes_geometry(client, sample_location: Location):
    """Test that get location response includes geometry as GeoJSON."""
    response = client.get(f"/locations/{sample_location.id}")
    data = response.json()

    assert "geometry" in data
    geom = data["geometry"]
    assert isinstance(geom, dict)
    assert "type" in geom
    assert "coordinates" in geom


# =============================================================================
# Pagination Integration Tests
# =============================================================================


def test_list_locations_with_seeded_data(client, sample_location: Location):
    """Test that list endpoint returns seeded location from fixture."""
    response = client.get("/locations/")
    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 1
    assert data["pages"] == 1
    assert len(data["items"]) == 1

    # Verify the returned location matches the fixture
    returned_location = data["items"][0]
    assert returned_location["id"] == sample_location.id
    assert returned_location["name"] == sample_location.name


def test_list_locations_pagination_total_count(client, db_session: Session, sample_geometry):
    """Test that pagination correctly reports total count with multiple locations."""
    from geoalchemy2.shape import from_shape
    from shapely.geometry import shape as shapely_shape

    geom = shapely_shape(sample_geometry)

    # Create 5 locations
    for i in range(5):
        location = Location(
            name=f"Pagination Location {i}",
            geometry=from_shape(geom, srid=4326),
            bounding_box=list(geom.bounds),
            area_sq_km=70.0,
        )
        db_session.add(location)
    db_session.commit()

    response = client.get("/locations/?size=2")
    data = response.json()

    assert data["total"] == 5
    assert data["pages"] == 3  # 5 items / 2 per page = 3 pages
    assert len(data["items"]) == 2


# =============================================================================
# Relationship Integration Tests
# =============================================================================


def test_create_raster_with_location_id(client, sample_location: Location):
    """Test that a raster can be created with a location_id."""
    raster_data = {
        "name": "Located Raster",
        "crs": "EPSG:4326",
        "path": "/data/located.tif",
        "location_id": sample_location.id,
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 201

    data = response.json()
    assert data["location_id"] == sample_location.id


def test_create_raster_without_location_id_still_works(client):
    """Test that rasters can still be created without a location_id."""
    raster_data = {
        "name": "Unlocated Raster",
        "crs": "EPSG:4326",
        "path": "/data/unlocated.tif",
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 201

    data = response.json()
    assert data["location_id"] is None


def test_list_rasters_filter_by_location_id(client, sample_location_with_rasters: Location):
    """Test that rasters can be filtered by location_id."""
    # Also create an unassociated raster
    unassociated = {
        "name": "Unassociated Raster",
        "crs": "EPSG:4326",
        "path": "/data/unassociated.tif",
    }
    client.post("/rasters/", json=unassociated)

    # Filter by location_id
    response = client.get(f"/rasters/?location_id={sample_location_with_rasters.id}")
    data = response.json()

    assert data["total"] == 3
    for item in data["items"]:
        assert item["location_id"] == sample_location_with_rasters.id


def test_list_rasters_filter_by_nonexistent_location_returns_empty(client, sample_location_with_rasters: Location):
    """Test that filtering by nonexistent location_id returns empty list."""
    response = client.get("/rasters/?location_id=99999")
    data = response.json()

    assert data["total"] == 0
    assert data["items"] == []
