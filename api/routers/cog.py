"""COG (Cloud Optimized GeoTIFF) tile server router."""

from titiler.core.factory import TilerFactory

# Create the COG tiler factory with proper tags for OpenAPI documentation
cog_tiler = TilerFactory(router_prefix="/cog")

# The router to be included in the main app
router = cog_tiler.router
