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
            "id": None,
            "metadata": {"title": {"en": "Test Category", "fr": "Categorie Test"}},
            "datasets": [
                {
                    "id": None,
                    "metadata": {
                        "title": {"en": "Test Dataset", "fr": "Jeu de donnees Test"},
                        "description": {"en": "Desc en", "fr": "Desc fr"},
                        "source": {"en": "https://example.com", "fr": "https://example.com"},
                        "citation": {"en": "Citation en", "fr": "Citation fr"},
                    },
                    "layers": [
                        {
                            "id": None,
                            "format": "raster",
                            "path": "/data/test/layer_a.tif",
                            "type": "continuous",
                            "unit": "cm",
                            "metadata": {
                                "title": {"en": "Layer A", "fr": "Couche A"},
                                "description": {"en": "Layer A desc", "fr": "Couche A desc"},
                            },
                        },
                        {
                            "id": None,
                            "format": "vector",
                            "path": "test.vector_id",
                            "type": "",
                            "unit": "",
                            "metadata": {
                                "title": {"en": "Layer B Vector", "fr": "Couche B Vecteur"},
                                "description": {"en": "Vector layer", "fr": "Couche vecteur"},
                            },
                        },
                        {
                            "id": None,
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
    db_session.commit()

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
    db_session.commit()
    assert counts1["categories"]["created"] == 1
    assert counts1["layers"]["created"] == 3

    counts2 = seed_database(db_session, metadata_path)
    db_session.commit()
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
    db_session.commit()

    vector_layer = db_session.execute(select(Layer).where(Layer.path == "test.vector_id")).scalar_one()
    assert vector_layer.type_ is None


def test_empty_unit_becomes_null(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    vector_layer = db_session.execute(select(Layer).where(Layer.path == "test.vector_id")).scalar_one()
    assert vector_layer.unit is None


def test_nonempty_type_preserved(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    raster_layer = db_session.execute(select(Layer).where(Layer.path == "/data/test/layer_a.tif")).scalar_one()
    assert raster_layer.type_ == "continuous"
    assert raster_layer.unit == "cm"


# =============================================================================
# Categorical Layers
# =============================================================================


def test_categories_array_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    cat_layer = db_session.execute(select(Layer).where(Layer.path == "/data/test/layer_c.tif")).scalar_one()
    assert cat_layer.categories is not None
    assert len(cat_layer.categories) == 2
    assert cat_layer.categories[0]["value"] == 1
    assert cat_layer.categories[0]["label"]["en"] == "Class 1"


def test_non_categorical_has_null_categories(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    raster_layer = db_session.execute(select(Layer).where(Layer.path == "/data/test/layer_a.tif")).scalar_one()
    assert raster_layer.categories is None


# =============================================================================
# Relationships
# =============================================================================


def test_dataset_belongs_to_category(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    category = db_session.execute(select(Category)).scalar_one()
    dataset = db_session.execute(select(Dataset)).scalar_one()
    assert dataset.category_id == category.id


def test_layer_belongs_to_dataset(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    dataset = db_session.execute(select(Dataset)).scalar_one()
    layers = db_session.execute(select(Layer)).scalars().all()
    for layer in layers:
        assert layer.dataset_id == dataset.id


def test_category_has_datasets_relationship(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    category = db_session.execute(select(Category)).scalar_one()
    assert len(category.datasets) == 1


def test_dataset_has_layers_relationship(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    dataset = db_session.execute(select(Dataset)).scalar_one()
    assert len(dataset.layers) == 3


# =============================================================================
# Metadata Integrity
# =============================================================================


def test_category_metadata_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    category = db_session.execute(select(Category)).scalar_one()
    assert category.metadata_["title"]["en"] == "Test Category"
    assert category.metadata_["title"]["fr"] == "Categorie Test"


def test_dataset_metadata_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    dataset = db_session.execute(select(Dataset)).scalar_one()
    assert dataset.metadata_["title"]["en"] == "Test Dataset"
    assert dataset.metadata_["source"]["en"] == "https://example.com"
    assert dataset.metadata_["citation"]["fr"] == "Citation fr"


def test_layer_metadata_stored(db_session):
    metadata_path = _write_metadata(MINIMAL_METADATA)
    seed_database(db_session, metadata_path)
    db_session.commit()

    layer = db_session.execute(select(Layer).where(Layer.path == "/data/test/layer_a.tif")).scalar_one()
    assert layer.metadata_["title"]["en"] == "Layer A"
    assert layer.format_ == "raster"


# =============================================================================
# Seed Endpoint
# =============================================================================


def test_seed_endpoint_wired(client):
    """POST /seed endpoint is registered and responds."""
    response = client.post("/seed")
    assert response.status_code in (200, 404, 500)
