"""Test fixtures for the API tests."""

import os
import sys
from pathlib import Path
from typing import Generator

# Set TESTING environment variable BEFORE importing app/settings
# This ensures the Settings class reads testing=True from environment
os.environ["TESTING"] = "true"

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

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


def _layer_metadata(title_en: str = "Test Layer", title_fr: str = "Couche de test") -> dict:
    """Build a valid i18n metadata dict for a layer."""
    return {
        "en": {"title": title_en, "description": f"Description for {title_en}"},
        "fr": {"title": title_fr, "description": f"Description pour {title_fr}"},
    }


def _dataset_metadata(title_en: str = "Test Dataset", title_fr: str = "Jeu de test") -> dict:
    """Build a valid i18n metadata dict for a dataset."""
    return {
        "en": {"title": title_en, "description": f"Description for {title_en}"},
        "fr": {"title": title_fr, "description": f"Description pour {title_fr}"},
    }


@pytest.fixture
def sample_layer(db_session: Session) -> Generator[Layer, None, None]:
    """Create a single layer in the database.

    Creates a test layer with standard attributes for single-record tests.
    The layer is automatically cleaned up after the test via transaction rollback.
    """
    layer = Layer(
        type="raster",
        path="/data/test_layer.tif",
        units="celsius",
        metadata_=_layer_metadata(),
    )
    db_session.add(layer)
    db_session.commit()
    db_session.refresh(layer)
    yield layer


@pytest.fixture
def sample_layers(db_session: Session) -> Generator[list[Layer], None, None]:
    """Create multiple layers in the database for pagination testing.

    Creates 15 layers with varying attributes to test pagination scenarios.
    The layers are automatically cleaned up after the test via transaction rollback.
    """
    layers = []
    for i in range(1, 16):
        layer = Layer(
            type="raster" if i % 2 == 0 else "vector",
            path=f"/data/layer_{i:02d}.tif",
            units="celsius" if i % 3 != 0 else None,
            metadata_=_layer_metadata(title_en=f"Layer {i:02d}", title_fr=f"Couche {i:02d}"),
        )
        layers.append(layer)

    db_session.add_all(layers)
    db_session.commit()

    for layer in layers:
        db_session.refresh(layer)

    yield layers


@pytest.fixture
def sample_dataset(db_session: Session) -> Generator[Dataset, None, None]:
    """Create a single dataset in the database."""
    dataset = Dataset(metadata_=_dataset_metadata())
    db_session.add(dataset)
    db_session.commit()
    db_session.refresh(dataset)
    yield dataset


@pytest.fixture
def sample_dataset_with_layers(db_session: Session) -> Generator[Dataset, None, None]:
    """Create a dataset with associated layers."""
    dataset = Dataset(metadata_=_dataset_metadata(title_en="Climate Data", title_fr="Donnees climatiques"))
    db_session.add(dataset)
    db_session.commit()
    db_session.refresh(dataset)

    layers = []
    for i in range(1, 4):
        layer = Layer(
            type="raster",
            path=f"/data/climate_{i}.tif",
            units="celsius",
            metadata_=_layer_metadata(title_en=f"Climate Layer {i}", title_fr=f"Couche climatique {i}"),
            dataset_id=dataset.id,
        )
        layers.append(layer)

    db_session.add_all(layers)
    db_session.commit()
    db_session.refresh(dataset)

    yield dataset
