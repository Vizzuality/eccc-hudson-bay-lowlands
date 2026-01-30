"""Tests for geometry validation endpoint."""

import json


def _small_polygon():
    """Return a small polygon (~6 sq km) near Hudson Bay Lowlands (55N, -85W)."""
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [-85.0, 55.0],
                [-85.03, 55.0],
                [-85.03, 55.02],
                [-85.0, 55.02],
                [-85.0, 55.0],
            ]
        ],
    }


def _large_polygon():
    """Return a large polygon (5x5 degrees at equator, ~300,000+ sq km)."""
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [0.0, 0.0],
                [5.0, 0.0],
                [5.0, 5.0],
                [0.0, 5.0],
                [0.0, 0.0],
            ]
        ],
    }


def _exactly_at_limit_polygon():
    """Return a polygon well under the 1000 sq km limit (~900 sq km at 55N)."""
    # At 55N, 1 degree longitude ~ 64 km, 1 degree latitude ~ 111 km
    # 0.13 deg lon * 64 km ~ 8.3 km width, 0.1 deg lat * 111 km ~ 11.1 km height
    # Area ~ 8.3 * 11.1 ~ 92 sq km  (well under 1000)
    # Let's make it bigger: 0.5 deg lon * 0.15 deg lat
    # 0.5 * 64 = 32 km, 0.15 * 111 = 16.65 km -> ~533 sq km
    # Increase to ~900: 0.7 deg lon * 0.18 deg lat
    # 0.7 * 64 = 44.8 km, 0.18 * 111 = 19.98 km -> ~895 sq km
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [-85.0, 55.0],
                [-84.3, 55.0],
                [-84.3, 55.18],
                [-85.0, 55.18],
                [-85.0, 55.0],
            ]
        ],
    }


def _write_and_load_geojson(tmp_path, filename, geojson):
    """Write a GeoJSON dict to a file in tmp_path and read it back.

    This helper verifies that the GeoJSON is valid JSON by round-tripping
    through file I/O.

    Args:
        tmp_path: Pytest tmp_path fixture providing a temporary directory.
        filename: Name for the temporary GeoJSON file.
        geojson: A dict representing a GeoJSON geometry.

    Returns:
        The parsed dict from the written file.
    """
    filepath = tmp_path / filename
    filepath.write_text(json.dumps(geojson))
    return json.loads(filepath.read_text())


# --- Valid polygon tests ---


def test_validate_small_polygon_returns_200(client_no_db):
    """Test that a valid small polygon returns HTTP 200."""
    response = client_no_db.post("/geometry", json=_small_polygon())
    assert response.status_code == 200


def test_validate_small_polygon_is_valid(client_no_db):
    """Test that a valid small polygon passes validation."""
    response = client_no_db.post("/geometry", json=_small_polygon())
    data = response.json()
    assert data["valid"] is True


def test_validate_small_polygon_response_structure(client_no_db):
    """Test that the response includes all expected fields."""
    response = client_no_db.post("/geometry", json=_small_polygon())
    data = response.json()
    assert "valid" in data
    assert "geometry_type" in data
    assert "crs" in data
    assert "area_sq_km" in data
    assert "max_area_sq_km" in data
    assert "errors" in data


def test_validate_small_polygon_metadata(client_no_db):
    """Test that response metadata is correct for a valid polygon."""
    response = client_no_db.post("/geometry", json=_small_polygon())
    data = response.json()
    assert data["geometry_type"] == "Polygon"
    assert data["crs"] == "EPSG:4326"
    assert data["max_area_sq_km"] == 1000.0
    assert data["errors"] == []


def test_validate_small_polygon_area_is_reasonable(client_no_db):
    """Test that the computed area for the small polygon is between 1 and 20 sq km."""
    response = client_no_db.post("/geometry", json=_small_polygon())
    data = response.json()
    assert 1 <= data["area_sq_km"] <= 20


def test_validate_small_polygon_via_file(client_no_db, tmp_path):
    """Test that a polygon round-tripped through a file validates correctly."""
    geojson = _write_and_load_geojson(tmp_path, "small.geojson", _small_polygon())
    response = client_no_db.post("/geometry", json=geojson)
    assert response.status_code == 200
    assert response.json()["valid"] is True


# --- MultiPolygon tests ---


def test_validate_multipolygon_valid(client_no_db):
    """Test that a valid MultiPolygon passes validation."""
    multipolygon = {
        "type": "MultiPolygon",
        "coordinates": [
            [
                [
                    [-85.0, 55.0],
                    [-85.03, 55.0],
                    [-85.03, 55.02],
                    [-85.0, 55.02],
                    [-85.0, 55.0],
                ]
            ],
            [
                [
                    [-84.0, 55.0],
                    [-84.03, 55.0],
                    [-84.03, 55.02],
                    [-84.0, 55.02],
                    [-84.0, 55.0],
                ]
            ],
        ],
    }
    response = client_no_db.post("/geometry", json=multipolygon)
    data = response.json()
    assert response.status_code == 200
    assert data["valid"] is True
    assert data["geometry_type"] == "MultiPolygon"


# --- Area limit tests ---


def test_validate_large_polygon_exceeds_area(client_no_db):
    """Test that a polygon exceeding 1000 sq km fails validation."""
    response = client_no_db.post("/geometry", json=_large_polygon())
    data = response.json()
    assert response.status_code == 200
    assert data["valid"] is False
    assert data["area_sq_km"] > 1000.0
    assert any("exceeds" in err for err in data["errors"])


def test_validate_polygon_near_limit_under(client_no_db):
    """Test that a polygon near but under the 1000 sq km limit passes."""
    response = client_no_db.post("/geometry", json=_exactly_at_limit_polygon())
    data = response.json()
    assert response.status_code == 200
    assert data["valid"] is True
    assert data["area_sq_km"] < 1000.0


# --- Invalid geometry type tests ---


def test_validate_point_rejected(client_no_db):
    """Test that a Point geometry is rejected with 422."""
    point = {"type": "Point", "coordinates": [-85.0, 55.0]}
    response = client_no_db.post("/geometry", json=point)
    assert response.status_code == 422


def test_validate_linestring_rejected(client_no_db):
    """Test that a LineString geometry is rejected with 422."""
    linestring = {
        "type": "LineString",
        "coordinates": [[-85.0, 55.0], [-84.0, 55.0]],
    }
    response = client_no_db.post("/geometry", json=linestring)
    assert response.status_code == 422


# --- Coordinate range tests ---


def test_validate_coordinates_out_of_longitude_range(client_no_db):
    """Test that coordinates with longitude outside [-180, 180] fail validation."""
    polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [200.0, 55.0],
                [201.0, 55.0],
                [201.0, 56.0],
                [200.0, 56.0],
                [200.0, 55.0],
            ]
        ],
    }
    response = client_no_db.post("/geometry", json=polygon)
    data = response.json()
    assert response.status_code == 200
    assert data["valid"] is False
    assert any("Longitude" in err for err in data["errors"])


def test_validate_coordinates_out_of_latitude_range(client_no_db):
    """Test that coordinates with latitude outside [-90, 90] fail validation."""
    polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [0.0, 95.0],
                [1.0, 95.0],
                [1.0, 96.0],
                [0.0, 96.0],
                [0.0, 95.0],
            ]
        ],
    }
    response = client_no_db.post("/geometry", json=polygon)
    data = response.json()
    assert response.status_code == 200
    assert data["valid"] is False
    assert any("Latitude" in err for err in data["errors"])


# --- Polygon with hole ---


def test_validate_polygon_with_hole(client_no_db):
    """Test that a polygon with an interior ring (hole) validates correctly."""
    polygon_with_hole = {
        "type": "Polygon",
        "coordinates": [
            [
                [-85.0, 55.0],
                [-85.05, 55.0],
                [-85.05, 55.05],
                [-85.0, 55.05],
                [-85.0, 55.0],
            ],
            [
                [-85.01, 55.01],
                [-85.04, 55.01],
                [-85.04, 55.04],
                [-85.01, 55.04],
                [-85.01, 55.01],
            ],
        ],
    }
    response = client_no_db.post("/geometry", json=polygon_with_hole)
    data = response.json()
    assert response.status_code == 200
    assert data["valid"] is True
    assert data["geometry_type"] == "Polygon"
    # Area should be small (outer ring minus hole)
    assert data["area_sq_km"] > 0


# --- Malformed request tests ---


def test_validate_empty_body_returns_422(client_no_db):
    """Test that an empty request body returns 422."""
    response = client_no_db.post("/geometry", json={})
    assert response.status_code == 422


def test_validate_missing_coordinates_returns_422(client_no_db):
    """Test that a geometry missing coordinates returns 422."""
    response = client_no_db.post("/geometry", json={"type": "Polygon"})
    assert response.status_code == 422


def test_validate_invalid_json_returns_422(client_no_db):
    """Test that invalid JSON in the request body returns 422."""
    response = client_no_db.post(
        "/geometry",
        content="not valid json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422
