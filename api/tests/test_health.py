"""Tests for health check endpoints."""

from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from db.database import get_db
from main import app


def test_health_returns_200(client):
    """Test that health endpoint returns 200 status code."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_structure(client):
    """Test that health endpoint returns expected structure with services."""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "services" in data
    assert data["services"]["api"] == "healthy"
    assert data["services"]["database"] == "healthy"


def test_health_returns_503_when_db_unavailable():
    """Test that health endpoint returns 503 when database query fails."""

    def override_get_db():
        mock_session = MagicMock()
        mock_session.execute.side_effect = Exception("Database connection failed")
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        test_client = TestClient(app, raise_server_exceptions=False)
        response = test_client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["services"]["api"] == "healthy"
        assert data["services"]["database"] == "unhealthy"
    finally:
        app.dependency_overrides.clear()


def test_health_unhealthy_response_structure():
    """Test unhealthy response structure when database query fails."""

    def override_get_db():
        mock_session = MagicMock()
        mock_session.execute.side_effect = Exception("Query execution failed")
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        test_client = TestClient(app, raise_server_exceptions=False)
        response = test_client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert data["status"] == "unhealthy"
        assert data["services"]["api"] == "healthy"
        assert data["services"]["database"] == "unhealthy"
    finally:
        app.dependency_overrides.clear()
