"""Tests for rasters endpoints."""

from sqlalchemy.orm import Session

from models import Raster

# =============================================================================
# Basic Endpoint Tests (No Fixtures)
# =============================================================================


def test_list_rasters_returns_200(client):
    """Test that list rasters endpoint returns 200 status code."""
    response = client.get("/rasters/")
    assert response.status_code == 200


def test_list_rasters_returns_empty_list(client):
    """Test that list rasters returns empty list when no rasters exist."""
    response = client.get("/rasters/")
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 10
    assert data["pages"] == 0


def test_list_rasters_pagination_validation(client):
    """Test that invalid pagination parameters are rejected."""
    # Page must be >= 1
    response = client.get("/rasters/?page=0")
    assert response.status_code == 422

    # Size must be >= 1
    response = client.get("/rasters/?size=0")
    assert response.status_code == 422

    # Size must be <= 100
    response = client.get("/rasters/?size=101")
    assert response.status_code == 422


def test_response_structure_matches_schema(client):
    """Test that response structure matches PaginatedRasterResponse schema."""
    response = client.get("/rasters/")
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


def test_create_raster_returns_201(client):
    """Test that create raster returns 201 status code."""
    raster_data = {
        "name": "Test Raster",
        "crs": "EPSG:4326",
        "path": "/data/test.tif",
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 201


def test_create_raster_returns_created_raster(client):
    """Test that create raster returns the created raster with id."""
    raster_data = {
        "name": "Test Raster",
        "crs": "EPSG:4326",
        "path": "/data/test.tif",
        "description": "A test raster",
    }
    response = client.post("/rasters/", json=raster_data)
    data = response.json()

    assert "id" in data
    assert isinstance(data["id"], int)
    assert data["name"] == raster_data["name"]
    assert data["crs"] == raster_data["crs"]
    assert data["path"] == raster_data["path"]
    assert data["description"] == raster_data["description"]


def test_create_raster_without_description(client):
    """Test that description is optional when creating a raster."""
    raster_data = {
        "name": "Minimal Raster",
        "crs": "EPSG:32618",
        "path": "/data/minimal.tif",
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 201
    data = response.json()
    assert data["description"] is None


def test_create_raster_validation_missing_name(client):
    """Test that name is required."""
    raster_data = {
        "crs": "EPSG:4326",
        "path": "/data/test.tif",
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 422


def test_create_raster_validation_missing_crs(client):
    """Test that crs is required."""
    raster_data = {
        "name": "Test Raster",
        "path": "/data/test.tif",
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 422


def test_create_raster_validation_missing_path(client):
    """Test that path is required."""
    raster_data = {
        "name": "Test Raster",
        "crs": "EPSG:4326",
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 422


def test_create_raster_persists_to_database(client, db_session: Session):
    """Test that creating a raster actually persists it to the database."""
    raster_data = {
        "name": "Persisted Raster",
        "crs": "EPSG:4326",
        "path": "/data/persisted.tif",
        "description": "Should be in the database",
    }
    response = client.post("/rasters/", json=raster_data)
    assert response.status_code == 201
    created_id = response.json()["id"]

    # Verify directly in database using the session
    db_raster = db_session.get(Raster, created_id)
    assert db_raster is not None
    assert db_raster.name == raster_data["name"]
    assert db_raster.crs == raster_data["crs"]
    assert db_raster.path == raster_data["path"]
    assert db_raster.description == raster_data["description"]


# =============================================================================
# Integration Tests with Single Raster Fixture
# =============================================================================


def test_list_rasters_with_seeded_data(client, sample_raster: Raster):
    """Test that list endpoint returns seeded raster from fixture."""
    response = client.get("/rasters/")
    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 1
    assert data["pages"] == 1
    assert len(data["items"]) == 1

    # Verify the returned raster matches the fixture
    returned_raster = data["items"][0]
    assert returned_raster["id"] == sample_raster.id
    assert returned_raster["name"] == sample_raster.name
    assert returned_raster["crs"] == sample_raster.crs
    assert returned_raster["path"] == sample_raster.path
    assert returned_raster["description"] == sample_raster.description


def test_raster_response_fields_match_model(client, sample_raster: Raster):
    """Test that API response fields match the database model."""
    response = client.get("/rasters/")
    data = response.json()

    item = data["items"][0]

    # All model fields should be present and match
    assert item["id"] == sample_raster.id
    assert item["name"] == sample_raster.name
    assert item["crs"] == sample_raster.crs
    assert item["path"] == sample_raster.path
    assert item["description"] == sample_raster.description


# =============================================================================
# Pagination Integration Tests with Multiple Rasters Fixture
# =============================================================================


def test_list_rasters_pagination_total_count(client, sample_rasters: list[Raster]):
    """Test that pagination correctly reports total count."""
    response = client.get("/rasters/")
    data = response.json()

    assert data["total"] == 15
    assert data["pages"] == 2  # 15 items / 10 per page = 2 pages


def test_list_rasters_pagination_first_page(client, sample_rasters: list[Raster]):
    """Test that first page returns correct number of items."""
    response = client.get("/rasters/?page=1&size=10")
    data = response.json()

    assert data["page"] == 1
    assert data["size"] == 10
    assert len(data["items"]) == 10
    assert data["total"] == 15
    assert data["pages"] == 2


def test_list_rasters_pagination_second_page(client, sample_rasters: list[Raster]):
    """Test that second page returns remaining items."""
    response = client.get("/rasters/?page=2&size=10")
    data = response.json()

    assert data["page"] == 2
    assert data["size"] == 10
    assert len(data["items"]) == 5  # 15 total - 10 on first page
    assert data["total"] == 15
    assert data["pages"] == 2


def test_list_rasters_pagination_custom_size(client, sample_rasters: list[Raster]):
    """Test pagination with custom page size."""
    response = client.get("/rasters/?page=1&size=5")
    data = response.json()

    assert data["page"] == 1
    assert data["size"] == 5
    assert len(data["items"]) == 5
    assert data["total"] == 15
    assert data["pages"] == 3  # 15 items / 5 per page = 3 pages


def test_list_rasters_pagination_last_page(client, sample_rasters: list[Raster]):
    """Test that requesting last page returns correct items."""
    response = client.get("/rasters/?page=3&size=5")
    data = response.json()

    assert data["page"] == 3
    assert data["size"] == 5
    assert len(data["items"]) == 5
    assert data["total"] == 15
    assert data["pages"] == 3


def test_list_rasters_pagination_beyond_total(client, sample_rasters: list[Raster]):
    """Test that requesting page beyond total returns empty items."""
    response = client.get("/rasters/?page=10&size=10")
    data = response.json()

    assert data["page"] == 10
    assert data["size"] == 10
    assert len(data["items"]) == 0
    assert data["total"] == 15
    assert data["pages"] == 2


def test_list_rasters_all_fixtures_accessible(client, sample_rasters: list[Raster]):
    """Test that all fixture rasters can be retrieved via pagination."""
    # Request all items with large page size
    response = client.get("/rasters/?page=1&size=100")
    data = response.json()

    assert data["total"] == 15
    assert len(data["items"]) == 15

    # Verify all fixture IDs are present in response
    fixture_ids = {r.id for r in sample_rasters}
    response_ids = {item["id"] for item in data["items"]}
    assert fixture_ids == response_ids


def test_list_rasters_fixture_data_integrity(client, sample_rasters: list[Raster]):
    """Test that all returned rasters match their corresponding fixtures."""
    response = client.get("/rasters/?page=1&size=100")
    data = response.json()

    # Create lookup from fixture data
    fixture_lookup = {r.id: r for r in sample_rasters}

    for item in data["items"]:
        fixture = fixture_lookup[item["id"]]
        assert item["name"] == fixture.name
        assert item["crs"] == fixture.crs
        assert item["path"] == fixture.path
        assert item["description"] == fixture.description


def test_list_rasters_pages_calculation(client, sample_rasters: list[Raster]):
    """Test that pages calculation is correct for different sizes."""
    # 15 items with size 7 should give 3 pages (7 + 7 + 1)
    response = client.get("/rasters/?size=7")
    data = response.json()
    assert data["pages"] == 3

    # 15 items with size 15 should give 1 page
    response = client.get("/rasters/?size=15")
    data = response.json()
    assert data["pages"] == 1

    # 15 items with size 16 should give 1 page
    response = client.get("/rasters/?size=16")
    data = response.json()
    assert data["pages"] == 1


# =============================================================================
# Database State Verification Tests
# =============================================================================


def test_create_multiple_rasters_database_state(client, db_session: Session):
    """Test that creating multiple rasters updates database correctly."""
    rasters_to_create = [
        {"name": "Raster A", "crs": "EPSG:4326", "path": "/data/a.tif"},
        {"name": "Raster B", "crs": "EPSG:32618", "path": "/data/b.tif"},
        {"name": "Raster C", "crs": "EPSG:3857", "path": "/data/c.tif"},
    ]

    created_ids = []
    for raster_data in rasters_to_create:
        response = client.post("/rasters/", json=raster_data)
        assert response.status_code == 201
        created_ids.append(response.json()["id"])

    # Verify database state directly
    for i, raster_id in enumerate(created_ids):
        db_raster = db_session.get(Raster, raster_id)
        assert db_raster is not None
        assert db_raster.name == rasters_to_create[i]["name"]
        assert db_raster.crs == rasters_to_create[i]["crs"]
        assert db_raster.path == rasters_to_create[i]["path"]


def test_fixture_rasters_exist_in_database(db_session: Session, sample_rasters: list[Raster]):
    """Test that fixture rasters actually exist in the database."""
    for fixture_raster in sample_rasters:
        db_raster = db_session.get(Raster, fixture_raster.id)
        assert db_raster is not None
        assert db_raster.name == fixture_raster.name
        assert db_raster.crs == fixture_raster.crs
        assert db_raster.path == fixture_raster.path
        assert db_raster.description == fixture_raster.description


def test_fixture_isolation_between_tests(client):
    """Test that fixtures from other tests don't leak into this test."""
    # This test deliberately has no fixtures
    # If isolation is working, the database should be empty
    response = client.get("/rasters/")
    data = response.json()

    assert data["total"] == 0
    assert data["items"] == []
