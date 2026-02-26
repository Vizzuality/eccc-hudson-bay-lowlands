# Getting Started

A zero-to-running guide for new developers joining the ECCC Hudson Bay Lowlands project.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker | 20.10+ | [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | v2+ | Included with Docker Desktop |
| Node.js | 24.13.0 (see `.nvmrc`) | [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org) |
| pnpm | 10.20.0 | `corepack enable && corepack prepare pnpm@10.20.0 --activate` |
| Python | 3.12 | [python.org](https://www.python.org/downloads/) |
| uv | latest | [docs.astral.sh/uv](https://docs.astral.sh/uv/) |
| AWS CLI | v2 | Only needed for infrastructure work |

## Quick Start (Docker)

The fastest way to get everything running.

### 1. Clone the repository

```bash
git clone https://github.com/eccc-hudson-bay-lowlands/eccc-hudson-bay-lowlands.git
cd eccc-hudson-bay-lowlands
```

### 2. Set up environment

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development.

**For S3 tile serving (optional):**

If you want to test S3-backed COG tile serving locally, update your `.env` with AWS credentials:

```bash
# Required for S3 tile serving
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=eu-north-1

# Option A: Using AWS access keys (for local testing only)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Option B: Using AWS IAM role (recommended for production)
# Omit the access key variables and the API will use the EC2 IAM role
```

If you do not need S3 tile serving for your work, you can leave these blank.

### 3. Start all services

```bash
docker compose up
```

This starts three services:
- **PostgreSQL** on port 5432
- **FastAPI API** on port 8000
- **Next.js Client** on port 3000

### 4. Verify setup

Open these URLs in your browser:

| URL | What you should see |
|-----|-------------------|
| http://localhost:8000/health | `{"status": "healthy", "services": {"api": "healthy", "database": "healthy"}}` |
| http://localhost:8000/docs | Swagger UI with all API endpoints |
| http://localhost:3000 | Next.js client application |

### 5. Stop services

```bash
docker compose down
```

To also clear the database volume:

```bash
docker compose down -v
```

## Local Development (Without Docker)

For faster iteration, run the API and client directly on your machine. You still need PostgreSQL running (either via Docker or installed locally).

### Start PostgreSQL only

```bash
docker compose up eccc-db -d
```

### API setup

```bash
cd api
uv sync
uv run fastapi dev main.py
```

The API starts at http://127.0.0.1:8000 with auto-reload enabled.

### Client setup

```bash
nvm use            # Sets Node.js to version in .nvmrc
cd client
pnpm install
pnpm dev
```

The client starts at http://localhost:3000.

### Seeding the database

The database is seeded via a `POST /seed` endpoint that accepts a JSON payload with the full metadata structure (categories, datasets, layers). The request must include an `X-Seed-Secret` header matching the `SEED_SECRET` environment variable.

**Local development (Docker)**:

```bash
curl -X POST http://localhost:8000/seed \
  -H "Content-Type: application/json" \
  -H "X-Seed-Secret: dev-seed-secret" \
  -d @data-processing/metadata.json
```

**Local development (without Docker)**:

You can also use the standalone CLI script:

```bash
cd api
SEED_SECRET=dev-seed-secret uv run python seed.py
```

This reads `data-processing/metadata.json` and sends it to the running API.

**Production**:

```bash
curl -X POST https://your-domain.com/api/seed \
  -H "Content-Type: application/json" \
  -H "X-Seed-Secret: $SEED_SECRET" \
  -d @data-processing/metadata.json
```

The seed is idempotent: running it multiple times updates existing records rather than creating duplicates.

### Running API tests

```bash
cd api
uv run pytest -v
```

Tests use a separate database (`eccc_db_test`) created by the init script.

### Linting

```bash
# API
cd api
uv run ruff check .
uv run ruff format .

# Client
cd client
pnpm lint
pnpm format
```

## Common Issues

### Port already in use

If port 5432, 8000, or 3000 is already occupied, stop the conflicting service or change the port mapping in `docker-compose.yml`.

### Database connection refused

If the API cannot connect to PostgreSQL:
- Ensure the database container is healthy: `docker compose ps`
- When running locally (not in Docker), set `DB_HOST=localhost` in your `.env`
- When running via Docker Compose, `DB_HOST` should be `eccc-db` (handled automatically by the compose file)

### GDAL dependency errors (local development)

The API depends on `titiler-core`, which requires GDAL system libraries:

```bash
# macOS
brew install gdal

# Ubuntu/Debian
sudo apt-get install libgdal-dev
```

### Docker build fails after code changes

Rebuild the images:

```bash
docker compose up --build
```

### Need a fresh database

Clear volumes and restart:

```bash
docker compose down -v
docker compose up
```

## Next Steps

- [Architecture](ARCHITECTURE.md) -- understand how the system fits together
- [Environment Variables](ENVIRONMENT_VARIABLES.md) -- all configurable settings
- [Database](DATABASE.md) -- schema reference
- [Deployment](DEPLOYMENT.md) -- how code gets to production
- [API docs](../api/README.md) -- API-specific development guide
- [Client docs](../client/README.md) -- client-specific development guide
- [Infrastructure docs](../infrastructure/README.md) -- Terraform modules and AWS setup
