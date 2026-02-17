"""Tests for datasets endpoints."""


# =============================================================================
# List Datasets - Basic Tests
# =============================================================================


def test_list_datasets_returns_200(client):
    """Test that list datasets endpoint returns 200 status code."""
    response = client.get("/datasets/")
    assert response.status_code == 200


def test_list_datasets_returns_empty_list(client):
    """Test that list datasets returns empty list when no datasets exist."""
    response = client.get("/datasets/")
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 0


def test_list_datasets_returns_dataset(client, dataset):
    """Test that list endpoint returns seeded dataset from fixture."""
    response = client.get("/datasets/")
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1


def test_list_datasets_response_structure(client, dataset):
    """Test that response structure matches PaginatedDatasetResponse schema."""
    response = client.get("/datasets/")
    data = response.json()

    assert "data" in data
    assert "total" in data
    assert isinstance(data["data"], list)
    assert isinstance(data["total"], int)


def test_list_datasets_metadata_bilingual(client, dataset):
    """Test that metadata contains both en and fr locales."""
    response = client.get("/datasets/")
    data = response.json()
    metadata = data["data"][0]["metadata"]

    assert "en" in metadata
    assert "fr" in metadata
    assert metadata["en"]["title"] == "Test Dataset"
    assert metadata["fr"]["title"] == "Jeu de donnees de test"


# =============================================================================
# List Datasets - Pagination Tests
# =============================================================================


def test_list_datasets_pagination(client, multiple_datasets):
    """Test that offset/limit pagination works correctly."""
    response = client.get("/datasets/?offset=2&limit=2")
    data = response.json()
    assert len(data["data"]) == 2
    assert data["total"] == 5


# =============================================================================
# List Datasets - Search Tests
# =============================================================================


def test_list_datasets_search_by_english_title(client, searchable_datasets):
    """Test that search matches English title."""
    response = client.get("/datasets/?search=Climate")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["en"]["title"] == "Climate Observations"


def test_list_datasets_search_by_french_title(client, searchable_datasets):
    """Test that search matches French title."""
    response = client.get("/datasets/?search=faune")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["fr"]["title"] == "Suivi de la faune"


def test_list_datasets_search_case_insensitive(client, searchable_datasets):
    """Test that search is case-insensitive."""
    response = client.get("/datasets/?search=climate")
    data = response.json()
    assert data["total"] == 1


# =============================================================================
# List Datasets - include_layers Tests
# =============================================================================


def test_list_datasets_include_layers_false(client, dataset):
    """Test that default response has no layers key."""
    response = client.get("/datasets/")
    data = response.json()
    item = data["data"][0]
    assert "layers" not in item


def test_list_datasets_include_layers_true(client, dataset):
    """Test that include_layers=true response includes layers array."""
    response = client.get("/datasets/?include_layers=true")
    data = response.json()
    item = data["data"][0]
    assert "layers" in item
    assert isinstance(item["layers"], list)


def test_list_datasets_include_layers_with_data(client, layer_with_dataset):
    """Test that layers array contains correct layer data."""
    # layer_with_dataset fixture creates both a dataset and a layer belonging to it
    response = client.get("/datasets/?include_layers=true")
    data = response.json()
    item = data["data"][0]

    assert len(item["layers"]) == 1
    layer = item["layers"][0]
    assert layer["id"] == layer_with_dataset.id
    assert layer["type"] == layer_with_dataset.type
    assert layer["path"] == layer_with_dataset.path


# =============================================================================
# Get Dataset by ID
# =============================================================================


def test_get_dataset_returns_200(client, dataset):
    """Test that get dataset endpoint returns 200."""
    response = client.get(f"/datasets/{dataset.id}")
    assert response.status_code == 200


def test_get_dataset_returns_404(client):
    """Test that nonexistent dataset returns 404."""
    response = client.get("/datasets/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Dataset not found"


def test_get_dataset_include_layers(client, layer_with_dataset):
    """Test that get dataset with include_layers returns layers."""
    dataset_id = layer_with_dataset.dataset_id
    response = client.get(f"/datasets/{dataset_id}?include_layers=true")
    data = response.json()

    assert "layers" in data
    assert len(data["layers"]) == 1
    assert data["layers"][0]["id"] == layer_with_dataset.id
