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


# =============================================================================
# Integration — peat_carbon widget output
#
# Uses the `analysis_client` fixture which:
#   - Creates two local GeoTIFFs with uniform pixel values
#       peat_cog:   all pixels = 200.0 cm
#       carbon_cog: all pixels = 80.0 kg/m²
#   - Inserts matching Layer records (id=peat_cog / carbon_cog) into the DB
#   - Patches _s3_uri so rasterio opens local files instead of S3
# =============================================================================


def test_analysis_with_real_rasters_returns_200(analysis_client):
    response = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE)
    assert response.status_code == 200


def test_analysis_response_contains_peat_carbon_widget(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert "peat_carbon" in data


def test_peat_carbon_unit_is_cm(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert data["peat_carbon"]["unit"] == "cm"


def test_peat_carbon_stats_contains_all_fields(analysis_client):
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["stats"]
    assert "peat_depth_avg" in stats
    assert "peat_depth_max" in stats
    assert "carbon_total" in stats
    assert "carbon_density" in stats


def test_peat_depth_avg_matches_uniform_pixel_value(analysis_client):
    """Mean of a raster where every pixel = 200.0 must be ≈ 200.0."""
    import pytest
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["stats"]
    assert stats["peat_depth_avg"] == pytest.approx(200.0, abs=0.5)


def test_peat_depth_max_matches_uniform_pixel_value(analysis_client):
    """Max of a raster where every pixel = 200.0 must be ≈ 200.0."""
    import pytest
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["stats"]
    assert stats["peat_depth_max"] == pytest.approx(200.0, abs=0.5)


def test_carbon_density_matches_uniform_pixel_value(analysis_client):
    """Mean of a raster where every pixel = 80.0 must be ≈ 80.0."""
    import pytest
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["stats"]
    assert stats["carbon_density"] == pytest.approx(80.0, abs=0.5)


def test_carbon_total_is_positive(analysis_client):
    """Weighted sum of positive pixel values × 0.0000009 (tonnes → Mt) must be > 0."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["stats"]
    assert stats["carbon_total"] > 0


def test_peat_carbon_chart_has_layer_id_keys(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["chart"]
    assert "peat_cog" in chart
    assert "carbon_cog" in chart


def test_peat_cog_chart_is_list_of_histogram_points(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["chart"]
    histogram = chart["peat_cog"]
    assert isinstance(histogram, list)
    assert len(histogram) == 10
    assert all("x" in point and "y" in point for point in histogram)


def test_carbon_cog_chart_is_list_of_histogram_points(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["chart"]
    histogram = chart["carbon_cog"]
    assert isinstance(histogram, list)
    assert len(histogram) == 10
    assert all("x" in point and "y" in point for point in histogram)


def test_peat_cog_histogram_weight_concentrated_near_pixel_value(analysis_client):
    """With uniform 200.0 pixels, ≥ 90 % of histogram weight must be in one bin."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["chart"]
    histogram = chart["peat_cog"]
    total = sum(p["y"] for p in histogram)
    assert total > 0
    assert max(p["y"] for p in histogram) / total >= 0.9


def test_carbon_cog_histogram_weight_concentrated_near_pixel_value(analysis_client):
    """With uniform 80.0 pixels, ≥ 90 % of histogram weight must be in one bin."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["chart"]
    histogram = chart["carbon_cog"]
    total = sum(p["y"] for p in histogram)
    assert total > 0
    assert max(p["y"] for p in histogram) / total >= 0.9


# =============================================================================
# Integration — water_dynamics widget output
#
# Uses the `analysis_client` fixture which:
#   - Creates two local uint8 GeoTIFFs
#       inundation_frequency_cog: all pixels = 100 (permanent water)
#       inundation_trends_cog:    all pixels = 4   (wetter)
#   - Inserts matching Layer records with unit="%" / "category"
# =============================================================================


def test_analysis_response_contains_water_dynamics_widget(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert "water_dynamics" in data


def test_water_dynamics_unit_inherited_from_inundation_frequency_layer(analysis_client):
    """Widget unit is read from inundation_frequency_cog.unit ('%')."""
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert data["water_dynamics"]["unit"] == "%"


def test_water_dynamics_stats_contains_all_fields(analysis_client):
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    expected = {
        "water_perm_perc",
        "water_ephemeral_perc",
        "land_perm_perc",
        "freq_mean",
        "trend_wetter_perc",
        "trend_drier_perc",
        "trend_stable_perc",
    }
    assert expected <= set(stats.keys())


def test_water_perm_perc_is_100_for_uniform_value_100(analysis_client):
    """All pixels = 100 → frac_sum([100]) × 100 = 100%."""
    import pytest
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["water_perm_perc"] == pytest.approx(100.0, abs=0.5)


def test_water_ephemeral_perc_is_zero_when_no_pixels_in_range(analysis_client):
    """All pixels = 100 → no pixel falls in [1, 99] → 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["water_ephemeral_perc"] == 0.0


def test_land_perm_perc_is_zero_when_no_pixels_match(analysis_client):
    """All pixels = 100 → frac_sum([0]) = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["land_perm_perc"] == 0.0


def test_freq_mean_matches_uniform_pixel_value(analysis_client):
    """Mean of an all-100 raster ≈ 100."""
    import pytest
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["freq_mean"] == pytest.approx(100.0, abs=0.5)


def test_trend_wetter_perc_is_100_for_uniform_value_4(analysis_client):
    """All pixels = 4 → frac_sum([4]) × 100 = 100%."""
    import pytest
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["trend_wetter_perc"] == pytest.approx(100.0, abs=0.5)


def test_trend_drier_perc_is_zero_when_no_pixels_match(analysis_client):
    """All pixels = 4 → frac_sum([5]) = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["trend_drier_perc"] == 0.0


def test_trend_stable_perc_is_zero_when_no_pixels_match(analysis_client):
    """All pixels = 4 → frac_sum([1, 2, 3]) = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["trend_stable_perc"] == 0.0


def test_water_dynamics_chart_keyed_by_inundation_frequency_layer(analysis_client):
    """Only inundation_frequency_cog produces chart slices; trends layer has no chart entry."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["chart"]
    assert "inundation_frequency_cog" in chart
    assert "inundation_trends_cog" not in chart


def test_water_dynamics_chart_has_three_categorical_slices(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["chart"]
    slices = chart["inundation_frequency_cog"]
    assert isinstance(slices, list)
    assert len(slices) == 3
    keys = {s["key"] for s in slices}
    assert keys == {"water_perm_perc", "water_ephemeral_perc", "land_perm_perc"}


def test_water_dynamics_chart_slice_has_categorical_shape(analysis_client):
    """Each slice must match CategoricalDataPoint = { key, label: { en, fr }, value }."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["chart"]
    for s in chart["inundation_frequency_cog"]:
        assert set(s.keys()) == {"key", "label", "value"}
        assert "en" in s["label"]
        assert "fr" in s["label"]


def test_water_dynamics_slice_values_match_corresponding_stats(analysis_client):
    """Slice values are sourced from the already-computed stats dict."""
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]
    stats, slices = data["stats"], data["chart"]["inundation_frequency_cog"]
    by_key = {s["key"]: s["value"] for s in slices}
    assert by_key["water_perm_perc"] == stats["water_perm_perc"]
    assert by_key["water_ephemeral_perc"] == stats["water_ephemeral_perc"]
    assert by_key["land_perm_perc"] == stats["land_perm_perc"]
