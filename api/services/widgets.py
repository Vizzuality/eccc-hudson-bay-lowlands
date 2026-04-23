"""Widget configuration for zonal statistics analysis.

Each widget entry defines:
  - layers:     dict keyed by layer id (matches Layer.id in DB)
      - ops:    exactextract operations to run on that raster
      - stats:  list of stat definitions to derive from op results
      - chart:  whether to produce a coverage-weighted histogram for this layer
  - unit:       primary display unit for the widget response

Stat definition fields:
  - name:       key in the response stats dict
  - op:         exactextract op whose result drives this stat
  - unit:       unit for this stat (may differ from the raster's native DB unit)
  - scale:      optional multiplier applied to the op result (default 1.0)
  - precision:  decimal places to round to (default 2)
"""

from typing import Any

StatDef = dict[str, Any]
LayerDef = dict[str, Any]
WidgetDef = dict[str, Any]

WIDGET_CONFIG: dict[str, WidgetDef] = {
    "peat_carbon": {
        "unit": "cm",
        "layers": {
            "peat_cog": {
                "ops": ["mean", "max", "values", "coverage"],
                "chart": True,
                "stats": [
                    {"name": "peat_depth_avg", "op": "mean", "unit": "cm", "precision": 1},
                    {"name": "peat_depth_max", "op": "max", "unit": "cm", "precision": 1},
                ],
            },
            "carbon_cog": {
                "ops": ["sum", "mean", "values", "coverage"],
                "chart": True,
                "stats": [
                    {"name": "carbon_total", "op": "sum", "unit": "Mt", "scale": 0.0000009, "precision": 2},
                    {"name": "carbon_density", "op": "mean", "unit": "kg/m²", "precision": 2},
                ],
            },
        },
    },
}
