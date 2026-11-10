"""GBIF SQL cube download and ISEA3H hexagon generation for the Hudson Bay Lowlands (HJBL).

Sections:
1. GBIF query: footprint polygons, filters and the SQL builder.
2. GBIF API: request, wait for and download an SQL cube.
3. ISEA3H grid: decode cell codes and rebuild the hexagons (Snyder equal-area projection
   on an icosahedron, a Python port of the ''geogrid'' library).
4. Cube to hexagon layer: read the CSV, aggregate per hexagon, filter with the footprint
   and save a GeoJSON.

Sections 3 and 4 only need the cube CSV, so they also work with a file downloaded by hand
from gbif.org instead of through the API (section 2).
"""

import io
import json
import logging
import math
import os
import re
import time
import zipfile
from pathlib import Path
from typing import List, NamedTuple, Optional, Sequence, Tuple

import geopandas as gpd
import pandas as pd
import requests
import shapely

LOGGER = logging.getLogger(__name__)

REQUIRED_COLUMNS = ("isea3hcellcode", "species", "specieskey", "occurrences")
KINGDOMS = ("animalia", "bacillati", "chromista", "fungi", "plantae")

# ________________________________________________________________________________
# 1. GBIF QUERY
# ________________________________________________________________________________
# The query is built from the filters below. The three polygons are the footprint with a 0.1° buffer 
# towards the coast, split in three because GBIF does not accept that many vertices in one geometry 
# (main body, Akimiski Island and the offshore islands). They are the exact polygons of the original download, 
# so they are kept as constants. `build_sql()` adds a bounding-box prefilter to each one, which speeds up `GBIF_WITHIN`.
# Coordinates are "lon lat" pairs, counter-clockwise, closed, with 3 decimals (GBIF requirements).

MAIN_BODY = """
-95.862 58.756, -95.9 58.538, -95.681 58.343, -95.123 58.076, -94.836 57.839, -94.42 57.482,
-94.287 57.255, -94.389 57.152, -94.431 56.928, -94.645 56.777, -94.9 56.696, -94.914 56.551,
-94.674 56.469, -94.701 56.362, -94.63 56.279, -94.366 56.268, -94.073 56.152, -94.056 56.019,
-93.784 55.809, -93.014 55.854, -92.948 55.841, -92.902 55.703, -92.679 55.695, -92.767 55.577,
-92.692 55.447, -93.007 55.453, -93.137 55.36, -93.121 55.256, -92.908 55.075, -92.673 55.021,
-92.5 55.087, -92.464 54.985, -92.33 54.96, -92.184 54.81, -91.898 54.786, -91.744 54.867,
-91.41 54.818, -91.038 54.892, -90.842 54.75, -90.173 54.577, -89.679 54.647, -89.465 54.608,
-89.321 54.542, -89.311 54.38, -89.198 54.255, -88.914 54.218, -88.79 54.07, -88.006 53.836,
-87.832 53.665, -87.459 53.507, -87.059 53.162, -87.014 52.929, -86.833 52.916, -86.844 52.682,
-86.741 52.551, -86.803 52.383, -86.733 52.115, -86.656 52.038, -86.536 52.047, -86.441 51.879,
-86.484 51.782, -86.448 51.624, -86.572 51.553, -86.577 51.437, -86.299 51.254, -86.226 51.064,
-85.945 50.794, -86.06 50.367, -85.682 50.147, -85.416 50.131, -85.311 50.033, -84.893 50.037,
-84.617 50.172, -84.438 49.952, -84.049 50.001, -83.187 49.939, -82.98 49.985, -82.811 49.932,
-82.703 50.004, -82.236 50.06, -81.688 50.046, -81.209 50.294, -80.747 50.279, -80.627 50.174,
-80.218 50.384, -79.762 50.296, -79.576 50.024, -79.42 50.05, -79.107 49.981, -78.976 50.097,
-78.915 50.372, -78.673 50.46, -78.469 50.458, -78.241 50.598, -77.969 50.584, -77.936 50.73,
-77.754 50.878, -77.713 51.072, -77.42 51.058, -77.052 51.159, -77.046 51.302, -77.313 51.448,
-76.376 51.665, -76.001 51.895, -75.959 51.984, -76.004 52.082, -75.844 52.144, -75.768 52.251,
-75.839 52.466, -75.744 52.604, -75.865 52.699, -75.638 52.699, -75.562 52.767, -75.606 52.892,
-75.9 52.988, -76.478 52.825, -76.74 52.918, -76.851 52.816, -77.116 52.757, -77.172 52.856,
-77.403 52.973, -78.014 52.764, -78.291 52.944, -78.651 52.871, -78.767 52.71, -78.55 52.385,
-78.647 52.336, -78.664 52.182, -79.128 51.812, -79.131 51.717, -79.029 51.608, -79.124 51.631,
-79.186 51.737, -79.391 51.751, -79.813 51.415, -79.849 51.259, -80.084 51.386, -80.332 51.425,
-80.48 51.754, -80.594 51.868, -81.001 52.134, -81.317 52.204, -81.464 52.516, -82.175 53.02,
-82.154 53.121, -82.004 53.247, -82.104 53.595, -82.014 53.775, -82.104 54.038, -82.328 54.269,
-82.093 54.792, -82.157 55.146, -82.269 55.236, -82.796 55.228, -82.954 55.32, -83.33 55.3,
-83.88 55.394, -84.545 55.335, -85.035 55.373, -85.866 55.756, -87.374 56.095, -87.562 56.182,
-87.926 56.558, -88.564 56.77, -88.826 56.958, -89.922 57.103, -90.614 57.336, -91.135 57.352,
-91.982 57.154, -92.38 57.158, -92.324 57.331, -92.372 57.508, -92.613 57.81, -92.781 58.22,
-93.009 58.517, -93.083 58.781, -93.22 58.877, -94.209 58.91, -94.373 58.825, -94.526 59.016,
-94.703 59.116, -94.807 59.11, -94.914 58.984, -94.953 59.086, -95.076 59.114, -95.366 58.991,
-95.457 58.813, -95.862 58.756
"""
AKIMISKI = """
-82.023 53.192, -82.15 53.018, -82.112 52.928, -81.976 52.864, -81.069 52.65, -80.679 52.6,
-80.573 52.718, -80.746 53.073, -81.093 53.295, -81.884 53.263, -82.023 53.192
"""
ISLANDS = """
-79.081 51.541, -79.08 51.541, -79.067 51.541, -79.057 51.542, -79.056 51.542, -79.046 51.545,
-79.037 51.548, -79.026 51.552, -79.016 51.556, -79.007 51.561, -79.006 51.561, -78.998 51.566,
-78.994 51.569, -78.993 51.569, -78.99 51.572, -78.989 51.572, -78.988 51.573, -78.985 51.576,
-78.98 51.58, -78.974 51.587, -78.968 51.594, -78.962 51.602, -78.738 52.005, -78.733 52.014,
-78.73 52.024, -78.727 52.034, -78.726 52.044, -78.725 52.054, -78.725 52.055, -78.725 52.064,
-78.727 52.074, -78.803 52.414, -79.152 53.543, -79.155 53.552, -79.159 53.561, -79.164 53.57,
-79.17 53.578, -79.177 53.585, -79.184 53.592, -79.192 53.598, -79.814 53.981, -79.815 53.981,
-79.818 53.983, -79.827 53.987, -79.836 53.991, -79.845 53.993, -79.888 54.003, -79.898 54.005,
-79.908 54.005, -79.918 54.005, -79.928 54.004, -79.937 54.002, -79.947 53.998, -82.191 53.212,
-82.201 53.208, -82.21 53.204, -82.218 53.199, -82.226 53.193, -82.233 53.187, -82.24 53.179,
-82.246 53.171, -82.247 53.17, -82.248 53.168, -82.253 53.16, -82.257 53.152, -82.26 53.143,
-82.263 53.134, -82.264 53.124, -82.265 53.115, -82.265 53.114, -82.265 53.111, -82.265 53.109,
-82.265 53.099, -82.263 53.09, -82.261 53.08, -82.257 53.071, -82.253 53.062, -82.248 53.054,
-82.242 53.046, -82.236 53.038, -82.228 53.032, -82.221 53.026, -82.212 53.021, -79.93 51.765,
-79.921 51.76, -79.912 51.756, -79.902 51.753, -79.106 51.545, -79.105 51.544, -79.091 51.542,
-79.09 51.542, -79.081 51.541
"""


def _wkt(*rings: str) -> str:
    """Build a WKT polygon from one or more rings written as 'lon lat, lon lat, ...' text."""
    cleaned = []
    for ring in rings:
        pairs = [p.strip() for p in ring.replace("\n", " ").split(",") if p.strip()]
        cleaned.append("(" + ", ".join(pairs) + ")")
    return "POLYGON (" + ", ".join(cleaned) + ")"


POLYGONS_WKT = (_wkt(ISLANDS), _wkt(AKIMISKI), _wkt(MAIN_BODY))

BASIS_OF_RECORD = ("OBSERVATION", "MACHINE_OBSERVATION", "HUMAN_OBSERVATION", "MATERIAL_SAMPLE",
                   "MATERIAL_CITATION", "PRESERVED_SPECIMEN", "LIVING_SPECIMEN", "OCCURRENCE")

EXCLUDED_ISSUES = (
    "COORDINATE_ROUNDED", "GEODETIC_DATUM_INVALID", "COORDINATE_REPROJECTION_SUSPICIOUS",
    "COORDINATE_PRECISION_INVALID", "COORDINATE_UNCERTAINTY_METERS_INVALID",
    "PRESUMED_SWAPPED_COORDINATE", "PRESUMED_NEGATED_LONGITUDE", "PRESUMED_NEGATED_LATITUDE",
    "COUNTRY_COORDINATE_MISMATCH", "FOOTPRINT_SRS_INVALID", "CONTINENT_COORDINATE_MISMATCH",
    "COUNTRY_INVALID", "COUNTRY_MISMATCH", "RECORDED_DATE_INVALID", "RECORDED_DATE_UNLIKELY",
    "RECORDED_DATE_MISMATCH", "OCCURRENCE_STATUS_UNPARSABLE",
    "INDIVIDUAL_COUNT_CONFLICTS_WITH_OCCURRENCE_STATUS", "BASIS_OF_RECORD_INVALID", "SUSPECTED_TYPE",
)
MAX_UNCERTAINTY_M = 1000          # keep records with coordinate uncertainty between 0 and this value
MIN_CENTROID_DISTANCE_M = 2000.0  # drop records closer than this to a country/province centroid
RANKS = ("kingdom", "phylum", "class", "order", "family", "genus", "species")
YEARMONTH = "PRINTF('%04d-%02d', \"year\", \"month\")"

def _bbox(wkt: str) -> Tuple[float, float, float, float]:
    """Return (lat_min, lat_max, lon_min, lon_max) of a WKT polygon."""
    nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", wkt)]
    lons, lats = nums[0::2], nums[1::2]
    return min(lats), max(lats), min(lons), max(lons)


def _geometry_clause(polygons_wkt: Sequence[str]) -> str:
    parts = []
    for wkt in polygons_wkt:
        lat_min, lat_max, lon_min, lon_max = _bbox(wkt)
        parts.append(
            f"occurrence.decimallatitude >= {lat_min!r} AND occurrence.decimallatitude <= {lat_max!r} "
            f"AND (occurrence.decimallongitude >= {lon_min!r} AND occurrence.decimallongitude <= {lon_max!r}) "
            f"AND GBIF_WITHIN('{wkt}', occurrence.decimallatitude, occurrence.decimallongitude) = TRUE"
        )
    return "(" + " OR ".join(parts) + ")"


def build_sql(level: int, polygons_wkt: Sequence[str] = POLYGONS_WKT) -> str:
    """SQL cube: one row per species x ISEA3H cell x year-month, with record and genus counts."""
    cell = f"GBIF_ISEA3HCODE({level}, decimallatitude, decimallongitude, 0.0)"   # 0.0 = no uncertainty randomisation

    plain_cols, select_cols = [], []
    for rank in RANKS:
        name = f'"{rank}"' if rank == "order" else rank        # "order" is a reserved word
        plain_cols += [f"occurrence.{name}", f"occurrence.{rank}key"]
        select_cols += [f"occurrence.{name} {name}", f"occurrence.{rank}key {rank}key"]
    select_cols += [
        f"{YEARMONTH} yearmonth",
        f"{cell} isea3hcellcode",
        f"SUM(COUNT(*)) OVER (PARTITION BY occurrence.genuskey, {cell}, {YEARMONTH}) genuscount",
        "COUNT(*) occurrences",
        "MIN(COALESCE(coordinateuncertaintyinmeters, 1000)) mincoordinateuncertaintyinmeters",
    ]

    issues = " OR ".join(f"GBIF_STRINGARRAYCONTAINS(occurrence.issue, '{i}', TRUE)" for i in EXCLUDED_ISSUES)
    basis = ", ".join(f"'{b}'" for b in BASIS_OF_RECORD)
    conditions = [
        "occurrence.occurrencestatus IN ('PRESENT')",
        "occurrence.countrycode IN ('CA')",
        f"occurrence.basisofrecord IN ({basis})",
        _geometry_clause(polygons_wkt),
        "occurrence.hascoordinate IN (TRUE)",
        "occurrence.hasgeospatialissues IN (FALSE)",
        f"(occurrence.coordinateuncertaintyinmeters >= 0 AND occurrence.coordinateuncertaintyinmeters <= {MAX_UNCERTAINTY_M})",
        f"NOT ({issues})",
        "NOT GBIF_STRINGARRAYCONTAINS(occurrence.taxonomicissue, 'TAXON_MATCH_FUZZY', TRUE)",
        f"(occurrence.distancefromcentroidinmeters >= {MIN_CENTROID_DISTANCE_M} OR occurrence.distancefromcentroidinmeters IS NULL)",
        "(occurrence.specieskey IS NOT NULL AND occurrence.\"year\" IS NOT NULL "
        "AND occurrence.\"month\" IS NOT NULL AND occurrence.hascoordinate = TRUE)",
    ]
    return (
        "SELECT\n  " + ",\n  ".join(select_cols)
        + "\nFROM\n  occurrence\nWHERE\n  " + "\n  AND ".join(conditions)
        + "\nGROUP BY\n  " + ",\n  ".join(plain_cols + [YEARMONTH, cell])
    )


# ________________________________________________________________________________
# 2. GBIF API: REQUEST, WAIT AND DOWNLOAD
# ________________________________________________________________________________
# Authentication is plain HTTP basic auth with your GBIF user name and password (read from `.env`), 
# so there is no token to create. Downloading a finished file does not need credentials.

GBIF_API = "https://api.gbif.org/v1"


def gbif_credentials() -> Tuple[str, str, str]:
    """Read GBIF_USER, GBIF_PWD and GBIF_EMAIL from the environment (never printed)."""
    try:
        return os.environ["GBIF_USER"], os.environ["GBIF_PWD"], os.environ["GBIF_EMAIL"]
    except KeyError as missing:
        raise RuntimeError(f"Missing environment variable {missing}. Add it to data-processing/.env") from None


def request_download(sql: str, validate: bool = True) -> str:
    """Submit the SQL download and return its key. If ``validate``, GBIF checks the SQL first."""
    user, pwd, email = gbif_credentials()
    body = {"sendNotification": True, "notificationAddresses": [email], "format": "SQL_TSV_ZIP", "sql": sql}
    if validate:
        check = requests.post(f"{GBIF_API}/occurrence/download/request/validate",
                              auth=(user, pwd), json=body, timeout=60)
        if not check.ok:
            raise RuntimeError(f"GBIF rejected the query ({check.status_code}): {check.text[:500]}")
        LOGGER.info("GBIF validated the query")
    response = requests.post(f"{GBIF_API}/occurrence/download/request", auth=(user, pwd), json=body, timeout=60)
    if not response.ok:
        raise RuntimeError(f"GBIF did not accept the download request ({response.status_code}): {response.text[:500]}")
    key = response.text.strip().strip('"')
    LOGGER.info("Download requested: https://www.gbif.org/occurrence/download/%s", key)
    LOGGER.info("To reuse it in later runs set DOWNLOAD_KEY = \"%s\" in the settings", key)
    return key


def wait_for_download(key: str, poll_seconds: int = 30, max_hours: float = 6) -> dict:
    """Poll the download status until it succeeds. Returns the download metadata."""
    deadline = time.time() + max_hours * 3600
    last_status = None
    while True:
        meta = requests.get(f"{GBIF_API}/occurrence/download/{key}", timeout=60).json()
        status = meta.get("status")
        if status != last_status:
            LOGGER.info("Download %s: %s", key, status)
            last_status = status
        if status == "SUCCEEDED":
            return meta
        if status in ("FAILED", "KILLED", "CANCELLED"):
            raise RuntimeError(f"GBIF download {key} ended with status {status}")
        if time.time() > deadline:
            raise TimeoutError(f"GBIF download {key} still {status} after {max_hours} hours")
        time.sleep(poll_seconds)


def _find_cube_file(folder: Path) -> Optional[Path]:
    files = sorted(list(folder.glob("*.csv")) + list(folder.glob("*.tsv")))
    return files[0] if files else None


def download_cube(key: str, raw_dir: Path, poll_seconds: int = 30) -> Path:
    """Download and unzip the cube into raw_dir/<key>/ (skipped if already there). Returns the CSV path."""
    folder = raw_dir / key
    existing = _find_cube_file(folder) if folder.exists() else None
    if existing:
        LOGGER.info("Already downloaded: %s", existing)
        return existing

    meta = wait_for_download(key, poll_seconds)
    zipped = requests.get(f"{GBIF_API}/occurrence/download/request/{key}.zip", timeout=300)
    zipped.raise_for_status()
    folder.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zipped.content)) as zf:
        zf.extractall(folder)
    (folder / "metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    created = pd.Timestamp(meta["created"]).strftime("%d %B %Y") if meta.get("created") else "date unknown"
    LOGGER.info("Citation: GBIF.org (%s) GBIF Occurrence Download https://doi.org/%s", created, meta.get("doi", "<no DOI>"))
    cube = _find_cube_file(folder)
    if cube is None:
        raise FileNotFoundError(f"No CSV found inside the download {key} ({folder})")
    return cube


# ________________________________________________________________________________
# 3. ISEA3H GRID: DECODE CELL CODES AND BUILD HEXAGONS
# ________________________________________________________________________________

GOLDEN_RATIO = (1 + math.sqrt(5)) / 2

# Radius of the WGS84 authalic sphere (sphere with the same surface area as the
# ellipsoid), in kilometres.
AUTHALIC_RADIUS_KM = 6371.0071809184728409

# R' / R: radius ratio of the sphere used by the projection (Snyder, 1992).
RADIUS_RATIO = (1 / (2 * math.sqrt(5)) + 1 / 6.0) * math.sqrt(math.pi * math.sqrt(3))
R_PRIME = RADIUS_RATIO * AUTHALIC_RADIUS_KM     # R', in km

_DEG = math.pi / 180.0                          # degrees -> radians


# --- trigonometry in degrees (the whole projection is formulated in degrees) --
def _sin(x: float) -> float:
    return math.sin(x * _DEG)


def _cos(x: float) -> float:
    return math.cos(x * _DEG)


def _tan(x: float) -> float:
    return math.tan(x * _DEG)


def _cot(x: float) -> float:
    return 1.0 / _tan(x)


def _asin(x: float) -> float:
    return math.asin(x) / _DEG


def _acos(x: float) -> float:
    return math.acos(x) / _DEG


def _atan(x: float) -> float:
    return math.atan(x) / _DEG


def _atan2(y: float, x: float) -> float:
    return math.atan2(y, x) / _DEG


# --- icosahedron geometry -------------------------------------
# F: latitude of the centres of the faces in the mid-latitude rings.
LAT_F = _atan(1 / (2 * GOLDEN_RATIO ** 2))
# g: spherical distance from the centre of a face to any of its vertices.
ANGLE_G = LAT_F + 2 * _atan(GOLDEN_RATIO) - 90
# E: latitude of the centres of the five polar-cap faces (northern hemisphere).
LAT_E = 90 - ANGLE_G
# Half the length of a triangle base on the icosahedron plane (km).
HALF_TRIANGLE_BASE = R_PRIME * _tan(ANGLE_G) * math.sqrt(3) / 2
# Length of the base of an icosahedron triangle (l0), in km; sets the grid scale.
TRIANGLE_BASE = 2 * HALF_TRIANGLE_BASE

ANGLE_THETA = 30                                # theta
ANGLE_BIG_G = 36                                # G
AZIMUTH_MAX = 2 * (90 - ANGLE_THETA)            # azimuth range covered by one face (120 deg)
TAN_G = _tan(ANGLE_G)
COS_BIG_G = _cos(ANGLE_BIG_G)
COT_THETA = _cot(ANGLE_THETA)
PI_R2_OVER_180 = math.pi * AUTHALIC_RADIUS_KM ** 2 / 180
R_TAN_G = R_PRIME * TAN_G
R_TAN_G_SQUARED = R_TAN_G ** 2
SIN_BIG_G_COS_G = _sin(ANGLE_BIG_G) * _cos(ANGLE_G)
BIG_G_MINUS_180 = ANGLE_BIG_G - 180.0
LAT_E_MINUS_F = LAT_E - LAT_F

# Centre (latitude, longitude) of each of the 20 faces.
LON_STEP = 36                                   # half the longitude gap between adjacent faces
FACE_LAT = [LAT_E] * 5 + [LAT_F] * 5 + [-LAT_F] * 5 + [-LAT_E] * 5
FACE_LON = [
    -4 * LON_STEP, -2 * LON_STEP, 0, 2 * LON_STEP, 4 * LON_STEP,
    -4 * LON_STEP, -2 * LON_STEP, 0, 2 * LON_STEP, 4 * LON_STEP,
    -3 * LON_STEP, -LON_STEP, LON_STEP, 3 * LON_STEP, 5 * LON_STEP,
    -3 * LON_STEP, -LON_STEP, LON_STEP, 3 * LON_STEP, 5 * LON_STEP,
]

# Orientation of the icosahedron relative to the sphere. GBIF uses the
# "symmetric equator" orientation: the poles map to edge midpoints.
ORIENTATION_LAT = (LAT_E + LAT_F) / 2.0
ORIENTATION_LON = -11.25

POLE_TOLERANCE_DEG = 1e-5                       # latitudes closer to a pole than this are "at the pole"
NEWTON_TOLERANCE = 1e-9                         # convergence threshold of the inverse projection
FACE_MEMBERSHIP_TOLERANCE = 1e-9                # tolerance when testing if a point lies on a face


class FacePoint(NamedTuple):
    """A point on the icosahedron: face index (0-19) and planar coordinates in km."""

    face: int
    x: float
    y: float


class CellCentre(NamedTuple):
    """Decoded GBIF cell code: resolution level and centre of the hexagon."""

    level: int
    lat: float
    lon: float


def _is_upright(face: int) -> bool:
    """Return True if the triangular face points up, False if it is upside down."""
    return face <= 4 or 10 <= face <= 14


def _change_orientation(lat: float, lon: float) -> Tuple[float, float]:
    """Rotate geographic coordinates into the icosahedron's reference frame."""
    sin_o, cos_o = _sin(ORIENTATION_LAT), _cos(ORIENTATION_LAT)
    sin_lat, cos_lat = _sin(lat), _cos(lat)
    shifted_lon = lon + ORIENTATION_LON
    sin_lon, cos_lon = _sin(shifted_lon), _cos(shifted_lon)
    new_lat = _asin(sin_lat * cos_o + cos_lon * cos_lat * sin_o)
    new_lon = _atan2(sin_lon * cos_lat, cos_lon * cos_lat * cos_o - sin_lat * sin_o)
    return new_lat, new_lon


def _revert_orientation(lat: float, lon: float) -> Tuple[float, float]:
    """Inverse of :func:`_change_orientation`."""
    if lat < -90 + POLE_TOLERANCE_DEG or lat > 90 - POLE_TOLERANCE_DEG:
        lon = 0.0                               # longitude is undefined at the poles
    sin_o, cos_o = _sin(-ORIENTATION_LAT), _cos(ORIENTATION_LAT)
    sin_lat, cos_lat = _sin(lat), _cos(lat)
    sin_lon, cos_lon = _sin(lon), _cos(lon)
    new_lat = _asin(sin_lat * cos_o + cos_lon * cos_lat * sin_o)
    new_lon = _atan2(sin_lon * cos_lat, cos_lon * cos_lat * cos_o - sin_lat * sin_o)
    return new_lat, new_lon - ORIENTATION_LON


def _candidate_faces(lat: float, lon: float) -> List[int]:
    """Faces to try for a point, most likely first, followed by all 20 as fallback."""
    if lat > LAT_E_MINUS_F:                     # northern cap
        bins = [(-108, (0, 5)), (-36, (1, 6)), (36, (2, 7)), (108, (3, 8))]
        likely = next((f for limit, f in bins if lon < limit), (4, 9))
    elif lat < -LAT_E_MINUS_F:                  # southern cap
        bins = [(-144, (19, 14)), (-72, (15, 10)), (0, (16, 11)), (72, (17, 12)), (144, (18, 13))]
        likely = next((f for limit, f in bins if lon < limit), (19, 14))
    else:                                       # equatorial belt
        bins = [(-144, (5, 14)), (-108, (5, 10)), (-72, (6, 10)), (-36, (6, 11)), (0, (7, 11)),
                (36, (7, 12)), (72, (8, 12)), (108, (8, 13)), (144, (9, 13))]
        likely = next((f for limit, f in bins if lon < limit), (9, 14))
    return list(likely) + list(range(20))


def _snyder_h(sin_az: float, cos_az: float) -> float:
    """Spherical angle H (Snyder, 1992)."""
    return _acos(sin_az * SIN_BIG_G_COS_G - cos_az * COS_BIG_G)


def _scale_factor(sin_az: float, cos_az: float, sin_az_sphere: float, cos_az_sphere: float) -> float:
    """Radial scale factor f relating spherical and planar distances from the face centre."""
    d_plane = R_TAN_G / (cos_az + sin_az * COT_THETA)
    q = _atan2(TAN_G, cos_az_sphere + sin_az_sphere * COT_THETA)
    return d_plane / (2 * R_PRIME * _sin(q / 2))


def _normalise_azimuth(azimuth: float, adjustment: float) -> Tuple[float, float]:
    """Wrap an azimuth into [0, AZIMUTH_MAX] and track the accumulated adjustment."""
    while azimuth < 0:
        adjustment += AZIMUTH_MAX
        azimuth += AZIMUTH_MAX
    while azimuth > AZIMUTH_MAX:
        adjustment -= AZIMUTH_MAX
        azimuth -= AZIMUTH_MAX
    return azimuth, adjustment


def sphere_to_face(lat: float, lon: float) -> FacePoint:
    """Project geographic coordinates (degrees) onto the icosahedron.

    Args:
        lat: Latitude in degrees.
        lon: Longitude in degrees.

    Returns:
        The face index and the planar (x, y) coordinates in km on that face.

    Raises:
        ValueError: If no face contains the point (should not happen).
    """
    lat, lon = _change_orientation(lat, lon)
    sin_lat, cos_lat = _sin(lat), _cos(lat)
    for face in _candidate_faces(lat, lon):
        lat0, lon0 = FACE_LAT[face], FACE_LON[face]
        sin_lat0, cos_lat0 = _sin(lat0), _cos(lat0)
        sin_dlon, cos_dlon = _sin(lon - lon0), _cos(lon - lon0)

        # Azimuth of the point seen from the face centre, wrapped into the face's sector.
        az_sphere = _atan2(cos_lat * sin_dlon, cos_lat0 * sin_lat - sin_lat0 * cos_lat * cos_dlon)
        adjustment = 0 if _is_upright(face) else 180
        az_sphere, adjustment = _normalise_azimuth(az_sphere + adjustment, adjustment)
        sin_az_s, cos_az_s = _sin(az_sphere), _cos(az_sphere)

        # Spherical distance from the face centre; skip faces that do not contain the point.
        z = _acos(max(-1.0, min(1.0, sin_lat0 * sin_lat + cos_lat0 * cos_lat * cos_dlon)))
        q = _atan2(TAN_G, cos_az_s + sin_az_s * COT_THETA)
        if z > q + FACE_MEMBERSHIP_TOLERANCE:
            continue

        # Equal-area mapping: preserve the area of the spherical triangle.
        h = _snyder_h(sin_az_s, cos_az_s)
        area = (az_sphere + BIG_G_MINUS_180 + h) * PI_R2_OVER_180
        az_plane = _atan2(2 * area, R_TAN_G_SQUARED - area * 2 * COT_THETA)
        sin_az_p, cos_az_p = _sin(az_plane), _cos(az_plane)
        f = _scale_factor(sin_az_p, cos_az_p, sin_az_s, cos_az_s)
        rho = 2 * R_PRIME * f * _sin(z / 2.0)
        az_plane -= adjustment
        return FacePoint(face, rho * _sin(az_plane), rho * _cos(az_plane))
    raise ValueError(f"No icosahedron face found for lat={lat}, lon={lon}")


def face_to_sphere(face: int, x: float, y: float) -> Tuple[float, float]:
    """Inverse projection: planar face coordinates (km) to (lat, lon) in degrees.

    The spherical azimuth has no closed-form inverse, so it is found with
    Newton's method.
    """
    az_plane = _atan2(x, y)
    rho = math.hypot(x, y)
    adjustment = 0 if _is_upright(face) else 180
    az_plane, adjustment = _normalise_azimuth(az_plane + adjustment, adjustment)
    sin_az_p, cos_az_p = _sin(az_plane), _cos(az_plane)

    area = R_TAN_G_SQUARED / (2 * (cos_az_p / sin_az_p + COT_THETA))
    target = area / PI_R2_OVER_180 - BIG_G_MINUS_180

    # Newton iteration for the azimuth on the sphere.
    az_sphere, delta = az_plane, 1.0
    while abs(delta) > NEWTON_TOLERANCE:
        h = _snyder_h(_sin(az_sphere), _cos(az_sphere))
        residual = target - h - az_sphere
        derivative = (_cos(az_sphere) * SIN_BIG_G_COS_G + _sin(az_sphere) * COS_BIG_G) / _sin(h) - 1
        delta = -residual / derivative
        az_sphere += delta

    sin_az_s, cos_az_s = _sin(az_sphere), _cos(az_sphere)
    f = _scale_factor(sin_az_p, cos_az_p, sin_az_s, cos_az_s)
    z = 2 * _asin(rho / (2 * R_PRIME * f))
    az_sphere -= adjustment

    lat0, lon0 = FACE_LAT[face], FACE_LON[face]
    sin_lat0, cos_lat0 = _sin(lat0), _cos(lat0)
    sin_z, cos_z = _sin(z), _cos(z)
    lat = _asin(sin_lat0 * cos_z + cos_lat0 * sin_z * _cos(az_sphere))
    lon = lon0 + _atan2(_sin(az_sphere) * sin_z * cos_lat0, cos_z - sin_lat0 * _sin(lat))
    return _revert_orientation(lat, lon)

#`decode_cell_code()` extracts the level and centre from each code. `hexagon_vertices()` computes the six corners of the hexagon.

def decode_cell_code(code: str) -> CellCentre:
    """Decode a GBIF/geogrid ISEA3H cell code.

    Code layout (non-adaptive IDs):
    ``<prefix><latitude: 8 digits><longitude: 9 digits>`` where the coordinates are
    stored in millionths of a degree, and ``prefix = level + 22*(lat<0) + 44*(lon<0)``.
    A leading minus sign marks a pentagonal cell.

    Raises:
        ValueError: If the code belongs to a pentagonal cell.
    """
    text = str(code)
    if text.startswith("-"):
        raise ValueError("pentagonal cells are not supported")
    coords, prefix = text[-17:], int(text[:-17])

    negative_lat = negative_lon = False
    if prefix > 66:
        negative_lat = negative_lon = True
        level = prefix - 66
    elif prefix > 44:
        negative_lon = True
        level = prefix - 44
    elif prefix > 22:
        negative_lat = True
        level = prefix - 22
    else:
        level = prefix

    lat = int(coords[:8]) / 1e6 * (-1 if negative_lat else 1)
    lon = int(coords[8:]) / 1e6 * (-1 if negative_lon else 1)
    return CellCentre(level, lat, lon)


def _snap_to_lattice_centre(x: float, y: float, side: float, inv_side: float) -> Tuple[float, float]:
    """Snap a point to the exact centre of the hexagon containing it.

    Centres lie on a lattice with spacing ``side / 2`` along x; odd columns are
    shifted by half a row spacing along y. The code only stores the centre to
    1e-6 degrees (~0.1 m), so this removes the rounding error.

    Args:
        x, y: Point in the (possibly axis-swapped) lattice frame, in km.
        side: Triangle side length ``l`` at the grid level.
        inv_side: ``l / sqrt(3)``, the row spacing along y.
    """
    half_side, sixth_side = side / 2, side / 6
    half_row = inv_side / 2
    column = round(x / half_side)
    x_centre = column * half_side
    even = column % 2 == 0

    if abs(x - x_centre) <= sixth_side:         # unambiguous: nearest centre in this column
        row = round((y if even else y - half_row) / inv_side)
        return x_centre, row * inv_side + (0 if even else half_row)

    # Near a column boundary: compare the two candidate centres and keep the closer one.
    y_row_a = round(y / inv_side) * inv_side
    y_row_b = round((y - half_row) / inv_side) * inv_side + half_row
    cand_1 = (x_centre, y_row_a if even else y_row_b)
    cand_2 = ((x_centre + half_side) if x > x_centre else (x_centre - half_side),
              y_row_a if not even else y_row_b)
    dist_1 = math.hypot(x - cand_1[0], y - cand_1[1])
    dist_2 = math.hypot(x - cand_2[0], y - cand_2[1])
    return cand_1 if dist_1 < dist_2 else cand_2


def hexagon_vertices(level: int, lat: float, lon: float) -> List[Tuple[float, float]]:
    """Compute the six vertices of an ISEA3H hexagon.

    Args:
        level: ISEA3H resolution level (as defined by GBIF/geogrid).
        lat, lon: Centre of the hexagon in degrees.

    Returns:
        Six ``(lon, lat)`` pairs in degrees, ordered around the hexagon.
    """
    inv_sqrt3 = 1 / math.sqrt(3)
    side = inv_sqrt3 ** (level - 1) * TRIANGLE_BASE         # triangle side length l
    inv_side = inv_sqrt3 ** level * TRIANGLE_BASE           # l / sqrt(3)
    swapped = level % 2 == 0                                # axes alternate with every level

    face, x0, y0 = sphere_to_face(lat, lon)
    x, y = (y0, x0) if swapped else (x0, y0)
    cx, cy = _snap_to_lattice_centre(x, y, side, inv_side)

    radius = side / 3.0                                     # circumradius of the hexagon
    vertices = []
    for k in range(6):
        angle = math.radians(60 * k)
        dx, dy = radius * math.cos(angle), radius * math.sin(angle)
        face_x, face_y = (cy + dy, cx + dx) if swapped else (cx + dx, cy + dy)
        v_lat, v_lon = face_to_sphere(face, face_x, face_y)
        vertices.append((v_lon, v_lat))
    return vertices


# ________________________________________________________________________________
# 4. CUBE CSV TO HEXAGON LAYER
# ________________________________________________________________________________
def load_cube(path: Path, required_columns: Sequence[str] = REQUIRED_COLUMNS) -> pd.DataFrame:
    """Read the GBIF cube CSV and validate its columns."""
    cube = pd.read_csv(path, sep="\t", dtype=str)
    missing = [c for c in required_columns if c not in cube.columns]
    if missing:
        raise ValueError(f"Missing required column(s) in {path}: {', '.join(missing)}")
    cube["occurrences"] = cube["occurrences"].astype(int)
    cube = cube.dropna(subset=["isea3hcellcode"])
    LOGGER.info("%s rows | %s hexagons | %s species", f"{len(cube):,}",
                f"{cube['isea3hcellcode'].nunique():,}", f"{cube['specieskey'].nunique():,}")
    return cube

def _pairs_to_json(pairs) -> str:
    """Converts a list of (specieskey, species) pairs to a JSON array."""
    ordered = sorted(set(pairs), key=lambda p: p[1])
    return json.dumps([{"specieskey": k, "species": s} for k, s in ordered],
                      ensure_ascii=False)

def aggregate_cells(cube: pd.DataFrame, include_years: bool = False) -> pd.DataFrame:
    """Aggregate the cube to one row per hexagon.

    Columns: ``n_records``, ``richness`` (distinct species), ``species_list`` and,
    when the source columns exist, ``n_genera``, ``n_families``,
    ``richness_<kingdom>``, ``species_<kingdom>`` and, if ``include_years``,
    ``first_year`` and ``last_year``.

    ``species_list`` and ``species_<kingdom>`` are JSON arrays (as text) of
    ``{"specieskey": ..., "species": ...}``. They are ``"None"`` when empty.
    """
    key = "isea3hcellcode"
    rename = {key: "isea3h_cell_code"}
    grouped = cube.groupby(key)

    cells = grouped.agg(
        n_records=("occurrences", "sum"),
        richness=("specieskey", "nunique"),
    ).reset_index().rename(columns=rename)

    # (specieskey, species) pair of every cube row, the base of all the species arrays
    pairs = (cube.dropna(subset=["species", "specieskey"])
             .assign(_pair=lambda d: list(zip(d["specieskey"], d["species"]))))

    species_list = (pairs.groupby(key)["_pair"].agg(_pairs_to_json)
                    .rename("species_list").reset_index().rename(columns=rename))
    cells = cells.merge(species_list, on="isea3h_cell_code", how="left")
    cells["species_list"] = cells["species_list"].fillna("None")

    for column, name in (("genuskey", "n_genera"), ("familykey", "n_families")):
        if column in cube.columns:
            counts = grouped[column].nunique().rename(name).reset_index().rename(columns=rename)
            cells = cells.merge(counts, on="isea3h_cell_code")

    if "kingdom" in cube.columns:
        by_kingdom = (cube.pivot_table(index=key, columns="kingdom", values="specieskey",
                                       aggfunc="nunique", fill_value=0)
                      .add_prefix("richness_").reset_index().rename(columns=rename))
        by_kingdom.columns = [c.lower() for c in by_kingdom.columns]
        cells = cells.merge(by_kingdom, on="isea3h_cell_code")

        # Species array (specieskey + name) per kingdom and hexagon
        species_by_kingdom = (
            pairs.groupby([key, "kingdom"])["_pair"]
            .agg(_pairs_to_json)
            .unstack("kingdom")
            .reset_index()
            .rename(columns=rename)
        )
        species_by_kingdom.columns = [c.lower() for c in species_by_kingdom.columns]

        # Keep only the kingdoms in KINGDOMS and add the missing ones as empty columns
        for kingdom in KINGDOMS:
            if kingdom not in species_by_kingdom.columns:
                species_by_kingdom[kingdom] = None
        species_by_kingdom = species_by_kingdom[["isea3h_cell_code", *KINGDOMS]]
        species_by_kingdom = species_by_kingdom.rename(columns={k: f"species_{k}" for k in KINGDOMS})

        cells = cells.merge(species_by_kingdom, on="isea3h_cell_code", how="left")

        # No species in that kingdom: "None" (a real null is lost when converting to mbtiles)
        species_cols = [f"species_{k}" for k in KINGDOMS]
        cells[species_cols] = cells[species_cols].fillna("None")

    if include_years and "yearmonth" in cube.columns:
        years = (cube.assign(year=cube["yearmonth"].str[:4].astype(float))
                 .groupby(key)["year"].agg(first_year="min", last_year="max")
                 .astype(int).reset_index().rename(columns=rename))
        cells = cells.merge(years, on="isea3h_cell_code")
    return cells


def build_hexagon_layer(cells: pd.DataFrame, equal_area_crs: str) -> gpd.GeoDataFrame:
    """Attach hexagon geometries to the aggregated cells.

    Cells that cannot be decoded (pentagons) are skipped with a warning.
    """
    rows, polygons = [], []
    skipped = 0
    for record in cells.to_dict("records"):
        try:
            centre = decode_cell_code(record["isea3h_cell_code"])
        except ValueError:
            skipped += 1
            continue
        polygons.append(shapely.Polygon(hexagon_vertices(*centre)))
        record.update(isea3h_level=centre.level, center_lat=centre.lat, center_lon=centre.lon)
        rows.append(record)
    if skipped:
        LOGGER.warning("Skipped %d pentagonal cell(s): not supported", skipped)

    layer = gpd.GeoDataFrame(rows, geometry=polygons, crs="EPSG:4326")
    layer["area_km2"] = layer.to_crs(equal_area_crs).area / 1e6

    # Field order as in the reference gpkg; species_list goes last, just before the geometry
    other_cols = [c for c in layer.columns if c not in ("isea3h_level", "center_lat", "center_lon",
                                                   "area_km2", "species_list", "geometry")]
    layer = layer[other_cols + ["isea3h_level", "center_lat", "center_lon", "area_km2",
                           "species_list", "geometry"]]
    levels = sorted(int(level) for level in layer["isea3h_level"].unique())
    LOGGER.info("Level(s) %s | mean hexagon area %.3f km2 | all geometries valid: %s",
                levels, layer["area_km2"].mean(), bool(layer.geometry.is_valid.all()))
    return layer


def filter_by_footprint(layer: gpd.GeoDataFrame, footprint_path: Path) -> gpd.GeoDataFrame:
    """Keep the hexagons that touch the footprint. Hexagons are kept whole, not clipped."""
    footprint = gpd.read_file(footprint_path).to_crs(4326)
    union = footprint.union_all() if hasattr(footprint, "union_all") else footprint.unary_union
    shapely.prepare(union)                       # speeds up the repeated intersection tests
    touches = layer.intersects(union)
    LOGGER.info("Hexagons touching the footprint: %s of %s", f"{int(touches.sum()):,}", f"{len(layer):,}")
    return layer[touches]


def save_geojson(layer: gpd.GeoDataFrame, path: Path) -> None:
    """Write the hexagon layer as a GeoJSON file (the only output of this notebook)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # AUTODETECT_JSON_STRINGS="NO": species fields are stored as JSON text, not as arrays (mbtiles cannot handle arrays)
    layer.to_file(path, driver="GeoJSON", engine="pyogrio", AUTODETECT_JSON_STRINGS="NO")
    LOGGER.info("Saved %s (%s hexagons)", path, f"{len(layer):,}")