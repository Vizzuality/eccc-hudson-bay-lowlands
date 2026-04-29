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


# Dataset metadata used by the analysis fixture and the corresponding tests.
# IDs are explicit (1, 2, 3) to match the dataset_id values declared in WIDGET_CONFIG.
PEAT_CARBON_DATASET_METADATA = {
    "title": {"en": "Peat & Carbon", "fr": "Tourbe et Carbone"},
    "description": {
        "en": "Ground-measured peat depth and carbon storage in the Hudson Bay Lowlands.",
        "fr": "Profondeur de tourbe mesurée sur le terrain et stockage de carbone dans les basses terres de la baie d'Hudson.",
    },
    "source": {"en": "Borealis", "fr": "Borealis"},
    "citation": {"en": "Li et al., 2024.", "fr": "Li et al., 2024."},
}

WATER_DYNAMICS_DATASET_METADATA = {
    "title": {"en": "Dynamic Surface Water", "fr": "Eaux de Surface Dynamiques"},
    "description": {
        "en": "Inundation frequency and trends across the Hudson Bay Lowlands.",
        "fr": "Fréquence et tendances d'inondation dans les basses terres de la baie d'Hudson.",
    },
    "source": {"en": "ECCC", "fr": "ECCC"},
    "citation": {"en": "ECCC, 2024.", "fr": "ECCC, 2024."},
}

FLOOD_SUSCEPTIBILITY_DATASET_METADATA = {
    "title": {"en": "Flood Susceptibility", "fr": "Vulnérabilité aux Inondations"},
    "description": {
        "en": "Flood susceptibility index for the Hudson Bay Lowlands.",
        "fr": "Indice de vulnérabilité aux inondations pour les basses terres de la baie d'Hudson.",
    },
    "source": {"en": "ECCC", "fr": "ECCC"},
    "citation": {"en": "ECCC, 2024.", "fr": "ECCC, 2024."},
}


@pytest.fixture
def analysis_client(db_session, tmp_path, monkeypatch):
    """Test client wired for analysis integration tests.

    Creates five GeoTIFFs with uniform, known pixel values in EPSG:4326 covering
    the standard test polygon area, inserts three Datasets (with explicit IDs 1/2/3
    matching WIDGET_CONFIG) and matching Layer records, and patches _s3_uri so
    rasterio opens the local files directly instead of reaching out to S3.

    Dataset → layer wiring:
      - dataset 1 (Peat & Carbon):         peat_cog, carbon_cog
      - dataset 2 (Dynamic Surface Water): inundation_frequency_cog, inundation_trends_cog
      - dataset 3 (Flood Susceptibility):  flood_susceptibility_cog

    Pixel-value choices and what they exercise:
      - peat_cog:                  uniform 200.0 (float32) — mean/max/histogram path
      - carbon_cog:                uniform 80.0  (float32) — sum scale/precision path
      - inundation_frequency_cog:  uniform 100   (uint8)   — frac_sum [100] = 100%, mean = 100
      - inundation_trends_cog:     uniform 4     (uint8)   — frac_sum [4]   = 100%
      - flood_susceptibility_cog:  uniform 50    (uint8)   — mean = 50, frac_range [31,80] = 100% (moderate)
    """
    import numpy as np
    import rasterio
    from rasterio.transform import from_bounds

    import services.zonal_stats

    # Extent covers the test polygon (-84.5→-83.5 lon, 56.5→57.5 lat) with buffer.
    transform = from_bounds(-85.0, 56.0, -83.0, 58.0, 256, 256)

    peat_path = str(tmp_path / "peat_cog.tif")
    carbon_path = str(tmp_path / "carbon_cog.tif")
    inundation_freq_path = str(tmp_path / "inundation_frequency_cog.tif")
    inundation_trends_path = str(tmp_path / "inundation_trends_cog.tif")
    flood_susc_path = str(tmp_path / "flood_susceptibility_cog.tif")

    raster_specs = [
        (peat_path, 200.0, "float32"),
        (carbon_path, 80.0, "float32"),
        (inundation_freq_path, 100, "uint8"),
        (inundation_trends_path, 4, "uint8"),
        (flood_susc_path, 50, "uint8"),
    ]

    for path, value, dtype in raster_specs:
        data = np.full((1, 256, 256), value, dtype=dtype)
        profile = {
            "driver": "GTiff",
            "dtype": dtype,
            "width": 256,
            "height": 256,
            "count": 1,
            "crs": "EPSG:4326",
            "transform": transform,
        }
        with rasterio.open(path, "w", **profile) as dst:
            dst.write(data)

    db_category = Category(metadata_={"title": {"en": "Environment", "fr": "Environnement"}})
    db_session.add(db_category)
    db_session.flush()

    # Explicit IDs match WIDGET_CONFIG: peat_carbon→1, water_dynamics→2, flood_susceptibility→3.
    peat_carbon_ds = Dataset(id=1, metadata_=PEAT_CARBON_DATASET_METADATA, category_id=db_category.id)
    water_dynamics_ds = Dataset(id=2, metadata_=WATER_DYNAMICS_DATASET_METADATA, category_id=db_category.id)
    flood_susc_ds = Dataset(id=3, metadata_=FLOOD_SUSCEPTIBILITY_DATASET_METADATA, category_id=db_category.id)
    db_session.add_all([peat_carbon_ds, water_dynamics_ds, flood_susc_ds])
    db_session.flush()

    db_session.add_all([
        Layer(
            id="peat_cog",
            format_="raster",
            path=peat_path,
            unit="cm",
            metadata_={"title": {"en": "Peat Depth", "fr": "Profondeur de la Tourbe"}},
            dataset_id=peat_carbon_ds.id,
        ),
        Layer(
            id="carbon_cog",
            format_="raster",
            path=carbon_path,
            unit="kg/m²",
            metadata_={"title": {"en": "Carbon Storage", "fr": "Stockage de Carbone"}},
            dataset_id=peat_carbon_ds.id,
        ),
        Layer(
            id="inundation_frequency_cog",
            format_="raster",
            path=inundation_freq_path,
            unit="%",
            metadata_={"title": {"en": "Inundation Frequency", "fr": "Fréquence des Inondations"}},
            dataset_id=water_dynamics_ds.id,
        ),
        Layer(
            id="inundation_trends_cog",
            format_="raster",
            path=inundation_trends_path,
            unit="category",
            metadata_={"title": {"en": "Inundation Trends", "fr": "Tendances des Inondations"}},
            dataset_id=water_dynamics_ds.id,
        ),
        Layer(
            id="flood_susceptibility_cog",
            format_="raster",
            path=flood_susc_path,
            unit="%",
            metadata_={"title": {"en": "Flood Susceptibility Index", "fr": "Indice de vulnérabilité aux inondations"}},
            dataset_id=flood_susc_ds.id,
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
