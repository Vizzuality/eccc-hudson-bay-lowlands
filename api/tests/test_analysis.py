"""Integration tests for POST /analysis endpoint."""

import pytest

from tests.conftest import (
    FLOOD_SUSCEPTIBILITY_DATASET_METADATA,
    PEAT_CARBON_DATASET_METADATA,
    SNOW_DYNAMICS_DATASET_METADATA,
    SNOW_ENDL_EXPECTED_DATES,
    SNOW_LENGTHT_VALUES,
    TREED_AREA_DATASET_METADATA,
    WATER_DYNAMICS_DATASET_METADATA,
)

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

# A narrow polygon that crosses the HBL bbox western edge at lon=-117 (so it is
# partly outside, partly inside HBL) and also overlaps the analysis_client raster
# extent at lon=[-85, -83]. Should pass because the bbox check uses intersection,
# not containment. Latitude is intentionally narrow to keep the area below
# MAX_AREA_KM2 (50,000 km²) given the wide longitude span.
PARTIALLY_OUTSIDE_HBL_FEATURE = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-118.0, 57.00],
            [-83.5, 57.00],
            [-83.5, 57.05],
            [-118.0, 57.05],
            [-118.0, 57.00],
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


def test_valid_polygon_feature_returns_200(analysis_client):
    response = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE)
    assert response.status_code == 200


def test_valid_multipolygon_feature_returns_200(analysis_client):
    response = analysis_client.post("/analysis/", json=VALID_MULTIPOLYGON_FEATURE)
    assert response.status_code == 200


def test_valid_feature_collection_single_feature_returns_200(analysis_client):
    response = analysis_client.post("/analysis/", json=VALID_FEATURE_COLLECTION)
    assert response.status_code == 200


def test_valid_feature_collection_multiple_features_returns_200(analysis_client):
    response = analysis_client.post("/analysis/", json=FEATURE_COLLECTION_MULTIPLE_FEATURES)
    assert response.status_code == 200


def test_polygon_partially_outside_hbl_bbox_still_returns_200(analysis_client):
    """Geometry that extends beyond the HBL bbox passes as long as it intersects it."""
    response = analysis_client.post("/analysis/", json=PARTIALLY_OUTSIDE_HBL_FEATURE)
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
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["stats"]
    assert stats["peat_depth_avg"] == pytest.approx(200.0, abs=0.5)


def test_peat_depth_max_matches_uniform_pixel_value(analysis_client):
    """Max of a raster where every pixel = 200.0 must be ≈ 200.0."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["stats"]
    assert stats["peat_depth_max"] == pytest.approx(200.0, abs=0.5)


def test_carbon_density_matches_uniform_pixel_value(analysis_client):
    """Mean of a raster where every pixel = 80.0 must be ≈ 80.0."""
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


def test_peat_carbon_dataset_id_matches_widget_config(analysis_client):
    """``dataset.id`` matches the WIDGET_CONFIG dataset_id for peat_carbon (1)."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["dataset"]
    assert dataset["id"] == 1


def test_peat_carbon_dataset_metadata_round_trips(analysis_client):
    """Full bilingual dataset metadata (title, description, source, citation) is returned."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["dataset"]
    assert dataset["metadata"] == PEAT_CARBON_DATASET_METADATA


def test_peat_carbon_dataset_has_category_id(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["dataset"]
    assert isinstance(dataset["category_id"], int)


def test_peat_carbon_dataset_layers_in_relationship_order(analysis_client):
    """``dataset.layers`` includes every layer belonging to the dataset (peat_cog, carbon_cog)."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["dataset"]
    assert {entry["id"] for entry in dataset["layers"]} == {"peat_cog", "carbon_cog"}


def test_peat_carbon_dataset_layers_full_schema(analysis_client):
    """Embedded layers carry the full LayerSchema fields (format, path, unit, metadata, dataset_id)."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["peat_carbon"]["dataset"]
    by_id = {entry["id"]: entry for entry in dataset["layers"]}

    peat = by_id["peat_cog"]
    assert peat["format"] == "raster"
    assert peat["unit"] == "cm"
    assert peat["dataset_id"] == dataset["id"]
    assert peat["metadata"]["title"] == {"en": "Peat Depth", "fr": "Profondeur de la Tourbe"}
    assert peat["path"].endswith("peat_cog.tif")

    carbon = by_id["carbon_cog"]
    assert carbon["format"] == "raster"
    assert carbon["unit"] == "kg/m²"
    assert carbon["dataset_id"] == dataset["id"]
    assert carbon["metadata"]["title"] == {"en": "Carbon Storage", "fr": "Stockage de Carbone"}
    assert carbon["path"].endswith("carbon_cog.tif")


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
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["water_perm_perc"] == pytest.approx(100.0, abs=0.5)


def test_water_ephemeral_perc_is_zero_when_no_pixels_in_range(analysis_client):
    """All pixels = 100 → no pixel falls in [1, 99] → 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["water_ephemeral_perc"] == pytest.approx(0.0, abs=0.01)


def test_land_perm_perc_is_zero_when_no_pixels_match(analysis_client):
    """All pixels = 100 → frac_sum([0]) = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["land_perm_perc"] == pytest.approx(0.0, abs=0.01)


def test_freq_mean_matches_uniform_pixel_value(analysis_client):
    """Mean of an all-100 raster ≈ 100."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["freq_mean"] == pytest.approx(100.0, abs=0.5)


def test_trend_wetter_perc_is_100_for_uniform_value_4(analysis_client):
    """All pixels = 4 → frac_sum([4]) × 100 = 100%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["trend_wetter_perc"] == pytest.approx(100.0, abs=0.5)


def test_trend_drier_perc_is_zero_when_no_pixels_match(analysis_client):
    """All pixels = 4 → frac_sum([5]) = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["trend_drier_perc"] == pytest.approx(0.0, abs=0.01)


def test_trend_stable_perc_is_zero_when_no_pixels_match(analysis_client):
    """All pixels = 4 → frac_sum([1, 2, 3]) = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["stats"]
    assert stats["trend_stable_perc"] == pytest.approx(0.0, abs=0.01)


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
    """Each slice must match CategoricalDataPoint = { key, value } — labels live in FE i18n."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["chart"]
    for s in chart["inundation_frequency_cog"]:
        assert set(s.keys()) == {"key", "value"}


def test_water_dynamics_slice_values_match_corresponding_stats(analysis_client):
    """Slice values are sourced from the already-computed stats dict."""
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]
    stats, slices = data["stats"], data["chart"]["inundation_frequency_cog"]
    by_key = {s["key"]: s["value"] for s in slices}
    assert by_key["water_perm_perc"] == stats["water_perm_perc"]
    assert by_key["water_ephemeral_perc"] == stats["water_ephemeral_perc"]
    assert by_key["land_perm_perc"] == stats["land_perm_perc"]


def test_water_dynamics_dataset_id_matches_widget_config(analysis_client):
    """``dataset.id`` matches the WIDGET_CONFIG dataset_id for water_dynamics (2)."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["dataset"]
    assert dataset["id"] == 2


def test_water_dynamics_dataset_metadata_round_trips(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["dataset"]
    assert dataset["metadata"] == WATER_DYNAMICS_DATASET_METADATA


def test_water_dynamics_dataset_layers_include_both_inundation_layers(analysis_client):
    """``dataset.layers`` lists every layer belonging to the Dynamic Surface Water dataset."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["dataset"]
    assert {entry["id"] for entry in dataset["layers"]} == {
        "inundation_frequency_cog",
        "inundation_trends_cog",
    }


def test_water_dynamics_dataset_layers_full_schema(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["water_dynamics"]["dataset"]
    by_id = {entry["id"]: entry for entry in dataset["layers"]}

    freq = by_id["inundation_frequency_cog"]
    assert freq["format"] == "raster"
    assert freq["unit"] == "%"
    assert freq["dataset_id"] == dataset["id"]
    assert freq["metadata"]["title"] == {"en": "Inundation Frequency", "fr": "Fréquence des Inondations"}
    assert freq["path"].endswith("inundation_frequency_cog.tif")

    trends = by_id["inundation_trends_cog"]
    assert trends["format"] == "raster"
    assert trends["unit"] == "category"
    assert trends["dataset_id"] == dataset["id"]
    assert trends["metadata"]["title"] == {"en": "Inundation Trends", "fr": "Tendances des Inondations"}
    assert trends["path"].endswith("inundation_trends_cog.tif")


# =============================================================================
# Integration — flood_susceptibility widget output
#
# The fixture creates a uint8 GeoTIFF (`flood_susceptibility_cog`) where every
# pixel = 50. That value sits in the moderate band (31–80), so:
#   - fsi_avg          ≈ 50
#   - fsi_low_perc     = 0    (no pixels in 0–30)
#   - fsi_moderate_perc = 100 (all pixels in 31–80)
#   - fsi_high_perc    = 0    (no pixels in 81–100)
# =============================================================================


def test_analysis_response_contains_flood_susceptibility_widget(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert "flood_susceptibility" in data


def test_flood_susceptibility_unit_inherited_from_layer(analysis_client):
    """Widget unit is read from flood_susceptibility_cog.unit ('%')."""
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert data["flood_susceptibility"]["unit"] == "%"


def test_flood_susceptibility_stats_contains_all_fields(analysis_client):
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["stats"]
    assert set(stats.keys()) == {"fsi_avg", "fsi_low_perc", "fsi_moderate_perc", "fsi_high_perc"}


def test_fsi_avg_matches_uniform_pixel_value(analysis_client):
    """Mean of a raster where every pixel = 50 must be ≈ 50."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["stats"]
    assert stats["fsi_avg"] == pytest.approx(50.0, abs=0.5)


def test_fsi_low_perc_is_zero_when_no_pixels_in_range(analysis_client):
    """All pixels = 50 → frac_range [0, 30] = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["stats"]
    assert stats["fsi_low_perc"] == pytest.approx(0.0, abs=0.01)


def test_fsi_moderate_perc_is_100_for_uniform_value_50(analysis_client):
    """All pixels = 50 → frac_range [31, 80] × 100 = 100%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["stats"]
    assert stats["fsi_moderate_perc"] == pytest.approx(100.0, abs=0.5)


def test_fsi_high_perc_is_zero_when_no_pixels_in_range(analysis_client):
    """All pixels = 50 → frac_range [81, 100] = 0%."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["stats"]
    assert stats["fsi_high_perc"] == pytest.approx(0.0, abs=0.01)


def test_flood_susceptibility_chart_keyed_by_layer_id(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["chart"]
    assert "flood_susceptibility_cog" in chart


def test_flood_susceptibility_chart_has_three_categorical_slices(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["chart"]
    slices = chart["flood_susceptibility_cog"]
    assert isinstance(slices, list)
    assert len(slices) == 3
    keys = [s["key"] for s in slices]
    assert keys == ["fsi_low_perc", "fsi_moderate_perc", "fsi_high_perc"]


def test_flood_susceptibility_slice_values_match_corresponding_stats(analysis_client):
    """Slice values are sourced from the already-computed stats dict."""
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]
    stats, slices = data["stats"], data["chart"]["flood_susceptibility_cog"]
    by_key = {s["key"]: s["value"] for s in slices}
    assert by_key["fsi_low_perc"] == stats["fsi_low_perc"]
    assert by_key["fsi_moderate_perc"] == stats["fsi_moderate_perc"]
    assert by_key["fsi_high_perc"] == stats["fsi_high_perc"]


def test_flood_susceptibility_dataset_id_matches_widget_config(analysis_client):
    """``dataset.id`` matches the WIDGET_CONFIG dataset_id for flood_susceptibility (3)."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["dataset"]
    assert dataset["id"] == 3


def test_flood_susceptibility_dataset_metadata_round_trips(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["dataset"]
    assert dataset["metadata"] == FLOOD_SUSCEPTIBILITY_DATASET_METADATA


def test_flood_susceptibility_dataset_has_one_layer(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["dataset"]
    assert [entry["id"] for entry in dataset["layers"]] == ["flood_susceptibility_cog"]


def test_flood_susceptibility_dataset_layer_full_schema(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["flood_susceptibility"]["dataset"]
    entry = dataset["layers"][0]
    assert entry["id"] == "flood_susceptibility_cog"
    assert entry["format"] == "raster"
    assert entry["unit"] == "%"
    assert entry["dataset_id"] == dataset["id"]
    assert entry["metadata"]["title"] == {
        "en": "Flood Susceptibility Index",
        "fr": "Indice de vulnérabilité aux inondations",
    }
    assert entry["path"].endswith("flood_susceptibility_cog.tif")


# =============================================================================
# Integration — snow_dynamics widget output
#
# Uses the `analysis_client` fixture which creates 12 GeoTIFFs:
#   - lengthT_winter_<suffix>_cog: per-winter uniform values from SNOW_LENGTHT_VALUES
#   - endL_winter_<suffix>_cog:    uniform 100 for every winter; combined with each
#                                  layer's base_year via the date_offset op the result
#                                  must match SNOW_ENDL_EXPECTED_DATES.
# =============================================================================


def test_analysis_response_contains_snow_dynamics_widget(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert "snow_dynamics" in data


def test_snow_dynamics_unit_is_days(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert data["snow_dynamics"]["unit"] == "days"


def test_snow_dynamics_stats_has_all_lengtht_and_endl_fields(analysis_client):
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["stats"]
    for suffix in SNOW_LENGTHT_VALUES:
        assert f"lengthT_mean_{suffix}" in stats
        assert f"endL_mean_date_{suffix}" in stats


def test_snow_dynamics_lengtht_means_match_uniform_pixel_values(analysis_client):
    """Each lengthT_mean_<winter> equals the uniform pixel value of its raster."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["stats"]
    for suffix, value in SNOW_LENGTHT_VALUES.items():
        assert stats[f"lengthT_mean_{suffix}"] == pytest.approx(value, abs=0.5)


def test_snow_dynamics_endl_dates_are_iso_format(analysis_client):
    """Each endL_mean_date_<winter> matches the expected ISO YYYY-MM-DD date."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["stats"]
    for suffix, expected in SNOW_ENDL_EXPECTED_DATES.items():
        assert stats[f"endL_mean_date_{suffix}"] == expected


def test_snow_dynamics_chart_keyed_by_synthetic_lengtht_mean(analysis_client):
    """Chart uses the synthetic key ``lengthT_mean`` (not a Layer.id)."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["chart"]
    assert "lengthT_mean" in chart
    # No layer-id keys leak into the chart for this widget — the time series is the only entry.
    assert list(chart.keys()) == ["lengthT_mean"]


def test_snow_dynamics_chart_has_six_time_series_points(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["chart"]
    series = chart["lengthT_mean"]
    assert isinstance(series, list)
    assert len(series) == 6
    assert all("x" in p and "y" in p for p in series)


def test_snow_dynamics_chart_x_values_are_start_years(analysis_client):
    """X values use the winter's start year (2018→2023)."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["chart"]
    xs = [p["x"] for p in chart["lengthT_mean"]]
    assert xs == [2018, 2019, 2020, 2021, 2022, 2023]


def test_snow_dynamics_chart_y_values_match_lengtht_means(analysis_client):
    """Each chart point's y value equals the corresponding ``lengthT_mean_<suffix>`` stat."""
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]
    series = data["chart"]["lengthT_mean"]
    stats = data["stats"]
    expected_pairs = [
        (2018, stats["lengthT_mean_1819"]),
        (2019, stats["lengthT_mean_1920"]),
        (2020, stats["lengthT_mean_2021"]),
        (2021, stats["lengthT_mean_2122"]),
        (2022, stats["lengthT_mean_2223"]),
        (2023, stats["lengthT_mean_2324"]),
    ]
    assert [(p["x"], p["y"]) for p in series] == expected_pairs


def test_snow_dynamics_dataset_id_matches_widget_config(analysis_client):
    """``dataset.id`` matches the WIDGET_CONFIG dataset_id for snow_dynamics (4)."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["dataset"]
    assert dataset["id"] == 4


def test_snow_dynamics_dataset_metadata_round_trips(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["dataset"]
    assert dataset["metadata"] == SNOW_DYNAMICS_DATASET_METADATA


def test_snow_dynamics_dataset_has_twelve_layers(analysis_client):
    """All 12 snow rasters (6 endL + 6 lengthT) are embedded under ``dataset.layers``."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["snow_dynamics"]["dataset"]
    layer_ids = {entry["id"] for entry in dataset["layers"]}
    expected = {f"endL_winter_{s}_cog" for s in SNOW_LENGTHT_VALUES} | {
        f"lengthT_winter_{s}_cog" for s in SNOW_LENGTHT_VALUES
    }
    assert layer_ids == expected


# =============================================================================
# Integration — treed_area widget output
#
# The fixture creates a uint8 GeoTIFF (``treed_area_1984-2022_cog``) with four
# equal-area quadrants holding values 0/1/2/3. The standard test polygon is
# centred on the raster, so each quadrant contributes exactly ¼ of the polygon's
# coverage — frac(v) = 0.25 for every v ∈ {0, 1, 2, 3}.
#
# Expected (polygon area ≈ 6,737 km² in EPSG:6933):
#   - each *_area  ≈ polygon_area / 4 ≈ 1,684 km²
#   - each *_perc  ≈ 25 %
#   - total_treed_area   = always_treed_area + newly_treed_area
#   - changed_treed_area = newly_treed_area − was_treed_area ≈ 0
# =============================================================================


# Approximate polygon area in EPSG:6933 for the VALID_POLYGON_FEATURE 1°×1° box at lat ≈ 57.
# Used as a coarse expected value for the quadrant-area assertions.
EXPECTED_POLYGON_AREA_KM2 = 6_737.0
EXPECTED_QUADRANT_AREA_KM2 = EXPECTED_POLYGON_AREA_KM2 / 4


def test_analysis_response_contains_treed_area_widget(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert "treed_area" in data


def test_treed_area_unit_is_km2(analysis_client):
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()
    assert data["treed_area"]["unit"] == "km²"


def test_treed_area_stats_contains_all_fields(analysis_client):
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["stats"]
    assert set(stats.keys()) == {
        "non_treed_area",
        "always_treed_area",
        "newly_treed_area",
        "was_treed_area",
        "total_treed_area",
        "changed_treed_area",
        "non_treed_perc",
        "always_treed_perc",
        "newly_treed_perc",
        "was_treed_perc",
    }


def test_treed_area_quadrant_areas_are_approximately_quarter_polygon(analysis_client):
    """Each quadrant covers ¼ of the polygon → area ≈ polygon_area / 4."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["stats"]
    for key in ("non_treed_area", "always_treed_area", "newly_treed_area", "was_treed_area"):
        assert stats[key] == pytest.approx(EXPECTED_QUADRANT_AREA_KM2, rel=0.01)


def test_treed_area_quadrant_areas_sum_close_to_polygon_area(analysis_client):
    """The four class areas partition the polygon, so they must sum to its area."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["stats"]
    total = (
        stats["non_treed_area"]
        + stats["always_treed_area"]
        + stats["newly_treed_area"]
        + stats["was_treed_area"]
    )
    assert total == pytest.approx(EXPECTED_POLYGON_AREA_KM2, rel=0.01)


def test_treed_area_total_treed_is_sum_of_always_and_newly(analysis_client):
    """stat_sum op: total_treed_area = always_treed_area + newly_treed_area."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["stats"]
    expected = round(stats["always_treed_area"] + stats["newly_treed_area"], 2)
    assert stats["total_treed_area"] == pytest.approx(expected, abs=0.02)


def test_treed_area_changed_treed_is_newly_minus_was(analysis_client):
    """stat_diff op: changed_treed_area = newly_treed_area − was_treed_area."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["stats"]
    expected = round(stats["newly_treed_area"] - stats["was_treed_area"], 2)
    assert stats["changed_treed_area"] == pytest.approx(expected, abs=0.02)


def test_treed_area_percentages_are_approximately_25(analysis_client):
    """frac(v) = 0.25 for each class → each *_perc ≈ 25 %."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["stats"]
    for key in ("non_treed_perc", "always_treed_perc", "newly_treed_perc", "was_treed_perc"):
        assert stats[key] == pytest.approx(25.0, abs=0.5)


def test_treed_area_percentages_sum_to_100(analysis_client):
    """The four class percentages partition the polygon → they must sum to 100 %."""
    stats = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["stats"]
    total = (
        stats["non_treed_perc"]
        + stats["always_treed_perc"]
        + stats["newly_treed_perc"]
        + stats["was_treed_perc"]
    )
    assert total == pytest.approx(100.0, abs=0.01)


def test_treed_area_chart_keyed_by_layer_id(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["chart"]
    assert "treed_area_1984-2022_cog" in chart


def test_treed_area_chart_has_four_categorical_slices(analysis_client):
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["chart"]
    slices = chart["treed_area_1984-2022_cog"]
    assert isinstance(slices, list)
    assert len(slices) == 4
    keys = [s["key"] for s in slices]
    assert keys == [
        "non_treed_perc",
        "always_treed_perc",
        "newly_treed_perc",
        "was_treed_perc",
    ]


def test_treed_area_chart_slice_values_match_stats(analysis_client):
    """Slice values are sourced from the already-computed stats dict."""
    data = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]
    stats, slices = data["stats"], data["chart"]["treed_area_1984-2022_cog"]
    by_key = {s["key"]: s["value"] for s in slices}
    for key in ("non_treed_perc", "always_treed_perc", "newly_treed_perc", "was_treed_perc"):
        assert by_key[key] == stats[key]


def test_treed_area_chart_slice_has_categorical_shape(analysis_client):
    """Each slice must match CategoricalDataPoint = { key, value }."""
    chart = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["chart"]
    for s in chart["treed_area_1984-2022_cog"]:
        assert set(s.keys()) == {"key", "value"}


def test_treed_area_dataset_id_matches_widget_config(analysis_client):
    """``dataset.id`` matches the WIDGET_CONFIG dataset_id for treed_area (5)."""
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["dataset"]
    assert dataset["id"] == 5


def test_treed_area_dataset_metadata_round_trips(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["dataset"]
    assert dataset["metadata"] == TREED_AREA_DATASET_METADATA


def test_treed_area_dataset_has_one_layer(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["dataset"]
    assert [entry["id"] for entry in dataset["layers"]] == ["treed_area_1984-2022_cog"]


def test_treed_area_dataset_layer_full_schema(analysis_client):
    dataset = analysis_client.post("/analysis/", json=VALID_POLYGON_FEATURE).json()["treed_area"]["dataset"]
    entry = dataset["layers"][0]
    assert entry["id"] == "treed_area_1984-2022_cog"
    assert entry["format"] == "raster"
    assert entry["unit"] == "category"
    assert entry["dataset_id"] == dataset["id"]
    assert entry["metadata"]["title"] == {"en": "Treed Area (1984–2022)", "fr": "Zone Arborée (1984–2022)"}
    assert entry["path"].endswith("treed_area_1984-2022_cog.tif")
