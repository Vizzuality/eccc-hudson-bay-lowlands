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

### `layers`

Stores metadata about geospatial layers (raster, vector, tile, etc.) with internationalized metadata.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `type` | `VARCHAR` | No | Layer type (e.g., `"raster"`, `"vector"`, `"tile"`, `"wms"`) |
| `path` | `VARCHAR` | No | Path or URL to the geospatial data (e.g., S3 path to COG) |
| `units` | `VARCHAR` | Yes | Data units (e.g., `"celsius"`, `"percent"`, `"meters"`) |
| `legend` | `JSON` | Yes | Legend configuration (arbitrary structure for client rendering) |
| `metadata` | `JSON` | No | i18n metadata with structure `{en: {title, description}, fr: {title, description}}` |
| `dataset_id` | `INTEGER` (FK, indexed) | Yes | Foreign key to `datasets.id` |

**ORM model**: `api/models/layer.py`
**Pydantic schema**: `api/schemas/layer.py`
**i18n types**: `api/schemas/i18n.py` (LayerLocale, LayerMetadata)

**Relationships**: Many-to-one with `datasets` via `dataset_id` FK (nullable). Layer optionally belongs to a Dataset.

### `datasets`

Groups related layers with shared i18n metadata and governance.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `metadata` | `JSON` | No | i18n metadata with structure `{en: {title, description, citations, source}, fr: {title, description, citations, source}}` |

**ORM model**: `api/models/dataset.py`
**Pydantic schema**: `api/schemas/dataset.py`
**i18n types**: `api/schemas/i18n.py` (DatasetLocale, DatasetMetadata)

**Relationships**: One-to-many with `layers` via `dataset_id` FK. Cascade delete enabled (deleting a Dataset deletes all child Layers).

### Removed Tables

**`locations`** (removed 2026-02-17)
- Stored named geographic areas; not used in current data model
- Functionality replaced by Dataset grouping mechanism

**`rasters`** (renamed to `layers` 2026-02-17)
- Replaced by Layer model with enhanced schema
- All columns retained; `name` and `description` now in JSONB `metadata` field

## Internationalization (i18n) Strategy

### JSONB Metadata Columns

Layer and Dataset metadata is stored as JSONB with top-level language keys:

```json
{
  "en": {
    "title": "Hudson Bay Temperature",
    "description": "Average daily temperature observations..."
  },
  "fr": {
    "title": "Température de la baie d'Hudson",
    "description": "Observations de température quotidienne moyenne..."
  }
}
```

**Why JSONB instead of a separate translations table?**
- Single metadata object per entity (no JOIN required for translations)
- Flexible (easy to add more languages without schema changes)
- Type-safe (Pydantic validation at request/response boundary)
- Efficient (no foreign key lookups)

### Pydantic Validation

i18n types defined in `api/schemas/i18n.py`:

```python
class LayerLocale(BaseModel):
    title: str
    description: str

class LayerMetadata(BaseModel):
    en: LayerLocale
    fr: LayerLocale
```

Validation enforces presence of both `en` and `fr` keys on create/update. Legacy data in the database may not match the schema exactly (no validation on read).

### Future Migrations

If translations grow in complexity (versioning, review workflows, many languages), migrate to a separate `layer_translations` table with:
- `id`, `layer_id` (FK), `language`, `title`, `description`, `metadata` (JSONB)

For now, JSONB is simpler and sufficient for the 2-language requirement.

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

class Layer(Base):
    __tablename__ = "layers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    dataset_id: Mapped[int | None] = mapped_column(ForeignKey("datasets.id"), nullable=True)

    dataset: Mapped["Dataset | None"] = relationship(back_populates="layers")
```

**Key patterns**:
- `Mapped` type hints for all columns (SQLAlchemy 2.0+ modern syntax)
- `metadata_` Python attribute mapped to `"metadata"` DB column (avoids SQLAlchemy `Base.metadata` collision)
- Use `relationship()` with `back_populates` for bidirectional consistency
- Foreign key constraints enable referential integrity
- Type hints reflect database constraints (`str | None` for nullable)

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
