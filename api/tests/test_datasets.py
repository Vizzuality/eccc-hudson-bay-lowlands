"""Tests for Dataset model and relationships."""

from sqlalchemy.orm import Session

from models import Dataset, Layer

# =============================================================================
# Dataset Model Tests (Direct DB, no endpoint)
# =============================================================================


def test_create_dataset_in_db(db_session: Session):
    """Test that a Dataset can be created directly in the database."""
    metadata = {
        "en": {"title": "Climate Data", "description": "Hudson Bay climate dataset"},
        "fr": {"title": "Donnees climatiques", "description": "Jeu de donnees climatiques"},
    }
    dataset = Dataset(metadata_=metadata)
    db_session.add(dataset)
    db_session.commit()
    db_session.refresh(dataset)

    assert dataset.id is not None
    assert dataset.metadata_ == metadata


def test_dataset_metadata_structure(db_session: Session):
    """Test that dataset metadata preserves full i18n structure including optional fields."""
    metadata = {
        "en": {
            "title": "Climate Data",
            "description": "Hudson Bay climate dataset",
            "citations": "Smith et al. 2024",
            "source": "https://example.com/data",
        },
        "fr": {
            "title": "Donnees climatiques",
            "description": "Jeu de donnees climatiques",
            "citations": "Smith et al. 2024",
            "source": "https://example.com/data",
        },
    }
    dataset = Dataset(metadata_=metadata)
    db_session.add(dataset)
    db_session.commit()
    db_session.refresh(dataset)

    assert dataset.metadata_["en"]["citations"] == "Smith et al. 2024"
    assert dataset.metadata_["fr"]["source"] == "https://example.com/data"


def test_dataset_fixture(sample_dataset: Dataset):
    """Test that the sample_dataset fixture creates a valid dataset."""
    assert sample_dataset.id is not None
    assert "en" in sample_dataset.metadata_
    assert "fr" in sample_dataset.metadata_
    assert sample_dataset.metadata_["en"]["title"] == "Test Dataset"


# =============================================================================
# Dataset-Layer Relationship Tests
# =============================================================================


def test_dataset_layer_relationship(sample_dataset_with_layers: Dataset):
    """Test that a dataset has its associated layers."""
    assert len(sample_dataset_with_layers.layers) == 3
    for layer in sample_dataset_with_layers.layers:
        assert layer.dataset_id == sample_dataset_with_layers.id
        assert layer.type == "raster"


def test_add_layer_to_dataset(db_session: Session, sample_dataset: Dataset):
    """Test adding a layer to an existing dataset."""
    layer = Layer(
        type="vector",
        path="/data/boundaries.geojson",
        metadata_={
            "en": {"title": "Boundaries", "description": "Region boundaries"},
            "fr": {"title": "Limites", "description": "Limites de la region"},
        },
        dataset_id=sample_dataset.id,
    )
    db_session.add(layer)
    db_session.commit()
    db_session.refresh(sample_dataset)

    assert len(sample_dataset.layers) == 1
    assert sample_dataset.layers[0].path == "/data/boundaries.geojson"


def test_layer_back_populates_dataset(db_session: Session, sample_dataset_with_layers: Dataset):
    """Test that a layer's dataset relationship back-populates correctly."""
    layer = sample_dataset_with_layers.layers[0]
    assert layer.dataset is not None
    assert layer.dataset.id == sample_dataset_with_layers.id


def test_layer_without_dataset(db_session: Session):
    """Test that a layer can exist without a dataset."""
    layer = Layer(
        type="raster",
        path="/data/standalone.tif",
        metadata_={
            "en": {"title": "Standalone", "description": "A standalone layer"},
            "fr": {"title": "Autonome", "description": "Une couche autonome"},
        },
    )
    db_session.add(layer)
    db_session.commit()
    db_session.refresh(layer)

    assert layer.dataset_id is None
    assert layer.dataset is None


# =============================================================================
# Cascade Delete Tests
# =============================================================================


def test_cascade_delete_dataset_removes_layers(db_session: Session):
    """Test that deleting a dataset cascades to delete its layers."""
    dataset = Dataset(
        metadata_={
            "en": {"title": "Temp", "description": "Temporary dataset"},
            "fr": {"title": "Temp", "description": "Jeu de donnees temporaire"},
        }
    )
    db_session.add(dataset)
    db_session.commit()
    db_session.refresh(dataset)
    dataset_id = dataset.id

    for i in range(3):
        layer = Layer(
            type="raster",
            path=f"/data/temp_{i}.tif",
            metadata_={
                "en": {"title": f"Temp {i}", "description": f"Temporary layer {i}"},
                "fr": {"title": f"Temp {i}", "description": f"Couche temporaire {i}"},
            },
            dataset_id=dataset_id,
        )
        db_session.add(layer)
    db_session.commit()

    # Verify layers exist
    layers = db_session.query(Layer).filter(Layer.dataset_id == dataset_id).all()
    assert len(layers) == 3

    # Delete the dataset
    db_session.delete(dataset)
    db_session.commit()

    # Verify layers are also deleted
    remaining = db_session.query(Layer).filter(Layer.dataset_id == dataset_id).all()
    assert len(remaining) == 0
