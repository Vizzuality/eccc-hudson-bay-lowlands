"""Widget configuration for zonal statistics analysis.

Each widget entry defines:
  - dataset_id:  ``Dataset.id`` of the dataset this widget belongs to. The widget
                 response embeds the full dataset (with all its layers) under the
                 ``dataset`` key. Each widget belongs to exactly one dataset; all
                 layers declared under ``layers`` must belong to that dataset.
  - unit:        explicit display unit for the widget. Use this for widgets whose
                 stats have mixed units and no single layer's DB unit reflects the
                 "primary" widget metric (e.g. peat_carbon mixes cm, Mt, kg/m²).
  - unit_layer:  alternative — layer id whose DB ``unit`` becomes the widget's unit.
                 Use this when every stat in the widget shares a single unit that
                 already lives on a layer in the DB (e.g. water_dynamics stats are all "%").

  Exactly one of ``unit`` / ``unit_layer`` must be set. If both are present,
  ``unit`` wins.

  - layers:      dict keyed by layer id (matches ``Layer.id`` in DB)
      - ops:     exactextract operations to run on that raster
      - stats:   list of stat definitions to derive from op results
      - chart:   optional chart spec for this layer; one of:
                   {"type": "histogram"}
                       Coverage-weighted histogram from ``values`` + ``coverage`` ops.
                   {"type": "categorical",
                    "slices": [{"stat": <stat name>}, ...]}
                       Categorical points (donut/pie) sourced from already-computed stats.
                       Slice labels live in the FE i18n bundle, not here — the API only
                       ships ``{key, value}`` per slice.
  - chart:       optional widget-level chart spec, used when a single chart spans
                 multiple layers' stats (instead of one chart per layer):
                   {"type": "time_series",
                    "key": <synthetic chart key>,
                    "points": [{"stat": <stat name>, "x": <number>}, ...]}
                       Produces a single ``[{x, y}]`` series under ``chart[key]``. The
                       ``key`` is a synthetic id (NOT a Layer.id) — it deviates from the
                       per-layer convention because the series is sourced from many
                       layers. Document the choice of ``key`` so the FE can read it.

Stat definition fields:
  - name:       key in the response stats dict
  - op:         operation driving this stat. Built-ins:
                  - any exactextract op ("mean", "max", "sum", ...) — read directly
                  - "frac_sum"   + ``values: [v1, v2, ...]`` — sum coverage fractions for those pixel values
                  - "frac_range" + ``range: [lo, hi]``       — sum coverage fractions for closed range [lo, hi]
                  - "frac_area"  + ``values: [v1, v2, ...]`` — area (km²) = ``frac_sum × polygon_area_km2``.
                                                                Overview-safe (uses the polygon's projected
                                                                area, not a per-pixel constant).
                  - "date_offset" + ``base_year: int``       — interpret ``mean`` op result as
                                                                days from Dec 31 of base_year and
                                                                return an ISO ``YYYY-MM-DD`` string
                  - "stat_sum"   + ``terms: [name, ...]``    — sum of already-computed stats. Referenced
                                                                stats must appear earlier in ``stats``.
                  - "stat_diff"  + ``terms: [a, b, ...]``    — first term minus the sum of the rest.
  - values:     list of pixel values (frac_sum, frac_area)
  - range:      [lo, hi] inclusive (frac_range only)
  - base_year:  Dec 31 anchor year (date_offset only)
  - terms:      list of already-computed stat names (stat_sum, stat_diff)
  - scale:      multiplier applied to the op result (default 1.0; numeric ops only)
  - precision:  decimal places to round to (default 2; numeric ops only)
  - unit:       documentation only — the runtime unit comes from the widget's ``unit_layer``
"""

from typing import Any

StatDef = dict[str, Any]
LayerDef = dict[str, Any]
WidgetDef = dict[str, Any]

WIDGET_CONFIG: dict[str, WidgetDef] = {
    "peat_carbon": {
        # Mixed-unit widget: peat depth (cm), carbon total (Mt), carbon density (kg/m²).
        # Widget-level unit is the primary metric — peat depth in cm.
        "dataset_id": 1,
        "unit": "cm",
        "layers": {
            "peat_cog": {
                "ops": ["mean", "max", "values", "coverage"],
                "chart": {"type": "histogram"},
                "stats": [
                    {"name": "peat_depth_avg", "op": "mean", "unit": "cm", "precision": 1},
                    {"name": "peat_depth_max", "op": "max", "unit": "cm", "precision": 1},
                ],
            },
            "carbon_cog": {
                "ops": ["sum", "mean", "values", "coverage"],
                "chart": {"type": "histogram"},
                "stats": [
                    {"name": "carbon_total", "op": "sum", "unit": "Mt", "scale": 0.0000009, "precision": 2},
                    {"name": "carbon_density", "op": "mean", "unit": "kg/m²", "precision": 2},
                ],
            },
        },
    },
    "water_dynamics": {
        "dataset_id": 2,
        "unit_layer": "inundation_frequency_cog",
        "layers": {
            "inundation_frequency_cog": {
                "ops": ["frac", "unique", "mean"],
                "chart": {
                    "type": "categorical",
                    "slices": [
                        {"stat": "water_perm_perc"},
                        {"stat": "water_ephemeral_perc"},
                        {"stat": "land_perm_perc"},
                    ],
                },
                "stats": [
                    {"name": "water_perm_perc", "op": "frac_sum", "values": [100], "scale": 100, "precision": 2},
                    {"name": "water_ephemeral_perc", "op": "frac_range", "range": [1, 99], "scale": 100, "precision": 2},
                    {"name": "land_perm_perc", "op": "frac_sum", "values": [0], "scale": 100, "precision": 2},
                    {"name": "freq_mean", "op": "mean", "precision": 2},
                ],
            },
            "inundation_trends_cog": {
                "ops": ["frac", "unique"],
                "stats": [
                    {"name": "trend_wetter_perc", "op": "frac_sum", "values": [4], "scale": 100, "precision": 2},
                    {"name": "trend_drier_perc", "op": "frac_sum", "values": [5], "scale": 100, "precision": 2},
                    {"name": "trend_stable_perc", "op": "frac_sum", "values": [1, 2, 3], "scale": 100, "precision": 2},
                ],
            },
        },
    },
    "snow_dynamics": {
        # Six winters of snow-cover rasters at 30 m / EPSG:3979. For each winter:
        #   - lengthT_*_cog: pixel value = number of days with snow cover. We take the mean.
        #   - endL_*_cog:    pixel value = days from Dec 31 of the prior calendar year. We
        #                    take the mean and convert to an ISO date via ``date_offset``.
        # Stats are flat per-winter (e.g. ``lengthT_mean_1819``, ``endL_mean_date_1819``) so
        # all six winters round-trip in a single response.
        # The widget-level ``chart`` aggregates the six lengthT means into one time series.
        # The chart key ``"lengthT_mean"`` is synthetic (not a Layer.id) because the series
        # spans multiple layers.
        # TODO: confirm with design whether the X axis should be the start year (used here),
        # the end year, or a "20YY/YY" string. Currently uses start year as a number.
        "dataset_id": 4,
        "unit": "days",
        "chart": {
            "type": "time_series",
            "key": "lengthT_mean",
            "points": [
                {"stat": "lengthT_mean_1819", "x": 2018},
                {"stat": "lengthT_mean_1920", "x": 2019},
                {"stat": "lengthT_mean_2021", "x": 2020},
                {"stat": "lengthT_mean_2122", "x": 2021},
                {"stat": "lengthT_mean_2223", "x": 2022},
                {"stat": "lengthT_mean_2324", "x": 2023},
            ],
        },
        "layers": {
            "endL_winter_1819_cog": {
                "ops": ["mean"],
                "stats": [{"name": "endL_mean_date_1819", "op": "date_offset", "base_year": 2018}],
            },
            "endL_winter_1920_cog": {
                "ops": ["mean"],
                "stats": [{"name": "endL_mean_date_1920", "op": "date_offset", "base_year": 2019}],
            },
            "endL_winter_2021_cog": {
                "ops": ["mean"],
                "stats": [{"name": "endL_mean_date_2021", "op": "date_offset", "base_year": 2020}],
            },
            "endL_winter_2122_cog": {
                "ops": ["mean"],
                "stats": [{"name": "endL_mean_date_2122", "op": "date_offset", "base_year": 2021}],
            },
            "endL_winter_2223_cog": {
                "ops": ["mean"],
                "stats": [{"name": "endL_mean_date_2223", "op": "date_offset", "base_year": 2022}],
            },
            "endL_winter_2324_cog": {
                "ops": ["mean"],
                "stats": [{"name": "endL_mean_date_2324", "op": "date_offset", "base_year": 2023}],
            },
            "lengthT_winter_1819_cog": {
                "ops": ["mean"],
                "stats": [{"name": "lengthT_mean_1819", "op": "mean", "unit": "days", "precision": 1}],
            },
            "lengthT_winter_1920_cog": {
                "ops": ["mean"],
                "stats": [{"name": "lengthT_mean_1920", "op": "mean", "unit": "days", "precision": 1}],
            },
            "lengthT_winter_2021_cog": {
                "ops": ["mean"],
                "stats": [{"name": "lengthT_mean_2021", "op": "mean", "unit": "days", "precision": 1}],
            },
            "lengthT_winter_2122_cog": {
                "ops": ["mean"],
                "stats": [{"name": "lengthT_mean_2122", "op": "mean", "unit": "days", "precision": 1}],
            },
            "lengthT_winter_2223_cog": {
                "ops": ["mean"],
                "stats": [{"name": "lengthT_mean_2223", "op": "mean", "unit": "days", "precision": 1}],
            },
            "lengthT_winter_2324_cog": {
                "ops": ["mean"],
                "stats": [{"name": "lengthT_mean_2324", "op": "mean", "unit": "days", "precision": 1}],
            },
        },
    },
    "treed_area": {
        # Categorical raster (0=non-treed, 1=always-treed, 2=newly-treed, 3=was-treed)
        # at 30 m / EPSG:3978. Stats are a mix of areas (km²) and percentages.
        # Widget-level unit is "km²" because the four primary stats are areas; the
        # four percentage stats document their unit on the stat definition itself.
        "dataset_id": 5,
        "unit": "km²",
        "layers": {
            "treed_area_1984-2022_cog": {
                "ops": ["frac", "unique"],
                "chart": {
                    "type": "categorical",
                    "slices": [
                        {"stat": "non_treed_perc"},
                        {"stat": "always_treed_perc"},
                        {"stat": "newly_treed_perc"},
                        {"stat": "was_treed_perc"},
                    ],
                },
                # Order matters: the stat_sum / stat_diff compositions below reference the
                # four ``*_area`` stats above, so those must be computed first.
                "stats": [
                    {"name": "non_treed_area", "op": "frac_area", "values": [0], "precision": 2},
                    {"name": "always_treed_area", "op": "frac_area", "values": [1], "precision": 2},
                    {"name": "newly_treed_area", "op": "frac_area", "values": [2], "precision": 2},
                    {"name": "was_treed_area", "op": "frac_area", "values": [3], "precision": 2},
                    {
                        "name": "total_treed_area",
                        "op": "stat_sum",
                        "terms": ["always_treed_area", "newly_treed_area"],
                        "precision": 2,
                    },
                    {
                        "name": "changed_treed_area",
                        "op": "stat_diff",
                        "terms": ["newly_treed_area", "was_treed_area"],
                        "precision": 2,
                    },
                    {"name": "non_treed_perc", "op": "frac_sum", "values": [0], "scale": 100, "precision": 2},
                    {"name": "always_treed_perc", "op": "frac_sum", "values": [1], "scale": 100, "precision": 2},
                    {"name": "newly_treed_perc", "op": "frac_sum", "values": [2], "scale": 100, "precision": 2},
                    {"name": "was_treed_perc", "op": "frac_sum", "values": [3], "scale": 100, "precision": 2},
                ],
            },
        },
    },
    "flood_susceptibility": {
        "dataset_id": 3,
        "unit_layer": "flood_susceptibility_cog",
        "layers": {
            "flood_susceptibility_cog": {
                "ops": ["frac", "unique", "mean"],
                "chart": {
                    "type": "categorical",
                    "slices": [
                        {"stat": "fsi_low_perc"},
                        {"stat": "fsi_moderate_perc"},
                        {"stat": "fsi_high_perc"},
                    ],
                },
                "stats": [
                    {"name": "fsi_avg", "op": "mean", "precision": 2},
                    {"name": "fsi_low_perc", "op": "frac_range", "range": [0, 30], "scale": 100, "precision": 2},
                    {"name": "fsi_moderate_perc", "op": "frac_range", "range": [31, 80], "scale": 100, "precision": 2},
                    {"name": "fsi_high_perc", "op": "frac_range", "range": [81, 100], "scale": 100, "precision": 2},
                ],
            },
        },
    },
}
