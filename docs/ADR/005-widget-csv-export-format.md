# ADR-005: Widget CSV Export Uses a Long-Format Table

**Date**: 2026-09-17

**Status**: Accepted

## Context

EH-97 adds a per-widget data download to the analysis view. Each widget already offers a PNG of itself; the new requirement is the numbers behind it, as CSV, produced in the browser from data the client already holds.

A CSV is one rectangular table. The six analysis widgets are not. Each one carries a `WidgetData` with two unrelated payloads:

- `chart`: a `Record<seriesKey, points[]>`. `peat_carbon` has two series with different x-axes and different units. The donut widgets have one. `snow_dynamics` has one line built by flattening the record.
- `stats`: a flat record whose relationship to `chart` differs per widget. In `flood_susceptibility` the stats largely restate the chart slices as percentages. In `water_dynamics` the three trend stats are numbers that appear nowhere in the chart. In `snow_dynamics` the twelve stats are really a six-row table of winters, of which the interface shows one at a time.

So there is no widget-independent notion of "the data behind this widget" that is naturally rectangular, and any format that picks `chart` or `stats` alone drops something a user can see on screen.

Two further constraints shaped the format. This is a bilingual Government of Canada product, so a francophone user opening the file in Excel is an ordinary case, not an edge case — and in a French locale Excel's list separator is `;`, so a comma-delimited file lands entirely in column A. Separately, `Dataset.metadata` already carries `source` and `citation`, which exist so that people cite the data.

## Decision

One CSV per widget, one table, six columns:

```
section;series;key;label;value;unit
```

- `section` is `metadata`, `stats` or `chart`. Filtering to measurements is `section != "metadata"`.
- `series` is the raw key of the `WidgetData.chart` record, and is empty for `metadata` and `stats` rows. This is what lets `peat_carbon`'s two histograms coexist without special-casing.
- `key` is the raw API identifier, unchanged between locales and across releases. It is the join column.
- `label` is the translated human name. It is never used to identify a row.
- `value` is the API value written verbatim.
- `unit` is the unit of that row's value. See ADR-006.

The file is delimited with `;`, uses `.` as the decimal separator in every locale, writes dates as ISO 8601, and is encoded UTF-8 with a byte-order mark. Fields are escaped per RFC 4180.

`en` and `fr` exports of the same analysis differ only in the `label` column.

## Consequences

### Positive

- Everything the widget displays is in the file. A `water_dynamics` download contains the trend percentages, and a `snow_dynamics` download contains all six winters rather than the one the in-widget selector happens to be showing.
- One serialiser covers all six widgets. Widgets with several chart series, with stats that duplicate chart slices, and with stats that have no chart at all all produce the same row shape.
- The file is a legal single-table CSV. `pandas.read_csv(path, sep=";", encoding="utf-8-sig")` reads it, as does Excel by double-click in both an English and a French locale.
- Because `key` is the raw API name and `.` is always the decimal separator, an `en` file and an `fr` file of the same analysis can be concatenated or diffed, and a script written against one works against the other.
- The citation travels with the data. A number taken out of the application carries the dataset title, source and citation that make it attributable.

### Negative

- The result is a tidy/long table. A user who wanted one column per series has to pivot it.
- `pandas.read_csv` needs two arguments rather than none. A caller who omits `sep=";"` gets one column, not an error.
- Metadata rows share the table with measurements, so a naive consumer that sums the `value` column gets nonsense unless it filters on `section` first.
- `value` is not a numeric column. `snow_dynamics` end dates are strings, and the metadata rows hold text.

### Neutral

- The BOM is required for Excel to render accented French labels correctly. Modern parsers strip it; `pandas` needs `encoding="utf-8-sig"`.
- The `analysis_url` metadata row exists only once an analysis has been shared, so it is present on `/{locale}/analysis/{id}` and absent when the panel is opened from the map sidebar. The file is therefore not byte-identical between the two entry points.
- Adding a seventh column, or a fourth `section` value such as a legend table, is additive and does not break a consumer that selects columns by name.
