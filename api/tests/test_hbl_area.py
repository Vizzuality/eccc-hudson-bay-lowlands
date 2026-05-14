"""Tests for the GET /hbl-area endpoint."""


def test_hbl_area_returns_200(client):
    response = client.get("/hbl-area")
    assert response.status_code == 200


def test_hbl_area_returns_geojson_feature(client):
    """Response must be a valid GeoJSON Feature with a polygonal geometry."""
    body = client.get("/hbl-area").json()
    assert body["type"] == "Feature"
    assert body["geometry"]["type"] in ("Polygon", "MultiPolygon")
    assert isinstance(body["geometry"]["coordinates"], list)


def test_hbl_area_coordinates_are_wgs84_degrees(client):
    """Every coordinate must fall in valid WGS84 ranges (lon ∈ [-180, 180], lat ∈ [-90, 90])."""
    body = client.get("/hbl-area").json()
    geom = body["geometry"]

    if geom["type"] == "Polygon":
        rings = geom["coordinates"]
    else:  # MultiPolygon
        rings = [ring for poly in geom["coordinates"] for ring in poly]

    for ring in rings:
        for lon, lat in ring:
            assert -180.0 <= lon <= 180.0, f"lon out of range: {lon}"
            assert -90.0 <= lat <= 90.0, f"lat out of range: {lat}"


def test_hbl_area_response_omits_crs_member(client):
    """RFC 7946 deprecated the GeoJSON ``crs`` member — the response shouldn't include it."""
    body = client.get("/hbl-area").json()
    assert "crs" not in body


def test_hbl_area_matches_test_fixture_bounds(client):
    """The test conftest points HBL_SHAPE_PATH at the bbox-equivalent fixture (-117..-51, 45..69)."""
    body = client.get("/hbl-area").json()
    coords = body["geometry"]["coordinates"][0]  # outer ring of the test Polygon fixture
    lons = [pt[0] for pt in coords]
    lats = [pt[1] for pt in coords]
    assert min(lons) == -117.0
    assert max(lons) == -51.0
    assert min(lats) == 45.0
    assert max(lats) == 69.0
