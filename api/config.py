"""Centralized configuration settings for the API."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # API metadata
    title: str = "ECCC Hudson Bay Lowlands API"
    description: str = "Backend API for Hudson Bay Lowlands geospatial application"
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

    # Database configuration
    database_host: str = "localhost"
    database_port: int = 5432
    database_username: str = "eccc"
    database_password: str = "eccc"
    database_name: str = "eccc_db"

    # Testing mode
    testing: bool = False

    @property
    def database_url(self) -> str:
        """Build PostgreSQL connection string.

        When testing=True, automatically uses eccc_db_test database.
        """
        db_name = "eccc_db_test" if self.testing else self.database_name
        return (
            f"postgresql://{self.database_username}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
