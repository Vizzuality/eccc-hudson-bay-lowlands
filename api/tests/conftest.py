"""Test fixtures for the API tests."""

import os
import sys
from pathlib import Path

# Set TESTING environment variable BEFORE importing app/settings
# This ensures the Settings class reads testing=True from environment
os.environ["TESTING"] = "true"

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import get_settings
from db.base import Base
from db.database import get_db
from main import app
from models import Dataset, Layer

settings = get_settings()

# Create test engine with psycopg driver
test_engine = create_engine(
    settings.database_url.replace("postgresql://", "postgresql+psycopg://"),
    pool_pre_ping=True,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables before running tests, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create a test client with database session override."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


# =============================================================================
# Layer Fixtures
# =============================================================================


@pytest.fixture
def sample_layer_metadata():
    """Standard bilingual metadata for test layers."""
    return {
        "en": {"title": "Test Layer", "description": "A test layer"},
        "fr": {"title": "Couche de test", "description": "Une couche de test"},
    }


@pytest.fixture
def layer(db_session, sample_layer_metadata):
    """Create a single layer (no dataset)."""
    db_layer = Layer(type="raster", path="/data/test.tif", metadata_=sample_layer_metadata)
    db_session.add(db_layer)
    db_session.commit()
    db_session.refresh(db_layer)
    yield db_layer


@pytest.fixture
def multiple_layers(db_session):
    """Create 15 layers for pagination testing."""
    layers = []
    for i in range(1, 16):
        db_layer = Layer(
            type="raster" if i % 2 == 0 else "vector",
            path=f"/data/layer_{i:02d}.tif",
            metadata_={
                "en": {"title": f"Layer {i:02d}", "description": f"Layer number {i}"},
                "fr": {"title": f"Couche {i:02d}", "description": f"Couche numero {i}"},
            },
        )
        layers.append(db_layer)
    db_session.add_all(layers)
    db_session.commit()
    for db_layer in layers:
        db_session.refresh(db_layer)
    yield layers


@pytest.fixture
def searchable_layers(db_session):
    """Create layers with distinct titles for search testing."""
    layers_data = [
        {"en": {"title": "Hudson Bay Temperature"}, "fr": {"title": "Temperature de la baie d'Hudson"}},
        {"en": {"title": "Arctic Ice Coverage"}, "fr": {"title": "Couverture de glace arctique"}},
        {"en": {"title": "Permafrost Depth"}, "fr": {"title": "Profondeur du pergelisol"}},
    ]
    layers = []
    for i, md in enumerate(layers_data):
        db_layer = Layer(type="raster", path=f"/data/search_{i}.tif", metadata_=md)
        layers.append(db_layer)
    db_session.add_all(layers)
    db_session.commit()
    for db_layer in layers:
        db_session.refresh(db_layer)
    yield layers


# =============================================================================
# Dataset Fixtures
# =============================================================================


@pytest.fixture
def sample_dataset_metadata():
    """Standard bilingual metadata for test datasets."""
    return {
        "en": {"title": "Test Dataset", "description": "A test dataset"},
        "fr": {"title": "Jeu de donnees de test", "description": "Un jeu de donnees de test"},
    }


@pytest.fixture
def dataset(db_session, sample_dataset_metadata):
    """Create a single dataset."""
    db_dataset = Dataset(metadata_=sample_dataset_metadata)
    db_session.add(db_dataset)
    db_session.commit()
    db_session.refresh(db_dataset)
    yield db_dataset


@pytest.fixture
def layer_with_dataset(db_session, dataset, sample_layer_metadata):
    """Create a layer that belongs to a dataset."""
    db_layer = Layer(
        type="raster",
        path="/data/test.tif",
        metadata_=sample_layer_metadata,
        dataset_id=dataset.id,
    )
    db_session.add(db_layer)
    db_session.commit()
    db_session.refresh(db_layer)
    yield db_layer


@pytest.fixture
def multiple_datasets(db_session):
    """Create multiple datasets for pagination testing."""
    datasets = []
    for i in range(1, 6):
        db_dataset = Dataset(
            metadata_={
                "en": {"title": f"Dataset {i:02d}", "description": f"Dataset number {i}"},
                "fr": {"title": f"Jeu de donnees {i:02d}", "description": f"Jeu numero {i}"},
            }
        )
        datasets.append(db_dataset)
    db_session.add_all(datasets)
    db_session.commit()
    for db_dataset in datasets:
        db_session.refresh(db_dataset)
    yield datasets


@pytest.fixture
def searchable_datasets(db_session):
    """Create datasets with distinct titles for search testing."""
    datasets_data = [
        {"en": {"title": "Climate Observations"}, "fr": {"title": "Observations climatiques"}},
        {"en": {"title": "Wildlife Tracking"}, "fr": {"title": "Suivi de la faune"}},
        {"en": {"title": "Permafrost Monitoring"}, "fr": {"title": "Surveillance du pergelisol"}},
    ]
    datasets = []
    for md in datasets_data:
        db_dataset = Dataset(metadata_=md)
        datasets.append(db_dataset)
    db_session.add_all(datasets)
    db_session.commit()
    for db_dataset in datasets:
        db_session.refresh(db_dataset)
    yield datasets
