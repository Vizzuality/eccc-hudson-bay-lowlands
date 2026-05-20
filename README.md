# ECCC Hudson Bay Lowlands

[![Deploy Trunk](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/deploy-trunk.yml/badge.svg?branch=main)](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/deploy-trunk.yml)
[![API CI](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/api-ci.yml/badge.svg)](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/api-ci.yml)
[![Client CI](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/client-ci.yml/badge.svg?branch=main)](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/client-ci.yml)
[![e2e Tests](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/e2e-tests.yml/badge.svg?branch=main)](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/actions/workflows/e2e-tests.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Vizzuality_eccc-hudson-bay-lowlands&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Vizzuality_eccc-hudson-bay-lowlands)
-- TODO: Coverage
[![Coverage -- TODO](https://sonarcloud.io/api/project_badges/measure?project=Vizzuality_eccc-hudson-bay-lowlands&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Vizzuality_eccc-hudson-bay-lowlands)

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
   git clone https://github.com/Vizzuality/eccc-hudson-bay-lowlands.git
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
uv run uvicorn main:app --reload --port 8000

# Run tests
uv run pytest -v

# Lint and format code
uv run ruff check .
uv run ruff format .
```

## Project Structure

```
eccc-hudson-bay-lowlands/
├── api/                    # FastAPI backend (Python 3.12, uv)
│   ├── main.py             # Application entry point
│   ├── config.py           # Configuration settings
│   ├── db/                 # SQLAlchemy engine and base
│   ├── models/             # ORM models (Category, Dataset, Layer, SharedAnalysis)
│   ├── schemas/            # Pydantic request/response schemas
│   ├── routers/            # API route handlers
│   ├── services/           # Business logic (analysis, widgets, zonal stats, seed, cleanup)
│   ├── tests/              # pytest test suite
│   ├── Dockerfile          # Multi-stage Python build
│   └── pyproject.toml      # Python dependencies
├── client/                 # Next.js frontend (Node 24.13, pnpm)
│   ├── src/                # App Router pages, containers, hooks
│   ├── tests/              # Vitest unit and component tests
│   ├── Dockerfile          # Multi-stage Node.js build
│   └── package.json
├── e2e/                    # Playwright end-to-end tests
├── data-processing/        # Data processing utilities and metadata.json
├── infrastructure/         # Terraform AWS infrastructure (Elastic Beanstalk, RDS, ECR)
│   ├── main.tf
│   ├── modules/
│   ├── source_bundle/      # Beanstalk deployment bundle
│   └── vars/
├── docker/                 # PostgreSQL init script
├── docs/                   # ARCHITECTURE, DATABASE, DEPLOYMENT, ADRs
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Local development services
├── .env.example            # Environment template
└── CLAUDE.md               # AI agent context
```

## API Documentation

For detailed API documentation, see [api/README.md](api/README.md).

### Key Endpoints

- `GET /` — API discovery endpoint
- `GET /health` — Health check (includes database connectivity)
- `GET /docs` — Interactive Swagger UI
- `GET /categories`, `GET /categories/{id}` — Category metadata
- `GET /datasets`, `GET /datasets/{id}` — Dataset metadata (with optional nested layers)
- `GET /layers`, `GET /layers/{id}` — Layer metadata
- `GET /cog/info`, `GET /cog/tiles/{z}/{x}/{y}` — COG metadata and map tiles via TiTiler
- `POST /analysis`, `POST /analysis/v2` — Zonal-statistics analysis (v2 enforces HBL containment)
- `POST /analysis/v2/share`, `GET /analysis/v2/share/{id}` — Public share links for analyses
- `GET /hbl-area` — Hudson Bay Lowlands study-area boundary
- `POST /seed` — Authenticated database seeding (requires `X-Seed-Secret` header)

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
