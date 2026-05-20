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
uv run uvicorn main:app --reload --port 8000
```

The server starts at http://127.0.0.1:8000.

### Production server

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

(This mirrors the `CMD` in `api/Dockerfile`.)

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

### Catalogue (read-only)

| Endpoint | Description |
|----------|-------------|
| `GET /categories?offset=0&limit=10&search=&include_datasets=&include_layers=` | Paginated list of categories with optional nested datasets/layers |
| `GET /categories/{id}` | Retrieve a category, optionally with nested datasets and layers |
| `GET /datasets?offset=0&limit=10&search=&include_layers=&category_id=` | Paginated list of datasets, optionally filtered by category |
| `GET /datasets/{id}?include_layers=` | Retrieve a dataset, optionally with nested layers |
| `GET /layers?offset=0&limit=10&search=` | Paginated list of layers with case-insensitive search across en/fr titles |
| `GET /layers/{id}` | Retrieve a specific layer |

### Study area

| Endpoint | Description |
|----------|-------------|
| `GET /hbl-area` | Returns the Hudson Bay Lowlands study-area boundary as GeoJSON |

### Seeding (authenticated)

| Endpoint | Description |
|----------|-------------|
| `POST /seed` | Upserts categories, datasets, and layers from a JSON payload. Requires `X-Seed-Secret` header matching the `SEED_SECRET` env var. Idempotent. |

### Analysis (geometry validation + zonal statistics)

| Endpoint | Description |
|----------|-------------|
| `POST /analysis` | v1 (legacy): geometry must intersect the HBL bbox. Returns an `AnalysisResponse` with typed widget objects (`peat_carbon`, `water_dynamics`, `flood_susceptibility`, `snow_dynamics`, `treed_area`, `ecosystem_classification`). |
| `POST /analysis/v2` | Same response shape as `/analysis` but the geometry must lie *entirely within* the HBL study-area polygon. New clients should target v2. |
| `POST /analysis/v2/share` | Persists a rendered analysis snapshot for public sharing. Body: `{analysis, geojson}`. Returns `{id: UUID}` (201). The geojson is re-validated through the v2 pipeline. |
| `GET /analysis/v2/share/{share_id}` | Returns `{id, analysis, geojson, created_at}`. Re-validates the stored analysis against the current schema; returns 410 Gone if the row is missing or has drifted. |

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
|-- seed.py                 # Standalone CLI seed script (posts to /seed)
|-- db/
|   |-- base.py             # SQLAlchemy declarative base
|   +-- database.py         # Engine, SessionLocal, get_db() dependency
|-- models/
|   |-- __init__.py         # Model exports
|   |-- category.py         # Category ORM model
|   |-- dataset.py          # Dataset ORM model
|   |-- layer.py            # Layer ORM model (string PK; i18n metadata)
|   +-- shared_analysis.py  # SharedAnalysis ORM model (public share links)
|-- schemas/
|   |-- __init__.py         # Schema exports
|   |-- i18n.py             # Shared i18n Pydantic types (I18nText, *Metadata)
|   |-- analysis.py         # Analysis request/response schemas (typed widgets)
|   |-- category.py         # Category schemas
|   |-- dataset.py          # Dataset schemas
|   |-- layer.py            # Layer schemas
|   +-- shared_analysis.py  # SharedAnalysis schemas
|-- routers/
|   |-- health.py           # Health check
|   |-- cog.py              # TiTiler COG tile serving
|   |-- categories.py       # GET /categories
|   |-- datasets.py         # GET /datasets
|   |-- layers.py           # GET /layers
|   |-- seed.py             # POST /seed (X-Seed-Secret auth)
|   |-- analysis.py         # POST /analysis, /analysis/v2, /analysis/v2/share
|   +-- hbl_area.py         # GET /hbl-area
|-- services/
|   |-- analysis.py         # Geometry validation pipeline (area, scope, structural)
|   |-- widgets.py          # WIDGET_CONFIG — declarative widget→layer→stats/chart map
|   |-- zonal_stats.py      # Generic widget builder powered by exactextract
|   |-- shared_analysis.py  # create/get/delete_expired for shared analyses
|   |-- cleanup.py          # @repeat_at scheduled cleanup of expired shares
|   +-- seed.py             # Upsert logic for categories/datasets/layers
|-- tests/
|   |-- conftest.py         # Test fixtures (DB session rollback isolation)
|   |-- test_health.py
|   |-- test_cog.py
|   |-- test_cog_integration.py
|   |-- test_categories.py
|   |-- test_datasets.py
|   |-- test_layers.py
|   |-- test_seed.py
|   |-- test_analysis.py    # validation + per-widget stats/chart assertions
|   +-- test_shared_analysis.py
|-- Dockerfile              # Multi-stage Python build (python:3.12-slim)
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
