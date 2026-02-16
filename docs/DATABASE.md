# Database

Schema reference and patterns for the ECCC Hudson Bay Lowlands PostgreSQL database.

## Technology

| Component | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 16 | Relational database |
| PostGIS | 3.4 | Spatial extensions for PostgreSQL |
| psycopg | 3.0+ | Python PostgreSQL adapter (binary) |
| SQLAlchemy | 2.0+ | ORM with modern type-annotated syntax |
| GeoAlchemy2 | 0.15+ | SQLAlchemy integration with PostGIS |
| Shapely | 2.0+ | Geometry operations and GeoJSON serialization |
| pyproj | 3.6+ | CRS transformations (EPSG:3857, 4326, 6933) |

## Tables

### `locations`

Stores named geographic areas with PostGIS-backed geometry.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `name` | `VARCHAR` (indexed) | No | Location name |
| `geometry` | `Geometry(srid=4326)` | No | PostGIS geometry column (WGS84). Accepts Polygon/MultiPolygon. |
| `bounding_box` | `JSON` | Yes | Auto-computed bounding box (`{minx, miny, maxx, maxy}`) |
| `area_sq_km` | `FLOAT` | Yes | Auto-computed area in square kilometers (via EPSG:6933) |
| `created_at` | `DATETIME` | No | Creation timestamp |

**ORM model**: `api/models/location.py`
**Pydantic schema**: `api/schemas/location.py`

**Relationships**: One-to-many with `rasters` via `location_id` FK. Cascade delete enabled.

### `rasters`

Stores metadata about Cloud Optimized GeoTIFF (COG) raster datasets.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `name` | `VARCHAR` | No | Raster name (indexed: `ix_rasters_name`) |
| `crs` | `VARCHAR` | No | Coordinate reference system (e.g., `EPSG:4326`) |
| `path` | `VARCHAR` | No | Path or URL to the COG file |
| `description` | `VARCHAR` | Yes | Optional description |
| `location_id` | `INTEGER` (FK, indexed) | Yes | Foreign key to `locations.id` |

**ORM model**: `api/models/raster.py`
**Pydantic schema**: `api/schemas/raster.py`

## Spatial Data Patterns

### PostGIS Extension

PostGIS is enabled on both `eccc_db` and `eccc_db_test` databases via `docker/init-db.sh`:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

The Docker image `postgis/postgis:16-3.4` provides the extension. First-time users upgrading from plain `postgres:16` must run `docker compose down -v` to clear old volumes.

### Geometry Storage

Geometries are stored as PostGIS native `Geometry` type with SRID 4326 (WGS84). This enables spatial indexing and native spatial queries (e.g., `ST_Intersects`).

### Serialization

- **Database to JSON**: GeoAlchemy2 returns `WKBElement`, converted to GeoJSON dict via `shapely.geometry.mapping()`
- **JSON to Database**: GeoJSON dict converted to Shapely geometry via `shapely.geometry.shape()`, then stored as WKB by GeoAlchemy2

### CRS Transformations

The API accepts geometries in EPSG:3857 (Web Mercator) or EPSG:4326 (WGS84). All geometries are transformed to EPSG:4326 for storage. Area computation uses EPSG:6933 (equal-area projection). Module-level `pyproj.Transformer` instances are used for performance (thread-safe, created once at import).

## Connection Configuration

The database connection is configured via environment variables and managed in `api/config.py`:

```
postgresql+psycopg://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}
```

The connection pool uses `pool_pre_ping=True` to verify connections are alive before use.

### Connecting locally

**Via Docker Compose** (database runs as the `eccc-db` service):

```bash
docker compose exec eccc-db psql -U eccc -d eccc_db
```

**Via psql on the host** (when the database port is exposed):

```bash
psql -h localhost -p 5432 -U eccc -d eccc_db
```

**From the API container**:

```bash
docker compose exec eccc-api python -c "
from db.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    print(conn.execute(text('SELECT version()')).scalar())
"
```

## Schema Management

### Current approach: auto-create

Tables are created automatically on API startup via the FastAPI lifespan handler:

```python
Base.metadata.create_all(bind=engine)
```

This approach works well during early development. It creates tables that do not exist but does not modify existing tables (no column additions, type changes, or drops).

### Future: Alembic migrations

For schema evolution (adding columns, renaming fields, adding constraints), the project will adopt Alembic for version-controlled migrations. This is planned but not yet implemented.

## Test Database

A dedicated test database (`eccc_db_test`) is used for testing to avoid polluting development data.

### Setup

The `docker/init-db.sh` script runs on first container startup and creates the test database:

```sql
CREATE DATABASE eccc_db_test;
GRANT ALL PRIVILEGES ON DATABASE eccc_db_test TO eccc;
```

### Usage

Set `TESTING=true` to make the API connect to `eccc_db_test` instead of `eccc_db`. The `config.py` `database_url` property handles the switch automatically.

### Test isolation

Tests use SQLAlchemy transaction rollback for isolation. Each test runs within a transaction that is rolled back after the test completes, so no explicit teardown or data cleanup is needed.

## ORM Patterns

### Model conventions

All models use SQLAlchemy 2.0+ syntax with type annotations:

```python
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base

class Raster(Base):
    __tablename__ = "rasters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
```

### Query patterns

The API uses the SQLAlchemy 2.0 `select()` API:

```python
from sqlalchemy import select, func
from models.raster import Raster

# Count
total = db.scalar(select(func.count()).select_from(Raster))

# Paginated list
stmt = select(Raster).offset(offset).limit(size)
rasters = db.scalars(stmt).all()
```

### Session management

Database sessions are provided via FastAPI dependency injection:

```python
from db.database import get_db

@router.get("/items")
def list_items(db: Session = Depends(get_db)):
    ...
```

The `get_db()` generator yields a session and ensures it is closed after the request completes.

## Related Documentation

- [Architecture](ARCHITECTURE.md) -- system overview and tech stack
- [Environment Variables](ENVIRONMENT_VARIABLES.md) -- database connection variables
- [API README](../api/README.md) -- endpoint documentation
