"""Tests for the database seeding logic."""

import json
import tempfile
from pathlib import Path

from sqlalchemy import func, select

from models import Category, Dataset, Layer
from services.seed import seed_database

MINIMAL_METADATA = {
    "categories": [
        {
            "id": 1,
            "metadata": {"title": {"en": "Test Category", "fr": "Categorie Test"}},
            "datasets": [
                {
                    "id": 1,
                    "metadata": {
                        "title": {"en": "Test Dataset", "fr": "Jeu de donnees Test"},
                        "description": {"en": "Desc en", "fr": "Desc fr"},
                        "source": {"en": "https://example.com", "fr": "https://example.com"},
                        "citation": {"en": "Citation en", "fr": "Citation fr"},
                    },
                    "layers": [
                        {
                            "id": "layer_a",
                            "format": "raster",
                            "path": "/data/test/layer_a.tif",
                            "type": "choropleth",
                            "unit": "cm",
                            "config": {
                                "colormap": [[0, "#0E2780"], [100, "#01CB2A"]],
                                "styles": [{"type": "raster", "paint": {"raster-opacity": "@@#params.opacity"}}],
                                "params_config": [
                                    {"key": "opacity", "default": 1},
                                    {"key": "visibility", "default": True},
                                ],
                                "legend_config": {
                                    "type": "basic",
                                    "items": [
                                        {"color": "#0E2780", "label": {"en": "<100 cm", "fr": "<100 cm"}},
                                        {"color": "#01CB2A", "label": {"en": ">100 cm", "fr": ">100 cm"}},
                                    ],
                                },
                            },
                            "metadata": {
                                "title": {"en": "Layer A", "fr": "Couche A"},
                                "description": {"en": "Layer A desc", "fr": "Couche A desc"},
                            },
                        },
                        {
                            "id": "layer_b",
                            "format": "vector",
                            "path": "test.vector_id",
                            "type": "",
                            "unit": "",
                            "config": {
                                "styles": [
                                    {
                                        "type": "line",
                                        "paint": {"line-color": "#6e6e6e", "line-width": 1},
                                        "source-layer": "boundaries",
                                    }
                                ],
                                "params_config": [
                                    {"key": "opacity", "default": 1},
                                    {"key": "visibility", "default": True},
                                ],
                                "legend_config": {
                                    "type": "basic",
                                    "items": [
                                        {
                                            "color": "#6e6e6e",
                                            "line-width": 1,
                                            "label": {"en": "Boundary", "fr": "Limite"},
                                        }
                                    ],
                                },
                                "interaction_config": {
                                    "keys": ["NAME_EN", "NAME_FR"],
                                    "type": "feature-value",
                                    "event": "click",
                                },
                            },
                            "metadata": {
                                "title": {"en": "Layer B Vector", "fr": "Couche B Vecteur"},
                                "description": {"en": "Vector layer", "fr": "Couche vecteur"},
                            },
                        },
                        {
                            "id": "layer_c",
                            "format": "raster",
                            "path": "/data/test/layer_c.tif",
                            "type": "categorical",
                            "unit": "category",
                            "categories": [
                                {"value": 1, "label": {"en": "Class 1", "fr": "Classe 1"}},
                                {"value": 2, "label": {"en": "Class 2", "fr": "Classe 2"}},
                            ],
                            "metadata": {
                                "title": {"en": "Layer C Categorical", "fr": "Couche C Categorique"},
                                "description": {"en": "Categorical layer", "fr": "Couche categorique"},
                            },
                        },
                    ],
                },
            ],
        },
    ],
}


def _write_metadata(data: dict) -> Path:
    """Write metadata dict to a temp JSON file and return the path."""
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    json.dump(data, tmp)
    tmp.close()
    return Path(tmp.name)


# =============================================================================
# Seed Counts
# =============================================================================


def test_seed_creates_correct_counts(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    counts = seed_database(db_session, metadata_path)
    db_session.flush()

    assert counts["categories"]["created"] == 1
    assert counts["datasets"]["created"] == 1
    assert counts["layers"]["created"] == 3

    assert db_session.execute(select(func.count(Category.id))).scalar() == 1
    assert db_session.execute(select(func.count(Dataset.id))).scalar() == 1
    assert db_session.execute(select(func.count(Layer.id))).scalar() == 3


# =============================================================================
# Idempotency
# =============================================================================


def test_seed_idempotent(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)

    counts1 = seed_database(db_session, metadata_path)
    db_session.flush()
    assert counts1["categories"]["created"] == 1
    assert counts1["layers"]["created"] == 3

    counts2 = seed_database(db_session, metadata_path)
    db_session.flush()
    assert counts2["categories"]["updated"] == 1
    assert counts2["categories"]["created"] == 0
    assert counts2["datasets"]["updated"] == 1
    assert counts2["datasets"]["created"] == 0
    assert counts2["layers"]["updated"] == 3
    assert counts2["layers"]["created"] == 0

    assert db_session.execute(select(func.count(Category.id))).scalar() == 1
    assert db_session.execute(select(func.count(Dataset.id))).scalar() == 1
    assert db_session.execute(select(func.count(Layer.id))).scalar() == 3


# =============================================================================
# Empty String Normalization
# =============================================================================


def test_empty_type_becomes_null(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    vector_layer = db_session.execute(select(Layer).where(Layer.path == "test.vector_id")).scalar_one()
    assert vector_layer.type_ is None


def test_empty_unit_becomes_null(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    vector_layer = db_session.execute(select(Layer).where(Layer.path == "test.vector_id")).scalar_one()
    assert vector_layer.unit is None


def test_nonempty_type_preserved(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    raster_layer = db_session.execute(select(Layer).where(Layer.path == "data/test/layer_a.tif")).scalar_one()
    assert raster_layer.type_ == "choropleth"
    assert raster_layer.unit == "cm"


# =============================================================================
# Categorical Layers
# =============================================================================


def test_categories_array_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    cat_layer = db_session.execute(select(Layer).where(Layer.path == "data/test/layer_c.tif")).scalar_one()
    assert cat_layer.categories is not None
    assert len(cat_layer.categories) == 2
    assert cat_layer.categories[0]["value"] == 1
    assert cat_layer.categories[0]["label"]["en"] == "Class 1"


def test_non_categorical_has_null_categories(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    raster_layer = db_session.execute(select(Layer).where(Layer.path == "data/test/layer_a.tif")).scalar_one()
    assert raster_layer.categories is None


# =============================================================================
# Relationships
# =============================================================================


def test_dataset_belongs_to_category(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    category = db_session.execute(select(Category)).scalar_one()
    dataset = db_session.execute(select(Dataset)).scalar_one()
    assert dataset.category_id == category.id


def test_layer_belongs_to_dataset(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    dataset = db_session.execute(select(Dataset)).scalar_one()
    layers = db_session.execute(select(Layer)).scalars().all()
    for layer in layers:
        assert layer.dataset_id == dataset.id


def test_category_has_datasets_relationship(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    category = db_session.execute(select(Category)).scalar_one()
    assert len(category.datasets) == 1


def test_dataset_has_layers_relationship(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    dataset = db_session.execute(select(Dataset)).scalar_one()
    assert len(dataset.layers) == 3


# =============================================================================
# Metadata Integrity
# =============================================================================


def test_category_metadata_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    category = db_session.execute(select(Category)).scalar_one()
    assert category.metadata_["title"]["en"] == "Test Category"
    assert category.metadata_["title"]["fr"] == "Categorie Test"


def test_dataset_metadata_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    dataset = db_session.execute(select(Dataset)).scalar_one()
    assert dataset.metadata_["title"]["en"] == "Test Dataset"
    assert dataset.metadata_["source"]["en"] == "https://example.com"
    assert dataset.metadata_["citation"]["fr"] == "Citation fr"


def test_layer_metadata_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    layer = db_session.execute(select(Layer).where(Layer.path == "data/test/layer_a.tif")).scalar_one()
    assert layer.metadata_["title"]["en"] == "Layer A"
    assert layer.format_ == "raster"


# =============================================================================
# Seed Endpoint
# =============================================================================


def test_seed_endpoint_with_payload(client):
    """POST /seed with valid secret and payload returns success."""
    import os

    seed_secret = os.environ["SEED_SECRET"]
    response = client.post("/seed", json=MINIMAL_METADATA, headers={"X-Seed-Secret": seed_secret})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["counts"]["categories"]["created"] == 1
    assert data["counts"]["datasets"]["created"] == 1
    assert data["counts"]["layers"]["created"] == 3


def test_seed_endpoint_missing_secret(client):
    """POST /seed without secret header returns 422."""
    response = client.post("/seed", json=MINIMAL_METADATA)
    assert response.status_code == 422


def test_seed_endpoint_invalid_secret(client):
    """POST /seed with wrong secret returns 403."""
    response = client.post("/seed", json=MINIMAL_METADATA, headers={"X-Seed-Secret": "wrong"})
    assert response.status_code == 403


# =============================================================================
# Config Persistence
# =============================================================================


def test_seed_stores_config(db_session):
    """Seed persists the config JSON for layers that have it."""
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    layer = db_session.execute(select(Layer).where(Layer.path == "data/test/layer_a.tif")).scalar_one()
    assert layer.config is not None
    assert layer.config["colormap"] == [[0, "#0E2780"], [100, "#01CB2A"]]
    assert layer.config["styles"][0]["type"] == "raster"
    assert layer.config["params_config"][0]["key"] == "opacity"
    assert layer.config["legend_config"]["type"] == "basic"
    assert len(layer.config["legend_config"]["items"]) == 2


def test_seed_stores_vector_config(db_session):
    """Seed persists config for vector layers (no colormap, has source-layer)."""
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    layer = db_session.execute(select(Layer).where(Layer.path == "test.vector_id")).scalar_one()
    assert layer.config is not None
    assert "colormap" not in layer.config
    assert layer.config["styles"][0]["source-layer"] == "boundaries"
    assert layer.config["styles"][0]["paint"]["line-color"] == "#6e6e6e"
    assert layer.config["legend_config"]["items"][0]["line-width"] == 1
    assert layer.config["interaction_config"] == {
        "keys": ["NAME_EN", "NAME_FR"],
        "type": "feature-value",
        "event": "click",
    }


def test_seed_layer_without_config(db_session):
    """Layers without config in the seed data have null config."""
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.flush()

    cat_layer = db_session.execute(select(Layer).where(Layer.path == "data/test/layer_c.tif")).scalar_one()
    assert cat_layer.config is None


# =============================================================================
# Explicit ID Honoring
# =============================================================================


def test_seed_honors_explicit_category_id(db_session):
    """The explicit integer id in the payload is used as the category PK on create."""
    seed_database(db_session, payload=MINIMAL_METADATA)
    db_session.flush()

    category = db_session.execute(select(Category)).scalar_one()
    assert category.id == 1


def test_seed_honors_explicit_dataset_id(db_session):
    """The explicit integer id in the payload is used as the dataset PK on create."""
    seed_database(db_session, payload=MINIMAL_METADATA)
    db_session.flush()

    dataset = db_session.execute(select(Dataset)).scalar_one()
    assert dataset.id == 1


def test_seed_endpoint_missing_category_id_returns_422(client):
    """POST /seed with a category payload missing `id` returns 422."""
    import os

    seed_secret = os.environ["SEED_SECRET"]
    payload = {
        "categories": [
            {
                "metadata": {"title": {"en": "No ID Category", "fr": "Categorie Sans ID"}},
                "datasets": [],
            }
        ]
    }
    response = client.post("/seed", json=payload, headers={"X-Seed-Secret": seed_secret})
    assert response.status_code == 422


def test_seed_endpoint_null_category_id_returns_422(client):
    """POST /seed with a null category id returns 422."""
    import os

    seed_secret = os.environ["SEED_SECRET"]
    payload = {
        "categories": [
            {
                "id": None,
                "metadata": {"title": {"en": "Null ID Category", "fr": "Categorie ID Null"}},
                "datasets": [],
            }
        ]
    }
    response = client.post("/seed", json=payload, headers={"X-Seed-Secret": seed_secret})
    assert response.status_code == 422


def test_seed_endpoint_missing_dataset_id_returns_422(client):
    """POST /seed with a dataset payload missing `id` returns 422."""
    import os

    seed_secret = os.environ["SEED_SECRET"]
    payload = {
        "categories": [
            {
                "id": 99,
                "metadata": {"title": {"en": "Cat", "fr": "Cat"}},
                "datasets": [
                    {
                        "metadata": {"title": {"en": "Dataset", "fr": "Jeu"}},
                        "layers": [],
                    }
                ],
            }
        ]
    }
    response = client.post("/seed", json=payload, headers={"X-Seed-Secret": seed_secret})
    assert response.status_code == 422


def test_seed_endpoint_null_dataset_id_returns_422(client):
    """POST /seed with a null dataset id returns 422."""
    import os

    seed_secret = os.environ["SEED_SECRET"]
    payload = {
        "categories": [
            {
                "id": 99,
                "metadata": {"title": {"en": "Cat", "fr": "Cat"}},
                "datasets": [
                    {
                        "id": None,
                        "metadata": {"title": {"en": "Dataset", "fr": "Jeu"}},
                        "layers": [],
                    }
                ],
            }
        ]
    }
    response = client.post("/seed", json=payload, headers={"X-Seed-Secret": seed_secret})
    assert response.status_code == 422


# =============================================================================
# delete_first flag
# =============================================================================


def _seed_stray_rows(db_session) -> None:
    """Insert a stray category/dataset/layer that is NOT in MINIMAL_METADATA."""
    stray_category = Category(id=999, metadata_={"title": {"en": "Stray", "fr": "Vagabond"}})
    db_session.add(stray_category)
    db_session.flush()

    stray_dataset = Dataset(
        id=999,
        metadata_={"title": {"en": "Stray Dataset", "fr": "Jeu Vagabond"}},
        category_id=stray_category.id,
    )
    db_session.add(stray_dataset)
    db_session.flush()

    stray_layer = Layer(
        id="stray_layer",
        format_="raster",
        path="/data/stray.tif",
        metadata_={"title": {"en": "Stray Layer", "fr": "Couche Vagabonde"}},
        dataset_id=stray_dataset.id,
    )
    db_session.add(stray_layer)
    db_session.flush()


def test_seed_default_does_not_wipe(db_session):
    """Without delete_first, pre-existing rows that are not in the payload are preserved."""
    _seed_stray_rows(db_session)

    counts = seed_database(db_session, payload=MINIMAL_METADATA)
    db_session.flush()

    # Stray rows still present.
    assert db_session.execute(select(Category).where(Category.id == 999)).scalar_one_or_none() is not None
    assert db_session.execute(select(Dataset).where(Dataset.id == 999)).scalar_one_or_none() is not None
    assert db_session.execute(select(Layer).where(Layer.id == "stray_layer")).scalar_one_or_none() is not None

    # Payload rows applied on top.
    assert db_session.execute(select(Category).where(Category.id == 1)).scalar_one_or_none() is not None
    assert counts["deleted"] is False


def test_seed_delete_first_removes_existing_rows(db_session):
    """delete_first=True removes rows not present in the payload before upserting."""
    _seed_stray_rows(db_session)

    counts = seed_database(db_session, payload=MINIMAL_METADATA, delete_first=True)
    db_session.flush()

    # Stray rows are gone.
    assert db_session.execute(select(Category).where(Category.id == 999)).scalar_one_or_none() is None
    assert db_session.execute(select(Dataset).where(Dataset.id == 999)).scalar_one_or_none() is None
    assert db_session.execute(select(Layer).where(Layer.id == "stray_layer")).scalar_one_or_none() is None

    # Payload rows are fully present.
    assert db_session.execute(select(func.count(Category.id))).scalar() == 1
    assert db_session.execute(select(func.count(Dataset.id))).scalar() == 1
    assert db_session.execute(select(func.count(Layer.id))).scalar() == 3

    # Counts reflect a fresh insert (no updates) and surface the deleted flag.
    assert counts["deleted"] is True
    assert counts["categories"]["created"] == 1
    assert counts["categories"]["updated"] == 0
    assert counts["datasets"]["created"] == 1
    assert counts["datasets"]["updated"] == 0
    assert counts["layers"]["created"] == 3
    assert counts["layers"]["updated"] == 0


def test_seed_delete_first_on_empty_db(db_session):
    """delete_first=True against an empty DB seeds normally."""
    counts = seed_database(db_session, payload=MINIMAL_METADATA, delete_first=True)
    db_session.flush()

    assert counts["deleted"] is True
    assert counts["categories"]["created"] == 1
    assert counts["datasets"]["created"] == 1
    assert counts["layers"]["created"] == 3
    assert db_session.execute(select(func.count(Category.id))).scalar() == 1
    assert db_session.execute(select(func.count(Dataset.id))).scalar() == 1
    assert db_session.execute(select(func.count(Layer.id))).scalar() == 3


def test_seed_delete_first_false_matches_default(db_session):
    """Explicitly passing delete_first=False behaves identically to omitting it."""
    _seed_stray_rows(db_session)

    counts = seed_database(db_session, payload=MINIMAL_METADATA, delete_first=False)
    db_session.flush()

    # Stray rows still present (same as default behaviour).
    assert db_session.execute(select(Category).where(Category.id == 999)).scalar_one_or_none() is not None
    assert db_session.execute(select(Dataset).where(Dataset.id == 999)).scalar_one_or_none() is not None
    assert db_session.execute(select(Layer).where(Layer.id == "stray_layer")).scalar_one_or_none() is not None
    assert counts["deleted"] is False


def test_seed_endpoint_delete_first_query_param(client, db_session):
    """POST /seed?delete_first=true wipes existing rows then applies the payload."""
    import os

    _seed_stray_rows(db_session)

    seed_secret = os.environ["SEED_SECRET"]
    response = client.post(
        "/seed?delete_first=true",
        json=MINIMAL_METADATA,
        headers={"X-Seed-Secret": seed_secret},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["counts"]["deleted"] is True
    assert data["counts"]["categories"]["created"] == 1
    assert data["counts"]["datasets"]["created"] == 1
    assert data["counts"]["layers"]["created"] == 3

    # Stray rows are gone after the endpoint commits.
    assert db_session.execute(select(Category).where(Category.id == 999)).scalar_one_or_none() is None
    assert db_session.execute(select(Dataset).where(Dataset.id == 999)).scalar_one_or_none() is None
    assert db_session.execute(select(Layer).where(Layer.id == "stray_layer")).scalar_one_or_none() is None
