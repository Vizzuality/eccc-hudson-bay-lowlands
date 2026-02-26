"""Shared test fixtures for the API test suite."""

import os

os.environ["TESTING"] = "true"

import sys
from pathlib import Path

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
from models import Category, Dataset, Layer

settings = get_settings()

# Create test engine with psycopg driver
test_engine = create_engine(
    settings.database_url.replace("postgresql://", "postgresql+psycopg://"),
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables before tests, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a transactional database session that rolls back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Provide a test client with overridden DB dependency."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


# =============================================================================
# Sample Metadata Fixtures
# =============================================================================


@pytest.fixture
def sample_category_metadata():
    """Standard bilingual metadata for test categories."""
    return {"title": {"en": "Test Category", "fr": "Categorie de test"}}


@pytest.fixture
def sample_dataset_metadata():
    """Standard bilingual metadata for test datasets."""
    return {
        "title": {"en": "Test Dataset", "fr": "Jeu de donnees de test"},
        "description": {"en": "A test dataset", "fr": "Un jeu de donnees de test"},
    }


@pytest.fixture
def sample_layer_metadata():
    """Standard bilingual metadata for test layers."""
    return {
        "title": {"en": "Test Layer", "fr": "Couche de test"},
        "description": {"en": "A test layer", "fr": "Une couche de test"},
    }


# =============================================================================
# Category Fixtures
# =============================================================================


@pytest.fixture
def category(db_session, sample_category_metadata):
    """Create a single category."""
    db_category = Category(metadata_=sample_category_metadata)
    db_session.add(db_category)
    db_session.commit()
    db_session.refresh(db_category)
    yield db_category


@pytest.fixture
def multiple_categories(db_session):
    """Create 5 categories for pagination testing."""
    categories = []
    for i in range(1, 6):
        db_category = Category(
            metadata_={"title": {"en": f"Category {i:02d}", "fr": f"Categorie {i:02d}"}},
        )
        categories.append(db_category)
    db_session.add_all(categories)
    db_session.commit()
    for c in categories:
        db_session.refresh(c)
    yield categories


@pytest.fixture
def searchable_categories(db_session):
    """Create categories with distinct titles for search testing."""
    categories_data = [
        {"title": {"en": "Environment", "fr": "Environnement"}},
        {"title": {"en": "Indigenous Value", "fr": "Valeur autochtone"}},
        {"title": {"en": "Human Pressures", "fr": "Pressions humaines"}},
    ]
    categories = []
    for md in categories_data:
        db_category = Category(metadata_=md)
        categories.append(db_category)
    db_session.add_all(categories)
    db_session.commit()
    for c in categories:
        db_session.refresh(c)
    yield categories


@pytest.fixture
def category_with_datasets(db_session, sample_category_metadata, sample_dataset_metadata):
    """Create a category with a dataset that has a layer."""
    db_category = Category(metadata_=sample_category_metadata)
    db_session.add(db_category)
    db_session.flush()

    db_dataset = Dataset(metadata_=sample_dataset_metadata, category_id=db_category.id)
    db_session.add(db_dataset)
    db_session.flush()

    db_layer = Layer(
        format_="raster",
        type_="continuous",
        path="/data/test.tif",
        unit="celsius",
        metadata_={"title": {"en": "Test Layer", "fr": "Couche de test"}},
        dataset_id=db_dataset.id,
    )
    db_session.add(db_layer)
    db_session.commit()
    db_session.refresh(db_category)
    yield db_category


# =============================================================================
# Layer Fixtures
# =============================================================================


@pytest.fixture
def layer(db_session, sample_layer_metadata):
    """Create a single layer (no dataset)."""
    db_layer = Layer(
        format_="raster",
        type_="continuous",
        path="/data/test.tif",
        unit="celsius",
        metadata_=sample_layer_metadata,
    )
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
            format_="raster" if i % 2 == 0 else "vector",
            type_="continuous" if i % 2 == 0 else None,
            path=f"/data/layer_{i:02d}.tif",
            metadata_={
                "title": {"en": f"Layer {i:02d}", "fr": f"Couche {i:02d}"},
                "description": {"en": f"Layer number {i}", "fr": f"Couche numero {i}"},
            },
        )
        layers.append(db_layer)
    db_session.add_all(layers)
    db_session.commit()
    for layer in layers:
        db_session.refresh(layer)
    yield layers


@pytest.fixture
def searchable_layers(db_session):
    """Create layers with distinct titles for search testing."""
    layers_data = [
        {"title": {"en": "Hudson Bay Temperature", "fr": "Temperature de la baie d'Hudson"}},
        {"title": {"en": "Arctic Ice Coverage", "fr": "Couverture de glace arctique"}},
        {"title": {"en": "Permafrost Depth", "fr": "Profondeur du pergelisol"}},
    ]
    layers = []
    for i, md in enumerate(layers_data):
        db_layer = Layer(
            format_="raster",
            type_="continuous",
            path=f"/data/search_{i}.tif",
            metadata_=md,
        )
        layers.append(db_layer)
    db_session.add_all(layers)
    db_session.commit()
    for layer in layers:
        db_session.refresh(layer)
    yield layers


# =============================================================================
# Dataset Fixtures
# =============================================================================


@pytest.fixture
def dataset(db_session, category, sample_dataset_metadata):
    """Create a single dataset (belongs to a category)."""
    db_dataset = Dataset(metadata_=sample_dataset_metadata, category_id=category.id)
    db_session.add(db_dataset)
    db_session.commit()
    db_session.refresh(db_dataset)
    yield db_dataset


@pytest.fixture
def layer_with_dataset(db_session, dataset, sample_layer_metadata):
    """Create a layer that belongs to a dataset."""
    db_layer = Layer(
        format_="raster",
        type_="continuous",
        path="/data/test.tif",
        unit="celsius",
        metadata_=sample_layer_metadata,
        dataset_id=dataset.id,
    )
    db_session.add(db_layer)
    db_session.commit()
    db_session.refresh(db_layer)
    yield db_layer


@pytest.fixture
def multiple_datasets(db_session, sample_category_metadata):
    """Create 5 datasets for pagination testing."""
    db_category = Category(metadata_=sample_category_metadata)
    db_session.add(db_category)
    db_session.flush()

    datasets = []
    for i in range(1, 6):
        db_dataset = Dataset(
            metadata_={
                "title": {"en": f"Dataset {i:02d}", "fr": f"Jeu de donnees {i:02d}"},
                "description": {"en": f"Dataset number {i}", "fr": f"Jeu numero {i}"},
            },
            category_id=db_category.id,
        )
        datasets.append(db_dataset)
    db_session.add_all(datasets)
    db_session.commit()
    for d in datasets:
        db_session.refresh(d)
    yield datasets


@pytest.fixture
def searchable_datasets(db_session, sample_category_metadata):
    """Create datasets with distinct titles for search testing."""
    db_category = Category(metadata_=sample_category_metadata)
    db_session.add(db_category)
    db_session.flush()

    datasets_data = [
        {"title": {"en": "Climate Observations", "fr": "Observations climatiques"}},
        {"title": {"en": "Wildlife Tracking", "fr": "Suivi de la faune"}},
        {"title": {"en": "Permafrost Monitoring", "fr": "Surveillance du pergelisol"}},
    ]
    datasets = []
    for md in datasets_data:
        db_dataset = Dataset(metadata_=md, category_id=db_category.id)
        datasets.append(db_dataset)
    db_session.add_all(datasets)
    db_session.commit()
    for d in datasets:
        db_session.refresh(d)
    yield datasets
