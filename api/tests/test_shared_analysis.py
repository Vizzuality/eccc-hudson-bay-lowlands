"""Tests for the shared-analysis endpoints (POST/GET /analysis/v2/share) and cleanup."""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest

from models.shared_analysis import SharedAnalysis
from services.shared_analysis import SHARED_ANALYSIS_TTL_DAYS, delete_expired

# Bound on the clock skew between the test process and the DB ``server_default=func.now()``
# call. Tests using this assert ``created_at`` is "recent" without flaking on slow CI.
RECENT_WINDOW = timedelta(minutes=5)

# A ~6,700 km² polygon centred on (-84, 57) — well inside the HBL study area and the
# extent of the rasters created by the ``analysis_client`` fixture. Mirrors the
# constant in tests/test_analysis.py rather than importing across test modules.
VALID_POLYGON_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-84.5, 56.5],
            [-83.5, 56.5],
            [-83.5, 57.5],
            [-84.5, 57.5],
            [-84.5, 56.5],
        ]],
    },
    "properties": {},
}

# A 1° square at (0, 0) — outside the HBL study area. Used to verify that the
# v2 geometry pipeline rejects the geojson when sharing, even if the caller
# sends a payload that *would* have rendered successfully on an earlier dataset.
OUT_OF_BOUNDS_POLYGON_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [0.0, 0.0],
            [1.0, 0.0],
            [1.0, 1.0],
            [0.0, 1.0],
            [0.0, 0.0],
        ]],
    },
    "properties": {},
}


@pytest.fixture
def shared_analysis_create_body(analysis_client):
    """Run POST /analysis/v2 with a valid polygon and return a payload ready to share.

    Uses the real analysis pipeline so the captured ``AnalysisResponse`` truly
    conforms to the production schema — what a user would have just seen in the FE.
    """
    response = analysis_client.post("/analysis/v2", json=VALID_POLYGON_FEATURE)
    assert response.status_code == 200, response.text
    return {"analysis": response.json(), "geojson": VALID_POLYGON_FEATURE}


# ───────────────────────────── POST /analysis/v2/share ──────────────────────


def test_share_returns_id(analysis_client, shared_analysis_create_body):
    """Happy path: POST returns 201 with a UUID id."""
    response = analysis_client.post("/analysis/v2/share", json=shared_analysis_create_body)
    assert response.status_code == 201, response.text

    body = response.json()
    UUID(body["id"])  # raises if not a UUID
    assert set(body.keys()) == {"id"}


def test_share_persists_row(analysis_client, db_session, shared_analysis_create_body):
    """POST inserts a SharedAnalysis row that is retrievable in the same session."""
    response = analysis_client.post("/analysis/v2/share", json=shared_analysis_create_body)
    assert response.status_code == 201

    share_id = UUID(response.json()["id"])
    row = db_session.get(SharedAnalysis, share_id)
    assert row is not None
    assert row.analysis == shared_analysis_create_body["analysis"]
    assert row.geojson == shared_analysis_create_body["geojson"]


def test_share_rejects_missing_geojson(analysis_client, shared_analysis_create_body):
    """POST returns 422 when a required field is missing from the body."""
    body = dict(shared_analysis_create_body)
    del body["geojson"]
    response = analysis_client.post("/analysis/v2/share", json=body)
    assert response.status_code == 422


def test_share_rejects_invalid_analysis_shape(analysis_client, shared_analysis_create_body):
    """POST returns 422 when the analysis payload does not match AnalysisResponse."""
    body = {**shared_analysis_create_body, "analysis": {"foo": "bar"}}
    response = analysis_client.post("/analysis/v2/share", json=body)
    assert response.status_code == 422


def test_share_rejects_geojson_outside_hbl(analysis_client, shared_analysis_create_body):
    """POST returns 422 when the geojson fails the v2 geometry pipeline (outside HBL)."""
    body = {**shared_analysis_create_body, "geojson": OUT_OF_BOUNDS_POLYGON_FEATURE}
    response = analysis_client.post("/analysis/v2/share", json=body)
    assert response.status_code == 422


# ───────────────────────────── GET /analysis/v2/share/{id} ──────────────────


def test_get_share_happy_path(analysis_client, shared_analysis_create_body):
    """GET returns the same analysis + geojson that were posted, plus the row id and created_at."""
    create_response = analysis_client.post("/analysis/v2/share", json=shared_analysis_create_body)
    share_id = create_response.json()["id"]

    get_response = analysis_client.get(f"/analysis/v2/share/{share_id}")
    assert get_response.status_code == 200, get_response.text

    body = get_response.json()
    assert body["id"] == share_id
    assert body["analysis"] == shared_analysis_create_body["analysis"]
    assert body["geojson"] == shared_analysis_create_body["geojson"]
    assert "created_at" in body


def test_get_share_returns_created_at_close_to_now(analysis_client, shared_analysis_create_body):
    """The ``created_at`` returned by GET is the row's persisted timestamp (near now, tz-aware)."""
    create_response = analysis_client.post("/analysis/v2/share", json=shared_analysis_create_body)
    share_id = create_response.json()["id"]

    get_response = analysis_client.get(f"/analysis/v2/share/{share_id}")
    assert get_response.status_code == 200, get_response.text

    created_at = datetime.fromisoformat(get_response.json()["created_at"])
    assert created_at.tzinfo is not None, "created_at must be timezone-aware"
    assert abs(datetime.now(timezone.utc) - created_at) < RECENT_WINDOW


def test_get_share_created_at_matches_row(analysis_client, db_session, shared_analysis_create_body):
    """``created_at`` in the GET response equals the value persisted in the DB row."""
    create_response = analysis_client.post("/analysis/v2/share", json=shared_analysis_create_body)
    share_id = UUID(create_response.json()["id"])

    row = db_session.get(SharedAnalysis, share_id)
    assert row is not None

    get_response = analysis_client.get(f"/analysis/v2/share/{share_id}")
    assert get_response.status_code == 200, get_response.text

    assert datetime.fromisoformat(get_response.json()["created_at"]) == row.created_at


def test_get_share_missing_returns_410(client):
    """GET on an unknown UUID returns 410 with the expired-detail message."""
    response = client.get(f"/analysis/v2/share/{uuid4()}")
    assert response.status_code == 410
    assert "expired" in response.json()["detail"].lower()


def test_get_share_invalid_uuid_returns_422(client):
    """GET on a non-UUID path parameter returns 422 from FastAPI's path validation."""
    response = client.get("/analysis/v2/share/not-a-uuid")
    assert response.status_code == 422


def test_get_share_legacy_payload_without_aoi_size_returns_200(
    analysis_client, db_session, shared_analysis_create_body
):
    """Backward compatibility: snapshots persisted before ``aoi_size`` was added are still served.

    The field was introduced in commit 6a57de6; ``aoi_size`` is intentionally
    optional on ``AnalysisResponse`` so older share links keep working. This
    test simulates a pre-existing row by stripping the key before persisting.
    """
    legacy_analysis = {
        k: v for k, v in shared_analysis_create_body["analysis"].items() if k != "aoi_size"
    }
    assert "aoi_size" not in legacy_analysis

    row = SharedAnalysis(analysis=legacy_analysis, geojson=VALID_POLYGON_FEATURE)
    db_session.add(row)
    db_session.flush()

    response = analysis_client.get(f"/analysis/v2/share/{row.id}")
    assert response.status_code == 200, response.text
    assert response.json()["analysis"]["aoi_size"] is None


def test_get_share_stale_schema_returns_410(client, db_session):
    """GET returns 410 when the stored analysis no longer matches AnalysisResponse.

    Simulates the case where the widget schema changes between when the link was
    created and when it is opened.
    """
    row = SharedAnalysis(
        analysis={"foo": "bar"},  # intentionally does not match AnalysisResponse
        geojson=VALID_POLYGON_FEATURE,
    )
    db_session.add(row)
    db_session.flush()

    response = client.get(f"/analysis/v2/share/{row.id}")
    assert response.status_code == 410
    assert "expired" in response.json()["detail"].lower()


# ───────────────────────────── delete_expired (cleanup) ─────────────────────


def test_delete_expired_removes_old_rows(db_session):
    """delete_expired removes rows older than the TTL and leaves fresh ones alone."""
    fresh = SharedAnalysis(
        analysis={"a": 1},
        geojson={"b": 2},
        created_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    stale = SharedAnalysis(
        analysis={"a": 1},
        geojson={"b": 2},
        created_at=datetime.now(timezone.utc) - timedelta(days=SHARED_ANALYSIS_TTL_DAYS + 1),
    )
    db_session.add_all([fresh, stale])
    db_session.flush()

    count = delete_expired(db_session)
    assert count == 1

    db_session.expire_all()
    assert db_session.get(SharedAnalysis, fresh.id) is not None
    assert db_session.get(SharedAnalysis, stale.id) is None


def test_delete_expired_returns_zero_when_nothing_to_delete(db_session):
    """delete_expired returns 0 and deletes nothing when all rows are within the TTL."""
    fresh = SharedAnalysis(
        analysis={"a": 1},
        geojson={"b": 2},
        created_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db_session.add(fresh)
    db_session.flush()

    count = delete_expired(db_session)
    assert count == 0
    assert db_session.get(SharedAnalysis, fresh.id) is not None


def test_delete_expired_honors_custom_ttl(db_session):
    """The ``ttl_days`` argument lets callers override the default TTL."""
    row_5d_old = SharedAnalysis(
        analysis={"a": 1},
        geojson={"b": 2},
        created_at=datetime.now(timezone.utc) - timedelta(days=5),
    )
    db_session.add(row_5d_old)
    db_session.flush()

    # With TTL=3 days the 5-day-old row should be removed.
    count = delete_expired(db_session, ttl_days=3)
    assert count == 1
    db_session.expire_all()
    assert db_session.get(SharedAnalysis, row_5d_old.id) is None
