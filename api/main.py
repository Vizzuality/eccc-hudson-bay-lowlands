"""FastAPI application with enhanced OpenAPI configuration and CORS support."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from db.base import Base
from db.database import engine
from models import Category, Dataset, Layer  # noqa: F401  # Import models to register with Base metadata
from routers import categories, cog, datasets, health, layers, seed

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Configure GDAL for optimized S3 COG access
    gdal_env = {
        "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
        "GDAL_HTTP_MERGE_CONSECUTIVE_RANGES": "YES",
        "GDAL_HTTP_MULTIPLEX": "YES",
        "GDAL_HTTP_VERSION": "2",
        "GDAL_CACHEMAX": "200",
        "GDAL_BAND_BLOCK_CACHE": "HASHSET",
        "CPL_VSIL_CURL_CACHE_SIZE": "200000000",
        "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif,.TIF,.tiff",
        "VSI_CACHE": "TRUE",
        "VSI_CACHE_SIZE": "5000000",
        "AWS_REGION": settings.aws_region,
    }
    for key, value in gdal_env.items():
        os.environ.setdefault(key, value)

    # Create database tables on startup.
    # Only drop+recreate in testing mode; production uses create_all only.
    # TODO: Replace with Alembic migrations once the data model is stable.
    if settings.testing:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


# OpenAPI tags metadata for documentation organization
tags_metadata = [
    {
        "name": "Health",
        "description": "Health check endpoints for monitoring service status.",
    },
    {
        "name": "COG",
        "description": "Cloud Optimized GeoTIFF (COG) tile serving endpoints powered by TiTiler.",
    },
    {
        "name": "Layers",
        "description": "Read-only endpoints for geospatial layer metadata.",
    },
    {
        "name": "Categories",
        "description": "Read-only endpoints for category metadata and related datasets.",
    },
    {
        "name": "Datasets",
        "description": "Read-only endpoints for dataset metadata and related layers.",
    },
    {
        "name": "Seed",
        "description": "Database seeding endpoint for populating data from metadata.json.",
    },
]

app = FastAPI(
    title=settings.title,
    description=settings.description,
    version=settings.version,
    contact={
        "name": settings.contact_name,
        "url": settings.contact_url,
        "email": settings.contact_email,
    },
    license_info={
        "name": settings.license_name,
        "url": settings.license_url,
    },
    openapi_tags=tags_metadata,
    lifespan=lifespan,
    root_path=settings.root_path,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Include routers
app.include_router(health.router)
app.include_router(cog.router, prefix="/cog", tags=["COG"])
app.include_router(layers.router, prefix="/layers", tags=["Layers"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(datasets.router, prefix="/datasets", tags=["Datasets"])
app.include_router(seed.router, prefix="/seed", tags=["Seed"])


@app.get(
    "/",
    summary="API Discovery",
    description="Root endpoint providing API information and available endpoints.",
    tags=["Health"],
)
def root():
    """Root endpoint with API information."""
    return {
        "title": settings.title,
        "version": settings.version,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "cog": "/cog",
        "layers": "/layers",
        "categories": "/categories",
        "datasets": "/datasets",
        "seed": "/seed",
    }
