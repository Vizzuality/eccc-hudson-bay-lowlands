"""Tests for layers endpoints."""

from sqlalchemy.orm import Session

from models import Layer

# =============================================================================
# Basic Endpoint Tests (No Fixtures)
# =============================================================================


def test_list_layers_returns_200(client):
    """Test that list layers endpoint returns 200 status code."""
    response = client.get("/layers/")
    assert response.status_code == 200


def test_list_layers_returns_empty_list(client):
    """Test that list layers returns empty list when no layers exist."""
    response = client.get("/layers/")
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 10
    assert data["pages"] == 0


def test_list_layers_pagination_validation(client):
    """Test that invalid pagination parameters are rejected."""
    # Page must be >= 1
    response = client.get("/layers/?page=0")
    assert response.status_code == 422

    # Size must be >= 1
    response = client.get("/layers/?size=0")
    assert response.status_code == 422

    # Size must be <= 100
    response = client.get("/layers/?size=101")
    assert response.status_code == 422


def test_response_structure_matches_schema(client):
    """Test that response structure matches PaginatedLayerResponse schema."""
    response = client.get("/layers/")
    data = response.json()

    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert "pages" in data

    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)
    assert isinstance(data["page"], int)
    assert isinstance(data["size"], int)
    assert isinstance(data["pages"], int)


# =============================================================================
# Create Endpoint Tests
# =============================================================================


def _valid_layer_payload(**overrides) -> dict:
    """Build a valid layer creation payload with optional overrides."""
    payload = {
        "type": "raster",
        "path": "/data/test.tif",
        "metadata": {
            "en": {"title": "Test Layer", "description": "A test layer"},
            "fr": {"title": "Couche test", "description": "Une couche de test"},
        },
    }
    payload.update(overrides)
    return payload


def test_create_layer_returns_201(client):
    """Test that create layer returns 201 status code."""
    response = client.post("/layers/", json=_valid_layer_payload())
    assert response.status_code == 201


def test_create_layer_returns_created_layer(client):
    """Test that create layer returns the created layer with id."""
    payload = _valid_layer_payload(units="celsius", legend={"type": "gradient", "colors": ["blue", "red"]})
    response = client.post("/layers/", json=payload)
    data = response.json()

    assert "id" in data
    assert isinstance(data["id"], int)
    assert data["type"] == payload["type"]
    assert data["path"] == payload["path"]
    assert data["units"] == payload["units"]
    assert data["legend"] == payload["legend"]
    assert data["metadata"] == payload["metadata"]


def test_create_layer_without_optional_fields(client):
    """Test that units, legend, and dataset_id are optional."""
    payload = _valid_layer_payload()
    response = client.post("/layers/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["units"] is None
    assert data["legend"] is None
    assert data["dataset_id"] is None


def test_create_layer_with_dataset_id(client, sample_dataset):
    """Test creating a layer linked to a dataset."""
    payload = _valid_layer_payload(dataset_id=sample_dataset.id)
    response = client.post("/layers/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["dataset_id"] == sample_dataset.id


def test_create_layer_validation_missing_type(client):
    """Test that type is required."""
    payload = _valid_layer_payload()
    del payload["type"]
    response = client.post("/layers/", json=payload)
    assert response.status_code == 422


def test_create_layer_validation_missing_path(client):
    """Test that path is required."""
    payload = _valid_layer_payload()
    del payload["path"]
    response = client.post("/layers/", json=payload)
    assert response.status_code == 422


def test_create_layer_validation_missing_metadata(client):
    """Test that metadata is required."""
    payload = _valid_layer_payload()
    del payload["metadata"]
    response = client.post("/layers/", json=payload)
    assert response.status_code == 422


def test_create_layer_rejects_missing_en_locale(client):
    """Test that metadata must include 'en' locale."""
    payload = _valid_layer_payload()
    payload["metadata"] = {
        "fr": {"title": "Couche", "description": "Une couche"},
    }
    response = client.post("/layers/", json=payload)
    assert response.status_code == 422


def test_create_layer_rejects_missing_fr_locale(client):
    """Test that metadata must include 'fr' locale."""
    payload = _valid_layer_payload()
    payload["metadata"] = {
        "en": {"title": "Layer", "description": "A layer"},
    }
    response = client.post("/layers/", json=payload)
    assert response.status_code == 422


def test_create_layer_rejects_incomplete_locale(client):
    """Test that each locale must have both title and description."""
    payload = _valid_layer_payload()
    payload["metadata"] = {
        "en": {"title": "Layer"},  # missing description
        "fr": {"title": "Couche", "description": "Une couche"},
    }
    response = client.post("/layers/", json=payload)
    assert response.status_code == 422


def test_create_layer_persists_to_database(client, db_session: Session):
    """Test that creating a layer actually persists it to the database."""
    payload = _valid_layer_payload(units="mm")
    response = client.post("/layers/", json=payload)
    assert response.status_code == 201
    created_id = response.json()["id"]

    db_layer = db_session.get(Layer, created_id)
    assert db_layer is not None
    assert db_layer.type == payload["type"]
    assert db_layer.path == payload["path"]
    assert db_layer.units == payload["units"]
    assert db_layer.metadata_ == payload["metadata"]


# =============================================================================
# Integration Tests with Single Layer Fixture
# =============================================================================


def test_list_layers_with_seeded_data(client, sample_layer: Layer):
    """Test that list endpoint returns seeded layer from fixture."""
    response = client.get("/layers/")
    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 1
    assert data["pages"] == 1
    assert len(data["items"]) == 1

    returned_layer = data["items"][0]
    assert returned_layer["id"] == sample_layer.id
    assert returned_layer["type"] == sample_layer.type
    assert returned_layer["path"] == sample_layer.path
    assert returned_layer["metadata"] == sample_layer.metadata_


def test_layer_response_fields_match_model(client, sample_layer: Layer):
    """Test that API response fields match the database model."""
    response = client.get("/layers/")
    data = response.json()

    item = data["items"][0]
    assert item["id"] == sample_layer.id
    assert item["type"] == sample_layer.type
    assert item["path"] == sample_layer.path
    assert item["units"] == sample_layer.units
    assert item["metadata"] == sample_layer.metadata_


# =============================================================================
# Pagination Integration Tests with Multiple Layers Fixture
# =============================================================================


def test_list_layers_pagination_total_count(client, sample_layers: list[Layer]):
    """Test that pagination correctly reports total count."""
    response = client.get("/layers/")
    data = response.json()

    assert data["total"] == 15
    assert data["pages"] == 2


def test_list_layers_pagination_first_page(client, sample_layers: list[Layer]):
    """Test that first page returns correct number of items."""
    response = client.get("/layers/?page=1&size=10")
    data = response.json()

    assert data["page"] == 1
    assert data["size"] == 10
    assert len(data["items"]) == 10
    assert data["total"] == 15
    assert data["pages"] == 2


def test_list_layers_pagination_second_page(client, sample_layers: list[Layer]):
    """Test that second page returns remaining items."""
    response = client.get("/layers/?page=2&size=10")
    data = response.json()

    assert data["page"] == 2
    assert data["size"] == 10
    assert len(data["items"]) == 5
    assert data["total"] == 15
    assert data["pages"] == 2


def test_list_layers_pagination_custom_size(client, sample_layers: list[Layer]):
    """Test pagination with custom page size."""
    response = client.get("/layers/?page=1&size=5")
    data = response.json()

    assert data["page"] == 1
    assert data["size"] == 5
    assert len(data["items"]) == 5
    assert data["total"] == 15
    assert data["pages"] == 3


def test_list_layers_pagination_beyond_total(client, sample_layers: list[Layer]):
    """Test that requesting page beyond total returns empty items."""
    response = client.get("/layers/?page=10&size=10")
    data = response.json()

    assert data["page"] == 10
    assert data["size"] == 10
    assert len(data["items"]) == 0
    assert data["total"] == 15
    assert data["pages"] == 2


def test_list_layers_all_fixtures_accessible(client, sample_layers: list[Layer]):
    """Test that all fixture layers can be retrieved via pagination."""
    response = client.get("/layers/?page=1&size=100")
    data = response.json()

    assert data["total"] == 15
    assert len(data["items"]) == 15

    fixture_ids = {layer.id for layer in sample_layers}
    response_ids = {item["id"] for item in data["items"]}
    assert fixture_ids == response_ids


def test_list_layers_pages_calculation(client, sample_layers: list[Layer]):
    """Test that pages calculation is correct for different sizes."""
    # 15 items with size 7 should give 3 pages (7 + 7 + 1)
    response = client.get("/layers/?size=7")
    data = response.json()
    assert data["pages"] == 3

    # 15 items with size 15 should give 1 page
    response = client.get("/layers/?size=15")
    data = response.json()
    assert data["pages"] == 1


# =============================================================================
# Fixture Isolation Tests
# =============================================================================


def test_fixture_isolation_between_tests(client):
    """Test that fixtures from other tests don't leak into this test."""
    response = client.get("/layers/")
    data = response.json()

    assert data["total"] == 0
    assert data["items"] == []
