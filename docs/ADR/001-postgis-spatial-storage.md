# ADR-001: PostGIS for Spatial Data Storage

**Date**: 2026-02-16

**Status**: Accepted

## Context

The application manages geospatial data for the Hudson Bay Lowlands region, including raster metadata and potentially location geometries (polygons, multipolygons). We needed a storage solution that supports spatial queries, coordinate reference systems, and integrates well with the Python/SQLAlchemy stack.

Options considered:
1. Store geometry as GeoJSON text in a regular VARCHAR column
2. Use PostGIS with native Geometry column types
3. Use a separate spatial database or service (e.g., GeoServer)

## Decision

Use PostgreSQL with the PostGIS extension for spatial data storage. Canonical geometry storage uses SRID 4326 (WGS84). The ORM integration uses GeoAlchemy2 for SQLAlchemy Geometry column types and WKB/WKT serialization.

Key implementation details:
- PostGIS extension is enabled via the `docker/init-db.sh` initialization script on both the primary (`eccc_db`) and test (`eccc_db_test`) databases
- The Docker image uses `postgis/postgis:16-3.4` (or `postgres:16` with manual extension creation) to provide PostGIS support
- Geometry columns use `Geometry(srid=4326)` type from GeoAlchemy2
- GeoJSON serialization uses Shapely: `WKBElement` to GeoJSON via `shapely.geometry.mapping()`, GeoJSON to Shapely via `shapely.geometry.shape()`
- CRS transformations between EPSG:3857 (Web Mercator) and EPSG:4326 (WGS84) use pyproj module-level Transformer instances (thread-safe, created once at import time)

## Consequences

### Positive

- Native spatial indexing (GiST indexes) for efficient spatial queries like `ST_Intersects`
- Standard SQL spatial functions available for server-side geometry operations
- Well-established ecosystem with Python bindings (GeoAlchemy2, Shapely)
- SRID 4326 as canonical storage aligns with GeoJSON standard and most web mapping libraries
- WKB binary storage is more compact and faster to query than text-based GeoJSON

### Negative

- Adds PostGIS as a system dependency, increasing Docker image size
- Developers unfamiliar with PostGIS need to learn WKB/WKT serialization patterns
- GeoAlchemy2 adds a layer of abstraction that can be opaque when debugging spatial queries
- Upgrading from plain `postgres:16` to `postgis/postgis:16-3.4` requires clearing existing Docker volumes (`docker compose down -v`)

### Neutral

- Shapely is also needed for client-side geometry operations (validation, bounding box), so the dependency is shared
- pyproj is needed for CRS transformations regardless of storage choice
