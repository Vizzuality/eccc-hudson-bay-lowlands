"""Centralized configuration settings for the API."""

from functools import lru_cache


class Settings:
    """Application settings."""

    # API metadata
    title: str = "ECCC Hudson Bay Lowlands Tile Server"
    description: str = "COG tile server for Hudson Bay Lowlands imagery"
    version: str = "0.1.0"

    # Contact information
    contact_name: str = "ECCC Hudson Bay Lowlands Team"
    contact_url: str = "https://github.com/eccc-hudson-bay-lowlands"
    contact_email: str = "contact@example.com"

    # License
    license_name: str = "MIT"
    license_url: str = "https://opensource.org/licenses/MIT"

    # CORS settings
    cors_origins: list[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
