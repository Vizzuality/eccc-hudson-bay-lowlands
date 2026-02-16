# ECCC Hudson Bay Lowlands Client

Next.js frontend application for the Hudson Bay Lowlands geospatial project.

## Prerequisites

- **Node.js**: 24.13.0 (specified in `.nvmrc` at the project root)
- **pnpm**: 10.20.0 (specified in `package.json` `packageManager` field)

```bash
nvm use                # Sets Node.js version from .nvmrc
corepack enable        # Enables pnpm via corepack
```

## Setup

```bash
cd client
pnpm install
```

## Development

```bash
pnpm dev
```

The client starts at http://localhost:3000 with hot module replacement enabled.

## Build

```bash
pnpm build
```

The build uses standalone output mode (configured in `next.config.ts`) for optimized Docker deployments.

## Linting and Formatting

```bash
pnpm lint       # Check code with Biome
pnpm format     # Format code with Biome
```

## Docker

The client Dockerfile (`client/Dockerfile`) uses a multi-stage build:

1. **base**: Node.js 20-alpine with pnpm enabled via corepack
2. **deps**: Installs dependencies from the pnpm workspace with frozen lockfile
3. **builder**: Compiles Next.js with standalone output
4. **runner**: Minimal production image with non-root user (`nextjs`)

Build context is the project root (not `client/`) because the Dockerfile needs workspace-level files (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`).

```bash
# Build via docker-compose (recommended)
docker compose build eccc-client

# Or standalone
docker build -f client/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  --build-arg NEXT_PUBLIC_MAPBOX_API_TOKEN="" \
  -t eccc-client .
```

## Environment Variables

### Build-time (embedded in client bundle)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | API base URL (e.g., `http://localhost:8000`) |
| `NEXT_PUBLIC_MAPBOX_API_TOKEN` | Mapbox GL JS API token |

These are baked into the JavaScript bundle at `next build` time. Changing them requires a rebuild.

### Runtime (server-side only)

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Base URL for NextAuth.js |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js token signing |

## Health Check

The client exposes a health check route at `GET /health` (`src/app/health/route.ts`). This route cascades to the FastAPI `/health` endpoint and returns an aggregated status:

```json
{
  "status": "healthy",
  "services": {
    "client": "healthy",
    "api": "healthy",
    "database": "healthy"
  }
}
```

Returns HTTP 200 when all services are healthy, HTTP 503 when any component is unhealthy.

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | React framework |
| react / react-dom | 19.2.4 | UI library |
| next-intl | 4.7.0 | Internationalization |
| tailwindcss | 4.x | Utility-first CSS |
| lucide-react | 0.562.0 | Icon library |
| class-variance-authority | 0.7.1 | Component variant patterns |
| clsx | 2.1.1 | className utility |
| tailwind-merge | 3.x | Tailwind class merging |

## Project Structure

```
client/
|-- src/
|   +-- app/
|       |-- [locale]/           # Internationalized pages
|       |-- health/
|       |   +-- route.ts        # Health check API route
|       |-- globals.css         # Global styles
|       +-- favicon.ico
|-- public/
|   +-- .gitkeep                # Required for Docker COPY
|-- next.config.ts              # Standalone output, next-intl plugin
|-- package.json
|-- Dockerfile
+-- tsconfig.json
```

## Related Documentation

- [Getting Started](../docs/GETTING_STARTED.md) -- full setup guide
- [Architecture](../docs/ARCHITECTURE.md) -- system overview
- [Environment Variables](../docs/ENVIRONMENT_VARIABLES.md) -- all configuration
