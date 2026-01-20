"""Centralized configuration settings for the API."""

from functools import lru_cache

from pydantic import Field
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
    db_host: str = Field(default="localhost", validation_alias="DB_HOST")
    db_port: int = Field(default=5432, validation_alias="DB_PORT")
    db_username: str = Field(default="eccc", validation_alias="DB_USERNAME")
    db_password: str = Field(default="eccc", validation_alias="DB_PASSWORD")
    db_name: str = Field(default="eccc_db", validation_alias="DB_NAME")

    # S3 configuration
    s3_bucket_name: str = Field(default="", validation_alias="S3_BUCKET_NAME")

    # Root path for reverse proxy (set to "/api" when behind nginx proxy)
    root_path: str = Field(default="", validation_alias="ROOT_PATH")

    # Testing mode
    testing: bool = False

    @property
    def database_url(self) -> str:
        """Build PostgreSQL connection string.

        When testing=True, automatically uses eccc_db_test database.
        """
        db_name = "eccc_db_test" if self.testing else self.db_name
        return f"postgresql://{self.db_username}:{self.db_password}@{self.db_host}:{self.db_port}/{db_name}"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
