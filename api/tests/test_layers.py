"""Tests for layers endpoints."""


# =============================================================================
# List Layers - Basic Tests
# =============================================================================


def test_list_layers_returns_200(client):
    """Test that list layers endpoint returns 200 status code."""
    response = client.get("/layers/")
    assert response.status_code == 200


def test_list_layers_returns_empty_list(client):
    """Test that list layers returns empty list when no layers exist."""
    response = client.get("/layers/")
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 0


def test_list_layers_pagination_validation(client):
    """Test that invalid pagination parameters are rejected."""
    # offset must be >= 0
    response = client.get("/layers/?offset=-1")
    assert response.status_code == 422

    # limit must be >= 1
    response = client.get("/layers/?limit=0")
    assert response.status_code == 422

    # limit must be <= 100
    response = client.get("/layers/?limit=101")
    assert response.status_code == 422


def test_list_layers_returns_layer(client, layer):
    """Test that list endpoint returns seeded layer from fixture."""
    response = client.get("/layers/")
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1


def test_list_layers_response_structure(client, layer):
    """Test that response structure matches PaginatedLayerResponse schema."""
    response = client.get("/layers/")
    data = response.json()

    assert "data" in data
    assert "total" in data
    assert isinstance(data["data"], list)
    assert isinstance(data["total"], int)


def test_list_layers_layer_fields(client, layer):
    """Test that all layer fields in response match fixture."""
    response = client.get("/layers/")
    data = response.json()
    item = data["data"][0]

    assert item["id"] == layer.id
    assert item["type"] == layer.type
    assert item["path"] == layer.path
    assert item["units"] == layer.units
    assert item["legend"] == layer.legend
    assert item["dataset_id"] == layer.dataset_id


def test_list_layers_metadata_bilingual(client, layer):
    """Test that metadata contains both en and fr locales."""
    response = client.get("/layers/")
    data = response.json()
    metadata = data["data"][0]["metadata"]

    assert "en" in metadata
    assert "fr" in metadata
    assert metadata["en"]["title"] == "Test Layer"
    assert metadata["fr"]["title"] == "Couche de test"


# =============================================================================
# List Layers - Pagination Tests
# =============================================================================


def test_list_layers_pagination_offset(client, multiple_layers):
    """Test that offset skips the correct number of items."""
    response = client.get("/layers/?offset=5&limit=5")
    data = response.json()
    assert len(data["data"]) == 5


def test_list_layers_pagination_limit(client, multiple_layers):
    """Test that limit restricts the number of returned items."""
    response = client.get("/layers/?limit=3")
    data = response.json()
    assert len(data["data"]) == 3


def test_list_layers_pagination_total_count(client, multiple_layers):
    """Test that total reflects all items regardless of offset/limit."""
    response = client.get("/layers/?offset=5&limit=5")
    data = response.json()
    assert data["total"] == 15


def test_list_layers_pagination_beyond_total(client, multiple_layers):
    """Test that offset beyond total returns empty data."""
    response = client.get("/layers/?offset=100&limit=10")
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 15


# =============================================================================
# List Layers - Search Tests
# =============================================================================


def test_list_layers_search_by_english_title(client, searchable_layers):
    """Test that search matches English title."""
    response = client.get("/layers/?search=Hudson")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["en"]["title"] == "Hudson Bay Temperature"


def test_list_layers_search_by_french_title(client, searchable_layers):
    """Test that search matches French title."""
    response = client.get("/layers/?search=glace")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["fr"]["title"] == "Couverture de glace arctique"


def test_list_layers_search_case_insensitive(client, searchable_layers):
    """Test that search is case-insensitive."""
    response = client.get("/layers/?search=hudson")
    data = response.json()
    assert data["total"] == 1


def test_list_layers_search_no_results(client, searchable_layers):
    """Test that search returns empty when no match."""
    response = client.get("/layers/?search=nonexistent")
    data = response.json()
    assert data["total"] == 0
    assert data["data"] == []


def test_list_layers_search_partial_match(client, searchable_layers):
    """Test that search supports partial title matching."""
    response = client.get("/layers/?search=Temp")
    data = response.json()
    assert data["total"] == 1
    assert "Temperature" in data["data"][0]["metadata"]["en"]["title"]


def test_list_layers_search_with_pagination(client, searchable_layers):
    """Test that search and pagination work together."""
    response = client.get("/layers/?search=Temp&offset=0&limit=1")
    data = response.json()
    assert len(data["data"]) == 1
    assert data["total"] == 1


# =============================================================================
# Get Layer by ID
# =============================================================================


def test_get_layer_returns_200(client, layer):
    """Test that get layer endpoint returns 200."""
    response = client.get(f"/layers/{layer.id}")
    assert response.status_code == 200


def test_get_layer_returns_correct_data(client, layer):
    """Test that get layer returns correct fields."""
    response = client.get(f"/layers/{layer.id}")
    data = response.json()

    assert data["id"] == layer.id
    assert data["type"] == layer.type
    assert data["path"] == layer.path
    assert data["units"] == layer.units
    assert data["legend"] == layer.legend
    assert data["dataset_id"] == layer.dataset_id


def test_get_layer_returns_404(client):
    """Test that nonexistent layer returns 404."""
    response = client.get("/layers/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Layer not found"


def test_get_layer_metadata_bilingual(client, layer):
    """Test that get layer returns bilingual metadata."""
    response = client.get(f"/layers/{layer.id}")
    data = response.json()

    assert "en" in data["metadata"]
    assert "fr" in data["metadata"]
    assert data["metadata"]["en"]["title"] == "Test Layer"
    assert data["metadata"]["fr"]["title"] == "Couche de test"
