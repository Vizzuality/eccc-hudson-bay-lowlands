# ECCC Hudson Bay Lowlands

![Client Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/vizzuality/eccc-hudson-bay-lowlands/badges/client-coverage.json)

Full-stack geospatial project combining Terraform infrastructure and a FastAPI backend for Hudson Bay Lowlands imagery.

## Project Overview

This project provides:
- **FastAPI Backend**: API server with COG tile serving capabilities via TiTiler
- **Terraform Infrastructure**: AWS infrastructure with remote state management
- **Docker Support**: Containerized development and deployment

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- [uv](https://github.com/astral-sh/uv) (for local development without Docker)
- [Terraform](https://www.terraform.io/downloads) (v1.14+ for infrastructure)
- AWS CLI configured with `aws-eccc` profile (for infrastructure)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/eccc-hudson-bay-lowlands/eccc-hudson-bay-lowlands.git
   cd eccc-hudson-bay-lowlands
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health
   - ReDoc: http://localhost:8000/redoc

5. **Stop services**
   ```bash
   docker compose down
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL username | `eccc` |
| `DB_PASSWORD` | PostgreSQL password | `eccc` |
| `DB_NAME` | PostgreSQL database name | `eccc_db` |
| `TESTING` | Enable test mode (uses `eccc_db_test`) | `false` |

See `.env.example` for a complete list of configurable options.

## Development

### With Docker

```bash
# Build and start services
docker compose up --build

# View logs
docker compose logs -f eccc-api

# Rebuild after code changes
docker compose up --build eccc-api

# Run with fresh database
docker compose down -v && docker compose up -d
```

### Without Docker (Local Development)

```bash
# Navigate to API directory
cd api

# Install dependencies
uv sync

# Run development server with auto-reload
uv run fastapi dev main.py

# Run tests
uv run pytest -v

# Lint and format code
uv run ruff check .
uv run ruff format .
```

## Project Structure

```
eccc-hudson-bay-lowlands/
├── api/                    # FastAPI backend
│   ├── main.py             # Application entry point
│   ├── config.py           # Configuration settings
│   ├── routers/            # API route handlers
│   ├── tests/              # Test suite
│   ├── Dockerfile          # Container definition
│   └── pyproject.toml      # Python dependencies
├── docker/                 # Docker utilities
│   └── init-db.sh          # PostgreSQL initialization
├── infrastructure/         # Terraform configuration
│   ├── main.tf             # Core resources
│   ├── providers.tf        # AWS provider setup
│   └── vars/               # Variable files
├── docker-compose.yml      # Service orchestration
├── .env.example            # Environment template
└── CLAUDE.md               # Development guidelines
```

## API Documentation

For detailed API documentation, see [api/README.md](api/README.md).

### Key Endpoints

- `GET /` - API discovery endpoint
- `GET /health` - Health check
- `GET /docs` - Interactive Swagger UI
- `GET /cog/info?url={cog_url}` - COG metadata
- `GET /cog/tiles/{tileMatrixSetId}/{z}/{x}/{y}?url={cog_url}` - Map tiles

## Infrastructure

Terraform configuration for AWS resources. See [INFRASTRUCTURE README.md](infrastructure/README.md) for detailed commands.

```bash
cd infrastructure
terraform init -var-file=vars/terraform.tfvars
terraform plan -var-file=vars/terraform.tfvars
terraform apply -var-file=vars/terraform.tfvars
```

## License

MIT License - see [LICENSE](LICENSE) for details.
