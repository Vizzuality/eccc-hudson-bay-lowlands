"""Tests for layers endpoints."""


# =============================================================================
# List Layers - Basic Tests
# =============================================================================


def test_list_layers_returns_200(client):
    response = client.get("/layers/")
    assert response.status_code == 200


def test_list_layers_returns_empty_list(client):
    response = client.get("/layers/")
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 0


def test_list_layers_pagination_validation(client):
    # offset < 0
    response = client.get("/layers/?offset=-1")
    assert response.status_code == 422
    # limit < 1
    response = client.get("/layers/?limit=0")
    assert response.status_code == 422
    # limit > 100
    response = client.get("/layers/?limit=101")
    assert response.status_code == 422


def test_list_layers_returns_layer(client, layer):
    response = client.get("/layers/")
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1


def test_list_layers_response_structure(client, layer):
    response = client.get("/layers/")
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert isinstance(data["data"], list)
    assert isinstance(data["total"], int)


def test_list_layers_layer_fields(client, layer):
    response = client.get("/layers/")
    data = response.json()
    item = data["data"][0]

    assert item["id"] == layer.id
    assert item["format"] == layer.format_
    assert item["type"] == layer.type_
    assert item["path"] == layer.path
    assert item["unit"] == layer.unit
    assert item["categories"] == layer.categories
    assert item["dataset_id"] == layer.dataset_id


def test_list_layers_metadata_bilingual(client, layer):
    response = client.get("/layers/")
    data = response.json()
    metadata = data["data"][0]["metadata"]

    assert "title" in metadata
    assert metadata["title"]["en"] == "Test Layer"
    assert metadata["title"]["fr"] == "Couche de test"


# =============================================================================
# List Layers - Pagination Tests
# =============================================================================


def test_list_layers_pagination_offset(client, multiple_layers):
    response = client.get("/layers/?offset=5&limit=5")
    data = response.json()
    assert len(data["data"]) == 5


def test_list_layers_pagination_limit(client, multiple_layers):
    response = client.get("/layers/?limit=3")
    data = response.json()
    assert len(data["data"]) == 3


def test_list_layers_pagination_total_count(client, multiple_layers):
    response = client.get("/layers/?offset=0&limit=5")
    data = response.json()
    assert data["total"] == 15


def test_list_layers_pagination_beyond_total(client, multiple_layers):
    response = client.get("/layers/?offset=100&limit=10")
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 15


# =============================================================================
# List Layers - Search Tests
# =============================================================================


def test_list_layers_search_by_english_title(client, searchable_layers):
    response = client.get("/layers/?search=Hudson")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["title"]["en"] == "Hudson Bay Temperature"


def test_list_layers_search_by_french_title(client, searchable_layers):
    response = client.get("/layers/?search=glace")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["title"]["fr"] == "Couverture de glace arctique"


def test_list_layers_search_case_insensitive(client, searchable_layers):
    response = client.get("/layers/?search=hudson")
    data = response.json()
    assert data["total"] == 1


def test_list_layers_search_no_results(client, searchable_layers):
    response = client.get("/layers/?search=nonexistent")
    data = response.json()
    assert data["total"] == 0
    assert data["data"] == []


def test_list_layers_search_partial_match(client, searchable_layers):
    response = client.get("/layers/?search=Temp")
    data = response.json()
    assert data["total"] == 1
    assert "Temperature" in data["data"][0]["metadata"]["title"]["en"]


def test_list_layers_search_with_pagination(client, searchable_layers):
    response = client.get("/layers/?search=Temp&offset=0&limit=1")
    data = response.json()
    assert len(data["data"]) == 1
    assert data["total"] == 1


# =============================================================================
# Get Layer by ID
# =============================================================================


def test_get_layer_returns_200(client, layer):
    response = client.get(f"/layers/{layer.id}")
    assert response.status_code == 200


def test_get_layer_returns_correct_data(client, layer):
    response = client.get(f"/layers/{layer.id}")
    data = response.json()

    assert data["id"] == layer.id
    assert data["format"] == layer.format_
    assert data["type"] == layer.type_
    assert data["path"] == layer.path
    assert data["unit"] == layer.unit
    assert data["categories"] == layer.categories
    assert data["dataset_id"] == layer.dataset_id


def test_get_layer_returns_404(client):
    response = client.get("/layers/99999")
    assert response.status_code == 404


def test_get_layer_metadata_bilingual(client, layer):
    response = client.get(f"/layers/{layer.id}")
    data = response.json()
    metadata = data["metadata"]

    assert metadata["title"]["en"] == "Test Layer"
    assert metadata["title"]["fr"] == "Couche de test"
