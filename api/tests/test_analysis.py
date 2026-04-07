"""Integration tests for POST /analysis endpoint."""

# ─────────────────────────────────────────────────────────────────────────────
# Test geometry constants
# ─────────────────────────────────────────────────────────────────────────────

# A ~6,700 km² polygon centred around (-84, 57) — well inside the HBL study area.
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

# Same area as a MultiPolygon.
VALID_MULTIPOLYGON_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[
            [
                [-84.5, 56.5],
                [-83.5, 56.5],
                [-83.5, 57.5],
                [-84.5, 57.5],
                [-84.5, 56.5],
            ]
        ]],
    },
    "properties": {},
}

# FeatureCollection with a single valid feature.
VALID_FEATURE_COLLECTION = {
    "type": "FeatureCollection",
    "features": [
        {
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
    ],
}

# FeatureCollection with two adjacent polygons whose union is valid.
FEATURE_COLLECTION_MULTIPLE_FEATURES = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-84.5, 56.5],
                    [-83.5, 56.5],
                    [-83.5, 57.0],
                    [-84.5, 57.0],
                    [-84.5, 56.5],
                ]],
            },
            "properties": {},
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-84.5, 57.0],
                    [-83.5, 57.0],
                    [-83.5, 57.5],
                    [-84.5, 57.5],
                    [-84.5, 57.0],
                ]],
            },
            "properties": {},
        },
    ],
}

# A ~0.007 km² polygon — below MIN_AREA_KM2 (1.0 km²).
TOO_SMALL_POLYGON_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-84.000, 57.000],
            [-84.001, 57.000],
            [-84.001, 57.001],
            [-84.000, 57.001],
            [-84.000, 57.000],
        ]],
    },
    "properties": {},
}

# A ~16,600,000 km² polygon covering most of North America — above MAX_AREA_KM2 (200,000 km²).
TOO_LARGE_POLYGON_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-140.0, 45.0],
            [-50.0, 45.0],
            [-50.0, 75.0],
            [-140.0, 75.0],
            [-140.0, 45.0],
        ]],
    },
    "properties": {},
}

# A ~111 km² polygon in France — entirely outside the HBL study area.
OUTSIDE_HBL_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [2.0, 48.0],
            [3.0, 48.0],
            [3.0, 49.0],
            [2.0, 49.0],
            [2.0, 48.0],
        ]],
    },
    "properties": {},
}

# A ~27,000 km² polygon that crosses the HBL bbox western edge at lon=-117.
# Extends from -119 to -115 (partly outside, partly inside) — should pass because
# the bbox check uses intersection, not containment.
PARTIALLY_OUTSIDE_HBL_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-119.0, 56.5],
            [-115.0, 56.5],
            [-115.0, 57.5],
            [-119.0, 57.5],
            [-119.0, 56.5],
        ]],
    },
    "properties": {},
}

# A self-intersecting (bowtie) polygon — crosses itself between vertices 0→1 and 2→3.
SELF_INTERSECTING_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-84.0, 57.0],
            [-83.0, 58.0],
            [-83.0, 57.0],
            [-84.0, 58.0],
            [-84.0, 57.0],
        ]],
    },
    "properties": {},
}


# =============================================================================
# Happy path
# =============================================================================


def test_valid_polygon_feature_returns_200(client):
    response = client.post("/analysis/", json=VALID_POLYGON_FEATURE)
    assert response.status_code == 200


def test_valid_polygon_feature_response_body(client):
    response = client.post("/analysis/", json=VALID_POLYGON_FEATURE)
    assert response.json() == {"status": "ok"}


def test_valid_multipolygon_feature_returns_200(client):
    response = client.post("/analysis/", json=VALID_MULTIPOLYGON_FEATURE)
    assert response.status_code == 200


def test_valid_feature_collection_single_feature_returns_200(client):
    response = client.post("/analysis/", json=VALID_FEATURE_COLLECTION)
    assert response.status_code == 200


def test_valid_feature_collection_multiple_features_returns_200(client):
    response = client.post("/analysis/", json=FEATURE_COLLECTION_MULTIPLE_FEATURES)
    assert response.status_code == 200


def test_polygon_partially_outside_hbl_bbox_still_returns_200(client):
    """Geometry that extends beyond the HBL bbox passes as long as it intersects it."""
    response = client.post("/analysis/", json=PARTIALLY_OUTSIDE_HBL_FEATURE)
    assert response.status_code == 200


# =============================================================================
# Schema validation failures (Pydantic → 422)
# =============================================================================


def test_empty_body_returns_422(client):
    response = client.post("/analysis/", json={})
    assert response.status_code == 422


def test_bare_polygon_geometry_object_returns_422(client):
    """A raw GeoJSON geometry dict (not wrapped in a Feature) is rejected."""
    response = client.post("/analysis/", json={
        "type": "Polygon",
        "coordinates": [[[-84.5, 56.5], [-83.5, 56.5], [-83.5, 57.5], [-84.5, 56.5]]],
    })
    assert response.status_code == 422


def test_feature_with_point_geometry_returns_422(client):
    """Point geometry is not accepted — only Polygon and MultiPolygon."""
    response = client.post("/analysis/", json={
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-84.0, 57.0]},
        "properties": {},
    })
    assert response.status_code == 422


def test_feature_with_linestring_geometry_returns_422(client):
    """LineString geometry is not accepted."""
    response = client.post("/analysis/", json={
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [[-84.0, 57.0], [-83.0, 57.0]],
        },
        "properties": {},
    })
    assert response.status_code == 422


def test_feature_with_null_geometry_returns_422(client):
    """Null geometry on a Feature is rejected."""
    response = client.post("/analysis/", json={
        "type": "Feature",
        "geometry": None,
        "properties": {},
    })
    assert response.status_code == 422


def test_empty_feature_collection_returns_422(client):
    """FeatureCollection with zero features is rejected."""
    response = client.post("/analysis/", json={"type": "FeatureCollection", "features": []})
    assert response.status_code == 422


def test_feature_collection_with_non_polygon_feature_returns_422(client):
    """FeatureCollection containing a LineString feature is rejected."""
    response = client.post("/analysis/", json={
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[-84.0, 57.0], [-83.0, 57.0]],
                },
                "properties": {},
            }
        ],
    })
    assert response.status_code == 422


# =============================================================================
# Semantic validation failures (service pipeline → HTTPException 422)
# =============================================================================


def test_self_intersecting_polygon_returns_422(client):
    response = client.post("/analysis/", json=SELF_INTERSECTING_FEATURE)
    assert response.status_code == 422


def test_self_intersecting_polygon_error_mentions_invalid(client):
    response = client.post("/analysis/", json=SELF_INTERSECTING_FEATURE)
    assert "invalid" in response.json()["detail"].lower()


def test_polygon_below_minimum_area_returns_422(client):
    response = client.post("/analysis/", json=TOO_SMALL_POLYGON_FEATURE)
    assert response.status_code == 422


def test_polygon_below_minimum_area_error_mentions_minimum(client):
    response = client.post("/analysis/", json=TOO_SMALL_POLYGON_FEATURE)
    assert "minimum" in response.json()["detail"].lower()


def test_polygon_above_maximum_area_returns_422(client):
    response = client.post("/analysis/", json=TOO_LARGE_POLYGON_FEATURE)
    assert response.status_code == 422


def test_polygon_above_maximum_area_error_mentions_maximum(client):
    response = client.post("/analysis/", json=TOO_LARGE_POLYGON_FEATURE)
    assert "maximum" in response.json()["detail"].lower()


def test_polygon_outside_hbl_bounds_returns_422(client):
    response = client.post("/analysis/", json=OUTSIDE_HBL_FEATURE)
    assert response.status_code == 422


def test_polygon_outside_hbl_bounds_error_mentions_hudson_bay(client):
    response = client.post("/analysis/", json=OUTSIDE_HBL_FEATURE)
    assert "hudson bay" in response.json()["detail"].lower()
