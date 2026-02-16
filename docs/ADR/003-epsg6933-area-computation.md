# ADR-003: EPSG:6933 for Area Computation

**Date**: 2026-02-16

**Status**: Accepted

## Context

The application validates user-submitted geometries and computes their area to enforce a maximum size limit (1000 sq km). Computing area from geographic coordinates (EPSG:4326, degrees) produces results in square degrees, which are not meaningful for area measurement. We needed an appropriate projection for accurate area computation.

Options considered:
1. EPSG:4326 -- compute area in square degrees and apply a conversion factor (inaccurate at high latitudes)
2. EPSG:3857 (Web Mercator) -- commonly used in web maps but severely distorts area at high latitudes
3. EPSG:6933 (WGS 84 / NSIDC EASE-Grid 2.0 Global) -- cylindrical equal-area projection
4. Local UTM zone -- accurate but zone-dependent, complex to automate

## Decision

Use EPSG:6933 (WGS 84 / NSIDC EASE-Grid 2.0 Global) for area computation. This is a cylindrical equal-area projection that preserves area globally, making it suitable for computing polygon areas anywhere on Earth without zone selection logic.

Implementation:
- Geometries are stored in EPSG:4326 (WGS84)
- For area computation, geometries are temporarily reprojected to EPSG:6933 using pyproj
- The computed area in square meters is converted to square kilometers
- Geometries exceeding 1000 sq km are rejected with a validation error
- Transformer instances are created at module level (thread-safe, initialized once)

## Consequences

### Positive

- Equal-area projection provides accurate area measurements regardless of latitude
- Global coverage means no zone selection logic is needed (unlike UTM)
- EPSG:6933 is well-supported by pyproj and recognized by the IERS
- The 1000 sq km limit provides a reasonable guard against accidentally large geometries
- Reprojection is only done transiently for computation; stored geometry remains in WGS84

### Negative

- EPSG:6933 distorts shape and distance (it preserves only area), but this is acceptable since we only use it for area measurement
- Adds pyproj as a dependency (though it is already needed for EPSG:3857 to EPSG:4326 transformations)
- The 1000 sq km limit is a fixed business rule; changing it requires a code update

### Neutral

- Hudson Bay Lowlands is at high latitude (~50-60 N), where Web Mercator area distortion would be particularly severe, reinforcing the need for an equal-area projection
- The same pyproj Transformer pattern is used for all CRS operations in the geometry service
