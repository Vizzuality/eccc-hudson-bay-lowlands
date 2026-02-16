# ECCC Hudson Bay Lowlands API

FastAPI backend for the Hudson Bay Lowlands geospatial application. Provides COG tile serving via TiTiler, raster and location management with PostGIS geometry storage, geometry validation, and a health check endpoint with database connectivity verification.

## Requirements

- Python >= 3.12
- [uv](https://docs.astral.sh/uv/) package manager
- PostgreSQL 16 with PostGIS 3.4 (running via Docker or installed locally)
- GDAL system libraries (`libgdal-dev` on Ubuntu, `gdal` via Homebrew on macOS)
- GEOS and PROJ system libraries (`libgeos-dev`, `libproj-dev` on Ubuntu)

## Setup

```bash
cd api
uv sync
```

## Running the Application

### Development server (with auto-reload)

```bash
uv run fastapi dev main.py
```

The server starts at http://127.0.0.1:8000.

### Production server

```bash
uv run fastapi run main.py
```

## API Endpoints

### Documentation

| Endpoint | Description |
|----------|-------------|
| `GET /` | API discovery with links to all endpoints |
| `GET /docs` | Interactive Swagger UI |
| `GET /redoc` | ReDoc documentation |
| `GET /openapi.json` | OpenAPI schema |

### Health

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check with database connectivity (200 if healthy, 503 if unhealthy) |

### COG Tile Serving (via TiTiler)

| Endpoint | Description |
|----------|-------------|
| `GET /cog/info?url={cog_url}` | COG metadata and information |
| `GET /cog/tiles/{tileMatrixSetId}/{z}/{x}/{y}?url={cog_url}` | Map tiles |
| `GET /cog/{tileMatrixSetId}/tilejson.json?url={cog_url}` | TileJSON format |

### Raster Management

| Endpoint | Description |
|----------|-------------|
| `GET /rasters?page=1&size=10&location_id=1` | Paginated list of rasters (optional location filter) |
| `POST /rasters` | Create a new raster entry with optional `location_id` (returns 201) |

### Location Management

| Endpoint | Description |
|----------|-------------|
| `GET /locations?page=1&size=10` | Paginated list of locations |
| `GET /locations/{id}` | Retrieve location by ID with nested rasters |
| `POST /locations` | Create location with GeoJSON geometry (Polygon/MultiPolygon), CRS, area validation |

### Geometry Validation

| Endpoint | Description |
|----------|-------------|
| `POST /geometry` | Validate GeoJSON geometry (coordinate bounds, area limit, type check) |

For full request/response schemas, see the interactive docs at `/docs`.

## Development

### Tests

```bash
uv run pytest          # Run all tests
uv run pytest -v       # Verbose output
```

Tests require a running PostgreSQL instance with the `eccc_db_test` database. When using Docker Compose, this is created automatically by the init script.

### Linting

```bash
uv run ruff check .           # Check for issues
uv run ruff check . --fix     # Auto-fix issues
uv run ruff format .          # Format code
```

## Project Structure

```
api/
|-- main.py                 # FastAPI app entry point, router mounting, lifespan
|-- config.py               # Settings class (pydantic-settings, env vars)
|-- db/
|   |-- base.py             # SQLAlchemy declarative base
|   +-- database.py         # Engine, SessionLocal, get_db() dependency
|-- models/
|   |-- __init__.py         # Model exports (Location, Raster)
|   |-- location.py         # Location ORM model (PostGIS geometry)
|   +-- raster.py           # Raster ORM model (with location FK)
|-- schemas/
|   |-- __init__.py
|   |-- location.py         # Location request/response schemas
|   |-- geometry.py         # Geometry validation response schema
|   +-- raster.py           # Raster request/response schemas
|-- routers/
|   |-- health.py           # Health check endpoint
|   |-- cog.py              # TiTiler COG router
|   |-- rasters.py          # Raster CRUD endpoints
|   |-- locations.py        # Location CRUD endpoints
|   +-- geometry.py         # Geometry validation endpoint
|-- services/
|   +-- geometry.py         # CRS transforms, area computation, bbox
|-- tests/
|   |-- conftest.py         # Test fixtures and configuration
|   |-- test_health.py      # Health endpoint tests (4 tests)
|   |-- test_cog.py         # COG endpoint tests (3 tests)
|   |-- test_rasters.py     # Raster CRUD tests (24 tests)
|   |-- test_locations.py   # Location CRUD tests (30 tests)
|   +-- test_geometry.py    # Geometry validation tests (5 tests)
|-- Dockerfile              # Multi-stage Python build
+-- pyproject.toml          # Dependencies and tool configuration
```

## Dependencies

| Package | Purpose |
|---------|---------|
| fastapi[standard] | Web framework with standard extras |
| titiler-core (1.1.0) | COG tile serving |
| pydantic-settings | Environment variable configuration |
| sqlalchemy (2.0+) | ORM |
| psycopg[binary] (3.0+) | PostgreSQL adapter |
| geoalchemy2 (0.15+) | SQLAlchemy PostGIS integration |
| shapely (2.0+) | Geometry operations and validation |
| pyproj (3.6+) | CRS transformations |
| pytest | Testing framework |
| httpx | HTTP test client |
| ruff | Linting and formatting |

## Docker

The `api/Dockerfile` uses a multi-stage build:

1. **base**: Python 3.12-slim with GDAL system dependencies
2. **builder**: Installs Python dependencies via uv with frozen lockfile
3. **runtime**: Minimal image with non-root user (`appuser`), exposes port 8000

## Related Documentation

- [Getting Started](../docs/GETTING_STARTED.md) -- full setup guide
- [Database](../docs/DATABASE.md) -- schema reference
- [Environment Variables](../docs/ENVIRONMENT_VARIABLES.md) -- all configuration
- [Architecture](../docs/ARCHITECTURE.md) -- system overview

## License

MIT License -- see [LICENSE](../LICENSE) for details.
