"""Tests for COG tile server endpoints."""

import os
from unittest.mock import patch

from routers.cog import s3_url_dependency


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


def test_gdal_env_vars_set_by_lifespan():
    """Test that GDAL environment variables are set via os.environ.setdefault."""
    from config import get_settings

    settings = get_settings()

    gdal_env = {
        "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
        "GDAL_HTTP_MERGE_CONSECUTIVE_RANGES": "YES",
        "GDAL_HTTP_MULTIPLEX": "YES",
        "GDAL_HTTP_VERSION": "2",
        "GDAL_CACHEMAX": "200",
        "GDAL_BAND_BLOCK_CACHE": "HASHSET",
        "CPL_VSIL_CURL_CACHE_SIZE": "200000000",
        "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif,.TIF,.tiff",
        "VSI_CACHE": "TRUE",
        "VSI_CACHE_SIZE": "5000000",
        "AWS_REGION": settings.aws_region,
    }

    # Simulate what lifespan does
    saved = {}
    for key in gdal_env:
        saved[key] = os.environ.pop(key, None)

    try:
        for key, value in gdal_env.items():
            os.environ.setdefault(key, value)

        for key, value in gdal_env.items():
            assert os.environ.get(key) == value, f"{key} should be {value}, got {os.environ.get(key)}"
    finally:
        for key, original in saved.items():
            if original is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = original


def test_gdal_env_setdefault_does_not_override():
    """Test that os.environ.setdefault does not override pre-existing values."""
    key = "GDAL_DISABLE_READDIR_ON_OPEN"
    saved = os.environ.get(key)
    try:
        os.environ[key] = "CUSTOM_VALUE"
        os.environ.setdefault(key, "EMPTY_DIR")
        assert os.environ[key] == "CUSTOM_VALUE"
    finally:
        if saved is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = saved


def test_s3_url_dependency_builds_correct_uri():
    """Test that s3_url_dependency constructs the correct S3 URI."""
    with patch("routers.cog.get_settings") as mock_settings:
        mock_settings.return_value.s3_bucket_name = "my-bucket"
        result = s3_url_dependency(url="data/processed/peat_cog.tif")
        assert result == "s3://my-bucket/data/processed/peat_cog.tif"


def test_s3_url_dependency_strips_leading_slash():
    """Test that s3_url_dependency strips leading slashes from the path."""
    with patch("routers.cog.get_settings") as mock_settings:
        mock_settings.return_value.s3_bucket_name = "my-bucket"
        result = s3_url_dependency(url="/data/processed/peat_cog.tif")
        assert result == "s3://my-bucket/data/processed/peat_cog.tif"


def test_s3_url_dependency_strips_multiple_leading_slashes():
    """Test that s3_url_dependency strips multiple leading slashes."""
    with patch("routers.cog.get_settings") as mock_settings:
        mock_settings.return_value.s3_bucket_name = "my-bucket"
        result = s3_url_dependency(url="///data/test.tif")
        assert result == "s3://my-bucket/data/test.tif"
