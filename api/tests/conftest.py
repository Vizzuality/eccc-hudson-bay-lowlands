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
from models import Raster

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


@pytest.fixture
def sample_raster(db_session: Session) -> Generator[Raster, None, None]:
    """Create a single raster in the database.

    Creates a test raster with standard attributes for single-record tests.
    The raster is automatically cleaned up after the test via transaction rollback.
    """
    raster = Raster(
        name="Test Raster",
        crs="EPSG:4326",
        path="/data/test_raster.tif",
        description="A test raster for integration testing",
    )
    db_session.add(raster)
    db_session.commit()
    db_session.refresh(raster)
    yield raster


@pytest.fixture
def sample_rasters(db_session: Session) -> Generator[list[Raster], None, None]:
    """Create multiple rasters in the database for pagination testing.

    Creates 15 rasters with varying attributes to test pagination scenarios.
    The rasters are automatically cleaned up after the test via transaction rollback.
    """
    rasters = []
    for i in range(1, 16):
        raster = Raster(
            name=f"Raster {i:02d}",
            crs="EPSG:4326" if i % 2 == 0 else "EPSG:32618",
            path=f"/data/raster_{i:02d}.tif",
            description=f"Test raster number {i}" if i % 3 != 0 else None,
        )
        rasters.append(raster)

    db_session.add_all(rasters)
    db_session.commit()

    # Refresh all rasters to get their IDs
    for raster in rasters:
        db_session.refresh(raster)

    yield rasters
