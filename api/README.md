# ECCC Hudson Bay Lowlands API

Backend API for the Hudson Bay Lowlands geospatial application, built with FastAPI. Includes COG tile serving via TiTiler.

## Features

- **COG Tile Serving**: Serve tiles from Cloud Optimized GeoTIFFs via TiTiler
- **OpenAPI Documentation**: Interactive API docs at `/docs` (Swagger UI) and `/redoc`
- **CORS Support**: Configured for client application integration
- **Health Checks**: Endpoint for monitoring service status

## Requirements

- Python >= 3.11
- [uv](https://docs.astral.sh/uv/) package manager

## Setup

1. Navigate to the api directory:
   ```bash
   cd api
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

## Running the Application

### Development Server

```bash
uv run fastapi dev main.py
```

The server will start at `http://127.0.0.1:8000` with auto-reload enabled.

### Production Server

```bash
uv run fastapi run main.py
```

Or using uvicorn directly:

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API discovery and information |
| `GET /health` | Health check endpoint |
| `GET /docs` | Swagger UI documentation |
| `GET /redoc` | ReDoc documentation |
| `GET /openapi.json` | OpenAPI schema |
| `/cog/*` | TiTiler COG endpoints (tiles, tilejson, info, etc.) |

### COG Endpoints

The `/cog` prefix provides TiTiler endpoints for COG operations:

- `GET /cog/info?url={cog_url}` - Get COG metadata
- `GET /cog/tiles/{tileMatrixSetId}/{z}/{x}/{y}?url={cog_url}` - Get map tiles
- `GET /cog/{tileMatrixSetId}/tilejson.json?url={cog_url}` - Get TileJSON

## Development

### Running Tests

```bash
uv run pytest
```

With verbose output:

```bash
uv run pytest -v
```

### Linting

```bash
uv run ruff check .
```

Auto-fix linting issues:

```bash
uv run ruff check . --fix
```

### Code Formatting

```bash
uv run ruff format .
```

## Project Structure

```
api/
├── main.py           # FastAPI application entry point
├── config.py         # Configuration settings
├── routers/
│   ├── health.py     # Health check endpoints
│   └── cog.py        # TiTiler COG router
├── tests/
│   ├── conftest.py   # Test fixtures
│   ├── test_health.py
│   └── test_cog.py
├── pyproject.toml    # Project dependencies and configuration
└── README.md
```

## License

MIT License - see [LICENSE](../LICENSE) for details.
