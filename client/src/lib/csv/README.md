# Widget CSV export

Each analysis widget can export its data as a CSV from the download menu in its
card header. The file is built in the browser from the analysis response the
client already holds — there is no export endpoint.

## Format

One table, six columns, `;`-delimited:

```
section;series;key;label;value;unit
metadata;;exported_at;Exported at;2026-09-17;
metadata;;aoi_size;Area of interest;1240.5;km²
metadata;;dataset_citation;Citation;ECCC 2026;
stats;;peat_depth_avg;Average peat depth;42.3;cm
stats;;carbon_total;Total carbon;8.4;Mt
chart;peat_cog;12;Frequency;340;
chart;carbon_cog;5;Carbon Density;12.1;
```

| Column | Meaning |
| --- | --- |
| `section` | `metadata`, `stats` or `chart`. Filter measurements with `section != "metadata"`. |
| `series` | The key of the `WidgetData.chart` record — usually a layer id. Empty for `metadata` and `stats`. It is what keeps `peat_carbon`'s two histograms apart. |
| `key` | The raw API identifier. Stable across locales and releases; this is the join column. |
| `label` | The translated human name. Never use it to identify a row. |
| `value` | The API value, written verbatim. The API rounds server side, so the file matches the screen. |
| `unit` | The unit of that row's value. |

The `en` and `fr` exports of the same analysis differ only in `label`.

## Reading the file

```python
import pandas as pd
df = pd.read_csv("hudson-bay-lowlands-peat_carbon-2026-09-17.csv",
                 sep=";", encoding="utf-8-sig")
```

`sep=";"` and the BOM are both deliberate. A comma-delimited file opens into a
single column in a French-locale Excel, which defaults its list separator to
`;`, and without the BOM Excel renders accented French labels as mojibake.
Decimal separators are always `.` so the `value` column parses identically in
both locales. See `docs/ADR/005-widget-csv-export-format.md`.

## Files

| File | Role |
| --- | --- |
| `serialize.ts` | `toCsv(rows)` — escaping, delimiter, BOM. No React, no app knowledge. |
| `rows.ts` | `buildWidgetCsvRows(params)` — turns a widget's payload into rows. Pure; takes its translators as arguments. |
| `widget-spec.ts` | Per-stat units and per-series label keys. The unit half duplicates `api/services/widgets.py` — see `docs/ADR/006-per-stat-units-duplicated-in-client.md`. |
| `../../hooks/use-widget-csv-download.ts` | Wires the above to the analysis state, the message bundle and the browser download. |

## Adding a stat

1. Add its label to `widgets.<widget_id>.fields.<stat_name>` in both
   `src/i18n/messages/en.json` and `fr.json`.
2. Add its unit to `WIDGET_CSV_SPEC[<widget_id>].stats` in `widget-spec.ts`,
   unless the widget-level `unit` from the API is already correct for it.

Skipping step 1 makes next-intl raise on export. Skipping step 2 silently falls
back to the widget-level unit, which is wrong for any mixed-unit widget.
