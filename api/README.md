# ECCC Hudson Bay Lowlands API

FastAPI backend for the Hudson Bay Lowlands geospatial application. Provides COG tile serving via TiTiler, layer/dataset/category catalogue with multilingual JSONB metadata, geometry-driven zonal-statistics analysis (POST /analysis), authenticated seeding, and a health check.

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

### Layer Management

| Endpoint | Description |
|----------|-------------|
| `GET /layers?offset=0&limit=10` | Paginated list of layers |
| `GET /layers/{id}` | Retrieve a specific layer |
| `POST /layers` | Create a new layer with i18n metadata (en/fr) |

### Dataset Management

| Endpoint | Description |
|----------|-------------|
| (Coming soon) | Create, list, and manage datasets that group related layers |

### Analysis (Geometry Validation + Zonal Statistics)

| Endpoint | Description |
|----------|-------------|
| `POST /analysis` | Validate a GeoJSON `Feature` / `FeatureCollection` (EPSG:4326, Polygon/MultiPolygon) and compute pixel-coverage-weighted statistics for the configured raster layers. Returns one widget object per key (currently `peat_carbon`, `water_dynamics`); each widget has `unit`, `layers` (list of `{id, title, path}`), `chart` (keyed by layer id), and a typed `stats` object. Returns 422 for invalid geometry, 500 if `S3_BUCKET_NAME` is unset. |

Widgets and the layers/ops/stats they consume are declared in `api/services/widgets.py` (`WIDGET_CONFIG`); the builder in `api/services/zonal_stats.py` is generic, so adding a new raster or widget does not require new branching code.

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
|   |-- __init__.py         # Model exports (Layer, Dataset)
|   |-- layer.py            # Layer ORM model (with i18n metadata)
|   +-- dataset.py          # Dataset ORM model (groups layers)
|-- schemas/
|   |-- __init__.py         # Schema exports
|   |-- i18n.py             # Shared i18n Pydantic types (LayerLocale, DatasetLocale, etc.)
|   |-- layer.py            # Layer request/response schemas
|   +-- dataset.py          # Dataset request/response schemas
|-- routers/
|   |-- health.py           # Health check endpoint
|   |-- cog.py              # TiTiler COG tile serving
|   +-- layers.py           # Layer CRUD endpoints
|-- tests/
|   |-- conftest.py         # Test fixtures and configuration
|   |-- test_health.py      # Health endpoint tests (4 tests)
|   |-- test_cog.py         # COG endpoint tests (3 tests)
|   |-- test_layers.py      # Layer CRUD tests (25 tests)
|   +-- test_datasets.py    # Dataset tests (8 tests)
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
