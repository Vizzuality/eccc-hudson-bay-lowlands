"""Widget configuration for zonal statistics analysis.

Each widget entry defines:
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

Stat definition fields:
  - name:       key in the response stats dict
  - op:         operation driving this stat. Built-ins:
                  - any exactextract op ("mean", "max", "sum", ...) — read directly
                  - "frac_sum"  + ``values: [v1, v2, ...]``  — sum coverage fractions for those pixel values
                  - "frac_range" + ``range: [lo, hi]``       — sum coverage fractions for closed range [lo, hi]
  - values:     list of pixel values (frac_sum only)
  - range:      [lo, hi] inclusive (frac_range only)
  - scale:      multiplier applied to the op result (default 1.0)
  - precision:  decimal places to round to (default 2)
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
}
