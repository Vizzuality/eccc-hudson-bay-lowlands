# ADR-006: Per-Stat Units Are Duplicated in the Client, Temporarily

**Date**: 2026-09-17

**Status**: Accepted

## Context

The CSV export defined in ADR-005 has a `unit` column, one unit per row. The analysis response cannot fill it.

`api/services/widgets.py` defines a unit on every individual stat:

```python
{"name": "peat_depth_avg", "op": "mean", "unit": "cm", "precision": 1},
{"name": "carbon_total",   "op": "sum",  "unit": "Mt", "scale": 0.0000009, "precision": 2},
{"name": "carbon_density", "op": "mean", "unit": "kg/m²", "precision": 2},
```

but the response ships only a single widget-level `unit`. That field is documented in the same file as a display unit for the widget as a whole, chosen as the primary metric when a widget's stats have mixed units. For `peat_carbon` it is `"cm"`, while three of the four stats are not centimetres. For `treed_area` it is `"km²"`, while four of the ten stats are percentages.

Filling the CSV's `unit` column from the widget-level unit would therefore write `carbon_total = 8.4 cm` into a file that leaves the application and gets cited. That is not a display defect that a user can see through — it is wrong units on exported science data, and the reader has nothing to check it against.

The correct fix is to surface the per-stat `unit` that already exists in the API response. EH-97 was scoped as a frontend-only change, and that scope was reaffirmed after this problem was raised.

## Decision

The client keeps its own per-stat unit table, in `client/src/lib/csv/widget-spec.ts`, mirroring the `unit` values in `api/services/widgets.py`.

This is accepted as temporary duplication, not as the destination. A follow-up ticket adds `unit` to each stat in the analysis response; when it ships, the unit table in `widget-spec.ts` is deleted and the CSV reads the unit from the payload.

## Consequences

### Positive

- The exported `unit` column is correct for every row on day one, including the mixed-unit widgets that the widget-level field cannot describe.
- EH-97 ships without an API change, a schema change or a coordinated deploy.
- The table is small, in one file, and reads as data rather than logic, so replacing it later is a deletion rather than a refactor.

### Negative

- The same information now exists in two languages in two deploy artifacts, with nothing enforcing agreement. The client cannot import the Python spec, so there is no test that can catch the drift.
- The drift is silent and slow. If a stat's unit changes server side, the CSV keeps exporting the old one and nothing fails — not a type check, not a test, not a runtime error. The first signal is a reader noticing an implausible number, which may not happen at all.
- Adding a new stat to `api/services/widgets.py` now has a second, non-obvious step in another repository directory. Forgetting it produces a row with an empty `unit`, which is the better of the two failure modes but is still wrong.

### Neutral

- Units are locale-invariant, so this duplication costs nothing in translation and the table is identical for `en` and `fr`.
- `widget-spec.ts` also holds the i18n key for each chart series label, which is genuinely client-side information. Only the unit half of that file is the duplication this ADR is about.
- The precision of each value is not duplicated. The API rounds server side and the client writes the value verbatim, so there is one definition of how many decimal places a stat has.
