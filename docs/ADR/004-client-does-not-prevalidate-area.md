# ADR-004: The Client Does Not Pre-Validate Geometry Area

**Date**: 2026-09-14

**Status**: Accepted

## Context

The analysis endpoint rejects a geometry whose area is below 1 sq km or above 50,000 sq km, and returns HTTP 422 in both cases. The client sends the geometry and learns the result from that response. A user who draws a polygon outside the limits therefore waits for a full round trip to a raster-backed endpoint before being told the selection was never going to work.

The obvious improvement is to compute the area in the browser and refuse to send an out-of-range polygon. While fixing EH-142 we considered doing exactly that, and decided against it.

The difficulty is that the browser and the server would be computing the same number by different means. The server projects the geometry to EPSG:6933 with pyproj and measures the result with shapely (see ADR-003). A browser has no pyproj; the practical option is a JavaScript geodesic area function such as the one in turf. The two agree closely but not exactly, and the disagreement is largest in relative terms exactly where it matters — at the 1 sq km boundary, which is the smallest area the product supports.

Two independent computations of the same limit produce a class of failure the current design does not have:

- The client blocks a polygon of 0.999 sq km that the server would have accepted, and the user cannot proceed with a selection that is in fact valid.
- The client passes a polygon of 1.001 sq km that the server rejects, and the user sees the round-trip error anyway, now with the added confusion that the interface had already accepted the shape.

Neither failure is visible in the code. Both would be reported as "the area tool is wrong about the size", which is the same report this ticket already exists to fix.

## Decision

The API is the sole authority on geometry area. The client does not compute area and does not gate submission on it.

`MIN_AREA_KM2` and `MAX_AREA_KM2` exist in `client/src/containers/map/analyze-button/upload-bar/constants.ts` for one purpose: to be interpolated into user-facing text. They are not compared against anything. Any future use of them as a client-side gate is a reversal of this decision, not an extension of it.

## Consequences

### Positive

- One definition of "too small" and "too large" exists in the system, in `api/services/analysis.py`. There is no second implementation to keep in agreement with it.
- No polygon is ever blocked by the interface and accepted by the API, or the reverse. Every size verdict the user sees is the verdict that governs the analysis.
- Changing either limit is a one-file change on the server. The client's copy affects wording only, so a stale value produces a wrong number in a message rather than a wrong decision about a selection.
- Adding a geodesic area library to the client bundle is not required.

### Negative

- Every out-of-range selection costs a full round trip to a raster-backed endpoint before the user sees the error. This is the price we accepted, and it is paid most often by users drawing small areas, who are also the users least likely to expect a rejection.
- The user gets no feedback about size while drawing — no running area readout, no indication of approaching a limit. The first signal is the error after confirming.
- The client cannot distinguish "too small" from "too large" on its own; it depends on the API's 422 response to decide which message to show.

### Neutral

- Both the drawn-polygon flow and the file-upload flow converge on the same server-side check, so neither has an advantage the other lacks.
- If the API ever returns the computed area alongside the error, or returns a machine-readable error code, the client could show a richer message without computing anything itself. That is a strictly better path than client-side computation and does not require revisiting this decision.
- A running area readout during drawing would not require reversing this decision, provided the number is presented as information and not used to block submission. The two computations disagreeing would then be a cosmetic discrepancy rather than a contradictory verdict.
