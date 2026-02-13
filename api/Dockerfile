# Multi-stage Dockerfile for ECCC Hudson Bay Lowlands API
# Optimized for production with minimal image size

# =============================================================================
# Stage 1: Base image with system dependencies
# =============================================================================
FROM python:3.12-slim AS base

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required by titiler-core (GDAL) and geospatial libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Stage 2: Builder - install dependencies with uv
# =============================================================================
FROM base AS builder

# Install uv using official installer
COPY --from=ghcr.io/astral-sh/uv:0.10.2 /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies with frozen lockfile
RUN uv sync --frozen --no-dev --no-install-project

# =============================================================================
# Stage 3: Runtime - minimal production image
# =============================================================================
FROM base AS runtime

# Create non-root user for security
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Set working directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY --chown=appuser:appgroup . .

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
