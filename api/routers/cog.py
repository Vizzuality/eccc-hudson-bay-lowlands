"""COG (Cloud Optimized GeoTIFF) tile server router."""

from fastapi import Query
from titiler.core.factory import TilerFactory

from config import get_settings


def s3_url_dependency(
    url: str = Query(description="Relative path to the COG file (S3 object key)"),
) -> str:
    """Build full S3 URI from relative path and configured bucket name.

    Strips leading slashes and prepends the S3 bucket prefix to construct
    a valid S3 object URI for GDAL/TiTiler consumption.

    Args:
        url: Relative path to the COG file (e.g., "data/processed/peat_cog.tif")

    Returns:
        Full S3 URI (e.g., "s3://bucket-name/data/processed/peat_cog.tif")
    """
    settings = get_settings()
    key = url.lstrip("/")
    return f"s3://{settings.s3_bucket_name}/{key}"


cog_tiler = TilerFactory(
    path_dependency=s3_url_dependency,
    router_prefix="/cog",
)

router = cog_tiler.router
