"""Tests for health check endpoints."""


def test_health_returns_200(client):
    """Test that health endpoint returns 200 status code."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_structure(client):
    """Test that health endpoint returns expected structure."""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
