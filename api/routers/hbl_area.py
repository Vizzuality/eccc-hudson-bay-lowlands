"""Hudson Bay Lowlands study-area endpoint router.

Serves the same GeoJSON file that backs the ``POST /analysis`` containment
check, so the client renders the exact polygon the server validates against.
Loaded once at module import; failures (missing file, malformed GeoJSON,
unsupported geometry type) raise at startup rather than on first request.
"""

import json
import logging
from pathlib import Path

from fastapi import APIRouter
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

from config import get_settings
from schemas.hbl_area import HBLAreaResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["HBL Area"])


def _load_hbl_area_feature() -> HBLAreaResponse:
    """Read the configured HBL GeoJSON file and return a normalised Feature.

    The on-disk file may be a Feature or a FeatureCollection. A FeatureCollection
    with multiple features is collapsed into a single Feature whose geometry is
    the unary union of the inputs (so the response shape is stable regardless
    of how the file is authored). Per-feature properties are preserved only
    when the file is a single Feature; for unioned collections the response
    carries the FeatureCollection-level properties, if any.

    The returned object is validated by the ``HBLAreaResponse`` schema, so a
    malformed file fails loudly at startup.
    """
    raw_path = Path(get_settings().hbl_shape_path)
    path = raw_path if raw_path.is_absolute() else Path(__file__).resolve().parent.parent / raw_path
    if not path.is_file():
        raise RuntimeError(f"HBL shape file not found at {path}")

    with path.open() as f:
        gj = json.load(f)

    gj_type = gj.get("type")
    if gj_type == "Feature":
        feature_dict = gj
    elif gj_type == "FeatureCollection":
        features = gj.get("features") or []
        if not features:
            raise RuntimeError(f"HBL FeatureCollection at {path} contains no features")
        if len(features) == 1:
            feature_dict = features[0]
        else:
            unioned = unary_union([shape(f["geometry"]) for f in features])
            feature_dict = {
                "type": "Feature",
                "geometry": mapping(unioned),
                "properties": gj.get("properties"),
            }
    else:
        raise RuntimeError(
            f"HBL file at {path} must be a Feature or FeatureCollection (got type='{gj_type}')"
        )

    feature = HBLAreaResponse.model_validate(feature_dict)
    logger.info(
        "Loaded HBL area Feature from %s (geometry=%s)",
        path,
        feature.geometry.type,
    )
    return feature


# Loaded once at import. Same lifecycle as services.analysis.HBL_SHAPE.
_HBL_AREA_FEATURE: HBLAreaResponse = _load_hbl_area_feature()


@router.get(
    "",
    summary="Hudson Bay Lowlands study-area boundary",
    description=(
        "Returns the Hudson Bay Lowlands study-area boundary as a GeoJSON "
        "Feature in EPSG:4326 (lon/lat degrees, RFC 7946 §4). The geometry "
        "is either a Polygon (single region) or a MultiPolygon (disjoint "
        "regions).\n\n"
        "This is the same boundary used to validate analysis inputs: any "
        "polygon submitted to `POST /analysis` must lie entirely within this "
        "shape. Clients are expected to render this feature as the highlight "
        "the user draws inside.\n\n"
        "The response is cached in memory at server start, so it is safe to "
        "fetch on every map load."
    ),
    response_model=HBLAreaResponse,
    responses={
        200: {"description": "GeoJSON Feature describing the HBL study area"},
    },
)
def get_hbl_area() -> HBLAreaResponse:
    """Return the cached HBL study-area Feature."""
    return _HBL_AREA_FEATURE
