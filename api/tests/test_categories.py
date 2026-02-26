"""Tests for categories endpoints."""


# =============================================================================
# List Categories - Basic Tests
# =============================================================================


def test_list_categories_returns_200(client):
    response = client.get("/categories/")
    assert response.status_code == 200


def test_list_categories_returns_empty_list(client):
    response = client.get("/categories/")
    data = response.json()
    assert data["data"] == []
    assert data["total"] == 0


def test_list_categories_returns_category(client, category):
    response = client.get("/categories/")
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1


def test_list_categories_response_structure(client, category):
    response = client.get("/categories/")
    data = response.json()
    assert "data" in data
    assert "total" in data
    item = data["data"][0]
    assert "id" in item
    assert "metadata" in item


def test_list_categories_metadata_bilingual(client, category):
    response = client.get("/categories/")
    data = response.json()
    metadata = data["data"][0]["metadata"]

    assert "title" in metadata
    assert metadata["title"]["en"] == "Test Category"
    assert metadata["title"]["fr"] == "Categorie de test"


# =============================================================================
# List Categories - Pagination Tests
# =============================================================================


def test_list_categories_pagination(client, multiple_categories):
    response = client.get("/categories/?offset=2&limit=2")
    data = response.json()
    assert len(data["data"]) == 2
    assert data["total"] == 5


# =============================================================================
# List Categories - Search Tests
# =============================================================================


def test_list_categories_search_by_english_title(client, searchable_categories):
    response = client.get("/categories/?search=Environment")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["title"]["en"] == "Environment"


def test_list_categories_search_by_french_title(client, searchable_categories):
    response = client.get("/categories/?search=autochtone")
    data = response.json()
    assert data["total"] == 1
    assert data["data"][0]["metadata"]["title"]["fr"] == "Valeur autochtone"


def test_list_categories_search_case_insensitive(client, searchable_categories):
    response = client.get("/categories/?search=environment")
    data = response.json()
    assert data["total"] == 1


# =============================================================================
# Get Category by ID
# =============================================================================


def test_get_category_returns_200(client, category):
    response = client.get(f"/categories/{category.id}")
    assert response.status_code == 200


def test_get_category_returns_404(client):
    response = client.get("/categories/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"


def test_get_category_include_datasets(client, category_with_datasets):
    response = client.get(f"/categories/{category_with_datasets.id}?include_datasets=true")
    data = response.json()
    assert "datasets" in data
    assert len(data["datasets"]) == 1
    assert "layers" not in data["datasets"][0]


def test_get_category_include_datasets_and_layers(client, category_with_datasets):
    response = client.get(f"/categories/{category_with_datasets.id}?include_datasets=true&include_layers=true")
    data = response.json()
    assert "datasets" in data
    assert len(data["datasets"]) == 1
    assert "layers" in data["datasets"][0]
    assert len(data["datasets"][0]["layers"]) == 1
