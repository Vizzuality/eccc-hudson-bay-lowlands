"""Tests for COG tile server endpoints."""


def test_cog_tilejson_endpoint_exists(client):
    """Test that COG tilejson endpoint is mounted and accessible."""
    # tilejson requires a tileMatrixSetId in the path
    response = client.get("/cog/WebMercatorQuad/tilejson.json?url=https://example.com/test.tif")
    # We expect an error because the URL is invalid, but the endpoint should exist
    # A 500 or 4xx error (not 404) indicates the endpoint is properly mounted
    assert response.status_code != 404


def test_cog_tiles_endpoint_exists(client):
    """Test that COG tiles endpoint is mounted and accessible."""
    # Check the tiles endpoint path exists (returns 422 for missing params)
    response = client.get("/cog/tiles/WebMercatorQuad/0/0/0")
    assert response.status_code in (422, 500)  # Missing url param or server error


def test_root_endpoint(client):
    """Test that root endpoint returns API information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "cog" in data
    assert data["cog"] == "/cog"
    assert data["layers"] == "/layers"
    assert data["categories"] == "/categories"
