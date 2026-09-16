"""Tests for the centralized exception handlers.

The unhandled-exception tests exist because the catch-all handler used to return
``str(exc)`` as the public ``detail``, leaking SQL statements, bound parameters,
internal hostnames and server filesystem paths to any caller.
"""

import logging
import uuid
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import ProgrammingError

from db.database import get_db
from main import app
from services.shared_analysis import EXPIRED_DETAIL

# Marker planted inside the bound parameters of the simulated database error. If
# it ever shows up in a response body, the handler is leaking again.
LEAK_CANARY = "tok_live_LEAKCANARY"

FAILING_SQL = "SELECT layers.id, layers.path FROM layers LIMIT %(param_1)s"


def _database_error() -> ProgrammingError:
    """A realistic SQLAlchemy error — its str() carries SQL and parameters."""
    return ProgrammingError(
        FAILING_SQL,
        {"param_1": 10, "secret_token": LEAK_CANARY},
        Exception("column layers.unit does not exist"),
    )


@pytest.fixture
def failing_client():
    """Test client whose database session raises on every query."""

    def override_get_db():
        session = MagicMock()
        # The read routers reach the DB through several Session methods; make
        # every one of them raise so the test doesn't depend on which is used.
        for method in ("execute", "scalar", "scalars", "get", "query"):
            getattr(session, method).side_effect = _database_error()
        yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app, raise_server_exceptions=False)
    finally:
        app.dependency_overrides.clear()


# =============================================================================
# Unhandled exceptions - the leak
# =============================================================================


def test_unhandled_exception_returns_500(failing_client):
    response = failing_client.get("/layers")
    assert response.status_code == 500


def test_unhandled_exception_detail_is_generic(failing_client):
    response = failing_client.get("/layers")
    assert "Internal server error" in response.json()["detail"]


def test_unhandled_exception_does_not_leak_sql_or_parameters(failing_client):
    """Regression test: no part of the exception text reaches the client."""
    response = failing_client.get("/layers")
    body = response.text

    assert LEAK_CANARY not in body
    assert "SELECT" not in body
    assert "[SQL:" not in body
    assert "[parameters:" not in body
    assert "ProgrammingError" not in body
    assert "layers.unit" not in body


def test_unhandled_exception_response_structure(failing_client):
    response = failing_client.get("/layers")
    data = response.json()

    assert data["status_code"] == 500
    assert data["method"] == "GET"
    assert data["path"] == "/layers"
    assert set(data) == {"status_code", "detail", "error_id", "method", "path"}


# =============================================================================
# Unhandled exceptions - error id correlation
# =============================================================================


def test_unhandled_exception_returns_a_uuid_error_id(failing_client):
    response = failing_client.get("/layers")
    error_id = response.json()["error_id"]
    assert uuid.UUID(error_id)


def test_error_id_is_unique_per_request(failing_client):
    first = failing_client.get("/layers").json()["error_id"]
    second = failing_client.get("/layers").json()["error_id"]
    assert first != second


def test_error_id_appears_in_the_log_record(failing_client, caplog):
    """The id the client is told to quote must be greppable in the logs."""
    with caplog.at_level(logging.ERROR, logger="exception_handlers"):
        response = failing_client.get("/layers")

    error_id = response.json()["error_id"]
    assert error_id in caplog.text


def test_full_exception_detail_is_still_logged(failing_client, caplog):
    """Hiding the detail from the client must not hide it from operators."""
    with caplog.at_level(logging.ERROR, logger="exception_handlers"):
        failing_client.get("/layers")

    assert LEAK_CANARY in caplog.text
    assert "column layers.unit does not exist" in caplog.text
    assert "Traceback" in caplog.text


# =============================================================================
# HTTPException - authored details must survive unchanged
# =============================================================================


def test_http_exception_preserves_authored_detail(client):
    """A deliberate HTTPException detail is ours to show, and must not be flattened."""
    response = client.get(f"/analysis/v2/share/{uuid.uuid4()}")

    assert response.status_code == 410
    assert response.json()["detail"] == EXPIRED_DETAIL


def test_http_exception_response_structure(client):
    response = client.get("/does-not-exist")
    data = response.json()

    assert data["status_code"] == 404
    assert data["detail"] == "Not Found"
    assert data["method"] == "GET"
    assert data["path"] == "/does-not-exist"


def test_http_exception_has_no_error_id(client):
    """error_id is specific to unhandled exceptions — 4xx responses don't carry one."""
    response = client.get("/does-not-exist")
    assert "error_id" not in response.json()


# =============================================================================
# RequestValidationError - client input is reflected back
# =============================================================================


def test_validation_error_returns_errors_and_body(client):
    response = client.post("/analysis/v2", json={"type": "NotAGeoJSONType"})
    data = response.json()

    assert response.status_code == 422
    assert data["detail"] == "Validation error"
    assert isinstance(data["errors"], list)
    assert data["errors"]
    assert data["body"] == {"type": "NotAGeoJSONType"}
    assert data["path"] == "/analysis/v2"
