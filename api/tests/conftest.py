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

from main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    return TestClient(app, raise_server_exceptions=False)
