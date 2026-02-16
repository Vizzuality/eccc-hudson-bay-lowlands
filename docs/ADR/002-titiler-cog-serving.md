# ADR-002: TiTiler for COG Tile Serving

**Date**: 2026-02-16

**Status**: Accepted

## Context

The application needs to serve map tiles from Cloud Optimized GeoTIFF (COG) files for the Hudson Bay Lowlands region. COGs store imagery in a tiled, internally organized format that supports efficient partial reads via HTTP range requests.

Options considered:
1. Custom tile generation using GDAL/rasterio directly
2. TiTiler -- a FastAPI-native dynamic tile server library
3. Separate tile server (e.g., MapServer, GeoServer) as a standalone service
4. Pre-generated static tile sets (MBTiles or directory-based)

## Decision

Use TiTiler Core (`titiler-core==1.1.0`) as an embedded router within the FastAPI application. TiTiler provides a ready-made `TilerFactory` that generates a full set of COG endpoints (tile serving, metadata, TileJSON) which are mounted at the `/cog` prefix.

Implementation:
- TiTiler is included as a Python dependency in `api/pyproject.toml`
- The COG router is created via `TilerFactory` and mounted in `api/main.py` at `/cog`
- Requires GDAL system libraries (`libgdal-dev`) installed in the Docker image

## Consequences

### Positive

- Eliminates custom tile generation code; TiTiler handles tiling, reprojection, and color mapping
- Standards-compliant: produces TileJSON, supports multiple tile matrix sets
- Integrates natively with FastAPI (shares the same ASGI app, middleware, and OpenAPI docs)
- Dynamic tile generation means no pre-processing pipeline needed for new COG files
- COG format supports efficient partial reads from S3 or HTTP sources

### Negative

- GDAL is a large system dependency (~200MB+) that increases Docker image size
- TiTiler version is pinned (`1.1.0`), which may lag behind upstream improvements
- All tile requests hit the application server; no CDN or static tile caching by default
- GDAL installation can be fragile across different OS environments (requires `libgdal-dev` on Ubuntu)

### Neutral

- The `/cog` endpoints appear in the OpenAPI docs alongside custom endpoints, which provides a unified API surface
- TiTiler supports additional factories (STAC, MosaicJSON) that could be added later if needed
