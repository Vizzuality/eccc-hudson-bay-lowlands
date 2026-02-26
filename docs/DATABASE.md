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

## Data Model

The application uses a three-level hierarchy: **Category > Dataset > Layer**.

```
Category (e.g., "Climate")
  └── Dataset (e.g., "Temperature Observations")
        └── Layer (e.g., "Mean Annual Temperature 2024")
```

## Tables

### `categories`

Top-level grouping for related datasets.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `metadata` | `JSON` | No | Field-first i18n metadata (see i18n section below) |

**ORM model**: `api/models/category.py`
**Pydantic schema**: `api/schemas/category.py`

**Relationships**: One-to-many with `datasets` via `category_id` FK. Cascade delete enabled.

### `datasets`

Groups related layers with shared i18n metadata. Belongs to a category.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `metadata` | `JSON` | No | Field-first i18n metadata (see i18n section below) |
| `category_id` | `INTEGER` (FK, indexed) | No | Foreign key to `categories.id` |

**ORM model**: `api/models/dataset.py`
**Pydantic schema**: `api/schemas/dataset.py`

**Relationships**: Many-to-one with `categories` via `category_id` FK. One-to-many with `layers` via `dataset_id` FK. Cascade delete enabled on layers.

### `layers`

Stores metadata about Cloud Optimized GeoTIFF (COG) and other geospatial layers with i18n support.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `INTEGER` (PK, auto-increment) | No | Primary key |
| `format` | `VARCHAR` | No | Data format (e.g., `"cog"`, `"geojson"`, `"pmtiles"`) |
| `type` | `VARCHAR` | Yes | Layer type (e.g., `"raster"`, `"vector"`) |
| `path` | `VARCHAR` | No | Path or URL to the geospatial data (COG, vector file, WMS, etc.) |
| `unit` | `VARCHAR` | Yes | Data measurement unit (e.g., `"celsius"`, `"percent"`) |
| `categories` | `JSON` | Yes | Category definitions for classified layers (list of `{value, label}`) |
| `metadata` | `JSON` | No | Field-first i18n metadata (see i18n section below) |
| `dataset_id` | `INTEGER` (FK, indexed) | Yes | Foreign key to `datasets.id`; nullable to allow orphaned layers |

**ORM model**: `api/models/layer.py`
**Pydantic schema**: `api/schemas/layer.py`

**Relationships**: Many-to-one with `datasets` via `dataset_id` FK (optional).

**ORM Note**: The `metadata` column is accessed via the Python attribute `metadata_` to avoid collision with SQLAlchemy's reserved `Base.metadata`. Similarly, `format` maps to `format_` and `type` maps to `type_`.

## Internationalization (i18n)

All `metadata` columns use a **field-first** i18n structure. Each field contains an object with language keys, rather than grouping all fields under a language key.

**Category metadata example:**

```json
{
  "title": {"en": "Climate", "fr": "Climat"}
}
```

**Dataset metadata example:**

```json
{
  "title": {"en": "Temperature Observations", "fr": "Observations de température"},
  "description": {"en": "Average daily temperature data", "fr": "Données de température quotidienne moyenne"},
  "source": {"en": "Environment Canada", "fr": "Environnement Canada"},
  "citation": null
}
```

**Layer metadata example:**

```json
{
  "title": {"en": "Mean Annual Temperature 2024", "fr": "Température annuelle moyenne 2024"},
  "description": {"en": "Gridded temperature at 1km resolution", "fr": "Température maillée à 1 km de résolution"}
}
```

**Layer categories (classified raster) example:**

```json
[
  {"value": 1, "label": {"en": "Forest", "fr": "Forêt"}},
  {"value": 2, "label": {"en": "Wetland", "fr": "Milieu humide"}},
  {"value": 3, "label": {"en": "Open Water", "fr": "Eau libre"}}
]
```

This field-first approach (as opposed to language-first) makes it easier to add or remove fields without restructuring. Pydantic schemas (`I18nText`, `LayerMetadata`, `DatasetMetadata`, `CategoryMetadata`) enforce the structure at the API boundary.

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

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    datasets: Mapped[list["Dataset"]] = relationship(back_populates="category", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    category: Mapped["Category"] = relationship(back_populates="datasets")
    layers: Mapped[list["Layer"]] = relationship(back_populates="dataset", cascade="all, delete-orphan")

class Layer(Base):
    __tablename__ = "layers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    format_: Mapped[str] = mapped_column("format", String, nullable=False)
    type_: Mapped[str | None] = mapped_column("type", String, nullable=True)
    path: Mapped[str] = mapped_column(String, nullable=False)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    categories: Mapped[list | None] = mapped_column(JSON, nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    dataset_id: Mapped[int | None] = mapped_column(ForeignKey("datasets.id"), nullable=True, index=True)
    dataset: Mapped["Dataset | None"] = relationship(back_populates="layers")
```

**Key design notes**:
- `metadata_` Python attribute maps to `"metadata"` DB column (avoids SQLAlchemy `Base.metadata` collision)
- `format_` maps to `"format"` and `type_` maps to `"type"` (avoids Python built-in collisions)
- Bidirectional relationships use `back_populates` for consistency
- Cascade delete: Category -> Datasets -> Layers (deleting a category removes all its datasets and layers)
- `category_id` and `dataset_id` are indexed for fast FK lookups

### Query patterns

The API uses the SQLAlchemy 2.0 `select()` API:

```python
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from models.layer import Layer
from models.dataset import Dataset
from models.category import Category

# Count total
total = db.scalar(select(func.count()).select_from(Layer))

# Paginated list with optional search (field-first metadata: title.en, title.fr)
stmt = select(Layer).offset(offset).limit(limit)
if search:
    search_pattern = f"%{search}%"
    stmt = stmt.where(
        or_(
            Layer.metadata_["title"]["en"].as_string().ilike(search_pattern),
            Layer.metadata_["title"]["fr"].as_string().ilike(search_pattern),
        )
    )
layers = db.scalars(stmt).all()

# Get dataset with nested layers (selectinload for eager loading)
stmt = select(Dataset).options(selectinload(Dataset.layers)).where(Dataset.id == dataset_id)
dataset = db.scalar(stmt)

# Get category with nested datasets and their layers (two-level eager loading)
stmt = (
    select(Category)
    .options(selectinload(Category.datasets).selectinload(Dataset.layers))
    .where(Category.id == category_id)
)
category = db.scalar(stmt)
```

**Search pattern note**: With the field-first i18n structure, JSONB paths are `metadata["title"]["en"]` and `metadata["title"]["fr"]`. The `.as_string()` method converts JSON values to text for case-insensitive `.ilike()` pattern matching.

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
