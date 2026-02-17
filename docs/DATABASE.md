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

### `datasets`

Groups related layers with shared i18n metadata. Supports cascade deletion.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `metadata` | `JSON` | No | i18n metadata: `{en: {title, description, citations, source}, fr: {...}}` |

**ORM model**: `api/models/dataset.py`
**Pydantic schema**: `api/schemas/dataset.py`

**Relationships**: One-to-many with `layers` via `dataset_id` FK. Cascade delete enabled.

### `layers`

Stores metadata about Cloud Optimized GeoTIFF (COG) and other geospatial layers with i18n support.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `type` | `VARCHAR` | No | Layer type (e.g., `"raster"`, `"vector"`, `"tile"`) |
| `path` | `VARCHAR` | No | Path or URL to the geospatial data (COG, vector file, WMS, etc.) |
| `units` | `VARCHAR` | Yes | Data units (e.g., `"celsius"`, `"percent"`) |
| `legend` | `JSON` | Yes | Legend configuration (arbitrary structure for UI rendering) |
| `metadata` | `JSON` | No | i18n metadata: `{en: {title, description}, fr: {...}}` |
| `dataset_id` | `INTEGER` (FK, indexed) | Yes | Foreign key to `datasets.id`; nullable to allow orphaned layers |

**ORM model**: `api/models/layer.py`
**Pydantic schema**: `api/schemas/layer.py`

**Relationships**: Many-to-one with `datasets` via `dataset_id` FK (optional).

**i18n Note**: The `metadata` column stores JSONB with language keys at the top level. Python ORM attribute is `metadata_` to avoid collision with SQLAlchemy's reserved `Base.metadata`.

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
from sqlalchemy import Integer, String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    layers: Mapped[list["Layer"]] = relationship(back_populates="dataset", cascade="all, delete-orphan")

class Layer(Base):
    __tablename__ = "layers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    units: Mapped[str | None] = mapped_column(String, nullable=True)
    legend: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    dataset_id: Mapped[int | None] = mapped_column(ForeignKey("datasets.id"), nullable=True, index=True)
    dataset: Mapped["Dataset | None"] = relationship(back_populates="layers")
```

**Key design notes**:
- `metadata_` Python attribute maps to `"metadata"` DB column (avoids SQLAlchemy `Base.metadata` collision)
- Bidirectional relationships use `back_populates` for consistency
- Cascade delete on Dataset ensures orphaned Layers are removed
- `dataset_id` is indexed for fast FK lookups

### Query patterns

The API uses the SQLAlchemy 2.0 `select()` API:

```python
from sqlalchemy import select, func, or_
from models.layer import Layer
from models.dataset import Dataset

# Count total
total = db.scalar(select(func.count()).select_from(Layer))

# Paginated list with optional search (case-insensitive title search in en+fr metadata)
stmt = select(Layer).offset(offset).limit(limit)
if search:
    search_pattern = f"%{search}%"
    stmt = stmt.where(
        or_(
            Layer.metadata_["en"]["title"].astext.ilike(search_pattern),
            Layer.metadata_["fr"]["title"].astext.ilike(search_pattern),
        )
    )
layers = db.scalars(stmt).all()

# Get with nested relationship (selectinload for eager loading)
from sqlalchemy.orm import selectinload
stmt = select(Dataset).options(selectinload(Dataset.layers)).where(Dataset.id == dataset_id)
dataset = db.scalar(stmt)
```

**Search pattern note**: JSONB searches use `.astext` to convert JSON values to text, then `.ilike()` for case-insensitive pattern matching. This works for both en and fr title fields.

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
