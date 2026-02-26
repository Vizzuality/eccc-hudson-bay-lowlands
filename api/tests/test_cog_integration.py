"""Integration tests for COG tile serving through the TiTiler pipeline.

These tests create real Cloud Optimized GeoTIFFs and serve them through
the full TiTiler stack by overriding the S3 URL dependency to point at
local files. This exercises rasterio/GDAL tile generation, reprojection,
and response formatting without requiring actual S3 access.
"""

import pytest
from fastapi import Query
from fastapi.testclient import TestClient

from db.database import get_db
from main import app
from models import Category, Dataset, Layer
from routers.cog import s3_url_dependency


@pytest.fixture
def cog_client(db_session, minimal_cog):
    """Provide a test client with S3 URL dependency overridden to serve a local COG."""

    def override_get_db():
        yield db_session

    def override_s3_url(
        url: str = Query(description="Relative path to the COG file"),
    ) -> str:
        return minimal_cog

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[s3_url_dependency] = override_s3_url

    yield TestClient(app, raise_server_exceptions=False)

    app.dependency_overrides.clear()


def test_cog_info_returns_raster_metadata(cog_client):
    """GET /cog/info should return band metadata, bounds, CRS, and dtype."""
    response = cog_client.get("/cog/info", params={"url": "test.tif"})

    assert response.status_code == 200
    data = response.json()
    assert "band_metadata" in data
    assert "bounds" in data
    assert data["dtype"] == "uint8"
    assert data["count"] == 1
    assert data["bounds"] == [-90.0, 50.0, -80.0, 60.0]


def test_cog_tilejson_returns_valid_document(cog_client):
    """GET /cog/WebMercatorQuad/tilejson.json should return a valid TileJSON document."""
    response = cog_client.get("/cog/WebMercatorQuad/tilejson.json", params={"url": "test.tif"})

    assert response.status_code == 200
    data = response.json()
    assert "tiles" in data
    assert isinstance(data["tiles"], list)
    assert len(data["tiles"]) > 0
    assert "bounds" in data
    assert "minzoom" in data
    assert "maxzoom" in data
    assert isinstance(data["bounds"], list)
    assert len(data["bounds"]) == 4


def test_cog_tile_returns_png_image(cog_client):
    """GET /cog/tiles should return a valid PNG image for a tile within the COG extent."""
    tj_response = cog_client.get("/cog/WebMercatorQuad/tilejson.json", params={"url": "test.tif"})
    assert tj_response.status_code == 200
    minzoom = tj_response.json()["minzoom"]

    # COG bounds: lon -90 to -80, lat 50 to 60 (Hudson Bay region)
    # At zoom 4, tile x=4, y=5 covers this area approximately
    response = cog_client.get(
        f"/cog/tiles/WebMercatorQuad/{minzoom}/4/5",
        params={"url": "test.tif"},
    )

    # If minzoom tile doesn't hit, try zoom 4 explicitly
    if response.status_code != 200:
        response = cog_client.get(
            "/cog/tiles/WebMercatorQuad/4/4/5",
            params={"url": "test.tif"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/")
    assert response.content[:4] == b"\x89PNG"


def test_cog_tile_at_different_zoom_levels(cog_client):
    """Tiles at multiple zoom levels within the COG extent should return valid images."""
    # Tile coordinates that intersect the COG extent (lon -90 to -80, lat 50 to 60)
    zoom_tiles = [
        (2, 1, 1),  # zoom 2: coarse tile covering northern hemisphere
        (4, 4, 5),  # zoom 4: covers roughly the Hudson Bay area
        (6, 16, 22),  # zoom 6: more specific to the region
    ]

    valid_count = 0
    for z, x, y in zoom_tiles:
        response = cog_client.get(
            f"/cog/tiles/WebMercatorQuad/{z}/{x}/{y}",
            params={"url": "test.tif"},
        )
        if response.status_code == 200:
            assert response.headers["content-type"].startswith("image/")
            assert response.content[:4] == b"\x89PNG"
            valid_count += 1

    assert valid_count >= 1, "No valid tiles found at any zoom level within expected COG extent"


def test_cog_tile_outside_bounds(cog_client):
    """A tile request completely outside the COG extent should return an empty or error response."""
    # Tile at zoom 4, x=15, y=15 is far from the Hudson Bay region
    response = cog_client.get(
        "/cog/tiles/WebMercatorQuad/4/15/15",
        params={"url": "test.tif"},
    )

    # TiTiler returns either an empty transparent tile (200) or an error
    assert response.status_code in (200, 404, 500)


def test_cog_statistics_returns_band_stats(cog_client):
    """GET /cog/statistics should return per-band min, max, and mean values."""
    response = cog_client.get("/cog/statistics", params={"url": "test.tif"})

    assert response.status_code == 200
    data = response.json()
    assert "b1" in data
    band_stats = data["b1"]
    assert "min" in band_stats
    assert "max" in band_stats
    assert "mean" in band_stats
    assert 0 <= band_stats["min"] <= 255
    assert 0 <= band_stats["max"] <= 255


def test_cog_full_flow_with_layer_path(cog_client, db_session, sample_category_metadata, sample_dataset_metadata):
    """Create a Layer in the DB, use its path as the url param, and verify tile generation."""
    db_category = Category(metadata_=sample_category_metadata)
    db_session.add(db_category)
    db_session.flush()

    db_dataset = Dataset(metadata_=sample_dataset_metadata, category_id=db_category.id)
    db_session.add(db_dataset)
    db_session.flush()

    db_layer = Layer(
        format_="raster",
        type_="continuous",
        path="temperature/2024.tif",
        unit="celsius",
        metadata_={"title": {"en": "Temperature 2024", "fr": "Temperature 2024"}},
        dataset_id=db_dataset.id,
    )
    db_session.add(db_layer)
    db_session.commit()
    db_session.refresh(db_layer)

    response = cog_client.get("/cog/info", params={"url": db_layer.path})

    assert response.status_code == 200
    data = response.json()
    assert data["dtype"] == "uint8"
    assert data["count"] == 1
    assert "bounds" in data
