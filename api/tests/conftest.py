"""Shared test fixtures for the API test suite."""

import os

os.environ["TESTING"] = "true"
os.environ.setdefault("SEED_SECRET", "test-seed-secret")
os.environ.setdefault("S3_BUCKET_NAME", "test-bucket")

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
    """Create all tables before tests, drop all tables after."""
    Base.metadata.drop_all(bind=test_engine)
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
    db_session.flush()
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
    db_session.flush()
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
    db_session.flush()
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
        id="category_test_layer",
        format_="raster",
        type_="continuous",
        path="/data/test.tif",
        unit="celsius",
        metadata_={"title": {"en": "Test Layer", "fr": "Couche de test"}},
        dataset_id=db_dataset.id,
    )
    db_session.add(db_layer)
    db_session.flush()
    db_session.refresh(db_category)
    yield db_category


# =============================================================================
# Layer Fixtures
# =============================================================================


@pytest.fixture
def layer(db_session, dataset, sample_layer_metadata):
    """Create a single layer belonging to a dataset."""
    db_layer = Layer(
        id="test_layer",
        format_="raster",
        type_="continuous",
        path="/data/test.tif",
        unit="celsius",
        metadata_=sample_layer_metadata,
        dataset_id=dataset.id,
    )
    db_session.add(db_layer)
    db_session.flush()
    db_session.refresh(db_layer)
    yield db_layer


@pytest.fixture
def multiple_layers(db_session, sample_category_metadata, sample_dataset_metadata):
    """Create 15 layers for pagination testing."""
    db_category = Category(metadata_=sample_category_metadata)
    db_session.add(db_category)
    db_session.flush()
    db_dataset = Dataset(metadata_=sample_dataset_metadata, category_id=db_category.id)
    db_session.add(db_dataset)
    db_session.flush()

    layers = []
    for i in range(1, 16):
        db_layer = Layer(
            id=f"layer_{i:02d}",
            format_="raster" if i % 2 == 0 else "vector",
            type_="continuous" if i % 2 == 0 else None,
            path=f"/data/layer_{i:02d}.tif",
            metadata_={
                "title": {"en": f"Layer {i:02d}", "fr": f"Couche {i:02d}"},
                "description": {"en": f"Layer number {i}", "fr": f"Couche numero {i}"},
            },
            dataset_id=db_dataset.id,
        )
        layers.append(db_layer)
    db_session.add_all(layers)
    db_session.flush()
    for layer in layers:
        db_session.refresh(layer)
    yield layers


@pytest.fixture
def searchable_layers(db_session, sample_category_metadata, sample_dataset_metadata):
    """Create layers with distinct titles for search testing."""
    db_category = Category(metadata_=sample_category_metadata)
    db_session.add(db_category)
    db_session.flush()
    db_dataset = Dataset(metadata_=sample_dataset_metadata, category_id=db_category.id)
    db_session.add(db_dataset)
    db_session.flush()

    layers_data = [
        {"title": {"en": "Hudson Bay Temperature", "fr": "Temperature de la baie d'Hudson"}},
        {"title": {"en": "Arctic Ice Coverage", "fr": "Couverture de glace arctique"}},
        {"title": {"en": "Permafrost Depth", "fr": "Profondeur du pergelisol"}},
    ]
    layers = []
    for i, md in enumerate(layers_data):
        db_layer = Layer(
            id=f"search_{i}",
            format_="raster",
            type_="continuous",
            path=f"/data/search_{i}.tif",
            metadata_=md,
            dataset_id=db_dataset.id,
        )
        layers.append(db_layer)
    db_session.add_all(layers)
    db_session.flush()
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
    db_session.flush()
    db_session.refresh(db_dataset)
    yield db_dataset


@pytest.fixture
def layer_with_dataset(db_session, dataset, sample_layer_metadata):
    """Create a layer that belongs to a dataset."""
    db_layer = Layer(
        id="test_layer_with_dataset",
        format_="raster",
        type_="continuous",
        path="/data/test.tif",
        unit="celsius",
        metadata_=sample_layer_metadata,
        dataset_id=dataset.id,
    )
    db_session.add(db_layer)
    db_session.flush()
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
    db_session.flush()
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
    db_session.flush()
    for d in datasets:
        db_session.refresh(d)
    yield datasets


# =============================================================================
# COG (Cloud Optimized GeoTIFF) Fixtures
# =============================================================================


@pytest.fixture
def minimal_cog(tmp_path):
    """Create a minimal Cloud Optimized GeoTIFF for integration testing.

    Generates a 256x256 uint8 raster covering a portion of the Hudson Bay
    region (lon -90 to -80, lat 50 to 60) in EPSG:4326.
    """
    import numpy as np
    import rasterio
    from rasterio.transform import from_bounds

    filepath = tmp_path / "test_cog.tif"
    rng = np.random.default_rng(42)
    data = rng.integers(0, 255, (1, 256, 256), dtype=np.uint8)
    transform = from_bounds(-90, 50, -80, 60, 256, 256)

    profile = {
        "driver": "GTiff",
        "dtype": "uint8",
        "width": 256,
        "height": 256,
        "count": 1,
        "crs": "EPSG:4326",
        "transform": transform,
        "tiled": True,
        "blockxsize": 256,
        "blockysize": 256,
        "compress": "deflate",
    }

    with rasterio.open(filepath, "w", **profile) as dst:
        dst.write(data)

    return str(filepath)


# =============================================================================
# Analysis Integration Fixtures
# =============================================================================


@pytest.fixture
def analysis_client(db_session, tmp_path, monkeypatch):
    """Test client wired for analysis integration tests.

    Creates two GeoTIFFs with uniform, known pixel values in EPSG:4326 covering
    the standard test polygon area, inserts matching Layer records (id=peat_cog /
    carbon_cog) into the DB, and patches _s3_uri so rasterio opens the local
    files directly instead of reaching out to S3.
    """
    import numpy as np
    import rasterio
    from rasterio.transform import from_bounds

    import services.zonal_stats

    # Extent covers the test polygon (-84.5→-83.5 lon, 56.5→57.5 lat) with buffer.
    transform = from_bounds(-85.0, 56.0, -83.0, 58.0, 256, 256)

    peat_path = str(tmp_path / "peat_cog.tif")
    carbon_path = str(tmp_path / "carbon_cog.tif")

    for path, value in [(peat_path, 200.0), (carbon_path, 80.0)]:
        data = np.full((1, 256, 256), value, dtype=np.float32)
        profile = {
            "driver": "GTiff",
            "dtype": "float32",
            "width": 256,
            "height": 256,
            "count": 1,
            "crs": "EPSG:4326",
            "transform": transform,
        }
        with rasterio.open(path, "w", **profile) as dst:
            dst.write(data)

    db_category = Category(metadata_={"title": {"en": "Test", "fr": "Test"}})
    db_session.add(db_category)
    db_session.flush()

    db_dataset = Dataset(
        metadata_={"title": {"en": "Test", "fr": "Test"}},
        category_id=db_category.id,
    )
    db_session.add(db_dataset)
    db_session.flush()

    db_session.add_all([
        Layer(
            id="peat_cog",
            format_="raster",
            path=peat_path,
            unit="cm",
            metadata_={"title": {"en": "Peat Depth", "fr": "Profondeur de la Tourbe"}},
            dataset_id=db_dataset.id,
        ),
        Layer(
            id="carbon_cog",
            format_="raster",
            path=carbon_path,
            unit="kg/m²",
            metadata_={"title": {"en": "Carbon Storage", "fr": "Stockage de Carbone"}},
            dataset_id=db_dataset.id,
        ),
    ])
    db_session.flush()

    # Return the local path as-is so rasterio opens it directly.
    monkeypatch.setattr(services.zonal_stats, "_s3_uri", lambda db_path, bucket: db_path)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()
