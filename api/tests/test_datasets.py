"""Tests for datasets endpoints."""


# =============================================================================
# List Datasets - Basic Tests
# =============================================================================


def test_list_datasets_returns_200(client):
    response = client.get("/datasets/")
    assert response.status_code == 200


def test_list_datasets_returns_empty_list(client):
    response = client.get("/datasets/")
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 0


def test_list_datasets_returns_dataset(client, dataset):
    response = client.get("/datasets/")
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1


def test_list_datasets_response_structure(client, dataset):
    response = client.get("/datasets/")
    data = response.json()
    assert "data" in data
    assert "total" in data
    item = data["data"][0]
    assert "id" in item
    assert "metadata" in item
    assert "category_id" in item


def test_list_datasets_metadata_bilingual(client, dataset):
    response = client.get("/datasets/")
    data = response.json()
    metadata = data["data"][0]["metadata"]

    assert "title" in metadata
    assert metadata["title"]["en"] == "Test Dataset"
    assert metadata["title"]["fr"] == "Jeu de donnees de test"


# =============================================================================
# List Datasets - Pagination Tests
# =============================================================================


def test_list_datasets_pagination(client, multiple_datasets):
    response = client.get("/datasets/?offset=2&limit=2")
    data = response.json()
    assert len(data["data"]) == 2
    assert data["total"] == 5


# =============================================================================
# List Datasets - Search Tests
# =============================================================================


def test_list_datasets_search_by_english_title(client, searchable_datasets):
    response = client.get("/datasets/?search=Climate")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["title"]["en"] == "Climate Observations"


def test_list_datasets_search_by_french_title(client, searchable_datasets):
    response = client.get("/datasets/?search=faune")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["title"]["fr"] == "Suivi de la faune"


def test_list_datasets_search_case_insensitive(client, searchable_datasets):
    response = client.get("/datasets/?search=climate")
    data = response.json()
    assert data["total"] == 1


# =============================================================================
# List Datasets - Filter by Category
# =============================================================================


def test_list_datasets_filter_by_category(client, dataset, category):
    response = client.get(f"/datasets/?category_id={category.id}")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["category_id"] == category.id


def test_list_datasets_filter_by_nonexistent_category(client, dataset):
    response = client.get("/datasets/?category_id=99999")
    data = response.json()
    assert data["total"] == 0
    assert data["data"] == []


# =============================================================================
# List Datasets - Include Layers
# =============================================================================


def test_list_datasets_include_layers_false(client, dataset):
    response = client.get("/datasets/")
    data = response.json()
    item = data["data"][0]
    assert "layers" not in item


def test_list_datasets_include_layers_true(client, layer_with_dataset):
    response = client.get("/datasets/?include_layers=true")
    data = response.json()
    item = data["data"][0]
    assert "layers" in item
    assert isinstance(item["layers"], list)


def test_list_datasets_include_layers_with_data(client, layer_with_dataset):
    response = client.get("/datasets/?include_layers=true")
    data = response.json()
    item = data["data"][0]
    layer = item["layers"][0]
    assert layer["id"] == layer_with_dataset.id
    assert layer["format"] == layer_with_dataset.format_
    assert layer["path"] == layer_with_dataset.path


# =============================================================================
# Get Dataset by ID
# =============================================================================


def test_get_dataset_returns_200(client, dataset):
    response = client.get(f"/datasets/{dataset.id}")
    assert response.status_code == 200


def test_get_dataset_returns_404(client):
    response = client.get("/datasets/99999")
    assert response.status_code == 404


def test_get_dataset_include_layers(client, layer_with_dataset, dataset):
    response = client.get(f"/datasets/{dataset.id}?include_layers=true")
    data = response.json()
    assert "layers" in data
    assert len(data["layers"]) == 1
