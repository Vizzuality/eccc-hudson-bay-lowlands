"""FastAPI application with enhanced OpenAPI configuration and CORS support."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import cog, health

settings = get_settings()

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
    }
