import subprocess
import time
from pathlib import Path

import boto3
import geopandas as gpd
import requests


def clip_vector(
    vector_path: Path,
    boundary_path: Path,
    target_crs: int = 4326,
) -> gpd.GeoDataFrame:
    """
    Read a vector file, clip it to a boundary, and reproject.

    Args:
        vector_path: Path to the input vector file (shapefile, GeoJSON, etc.)
        boundary_path: Path to the clipping boundary vector file.
        target_crs: EPSG code for the output CRS.

    Returns:
        Clipped and reprojected GeoDataFrame.
    """
    boundary = gpd.read_file(boundary_path)
    gdf = gpd.read_file(vector_path)
    clipped = gpd.clip(gdf, boundary.to_crs(gdf.crs))
    clipped = clipped.to_crs(epsg=target_crs)
    return clipped


def rename_and_filter(
    gdf: gpd.GeoDataFrame,
    renames: dict[str, str] | None = None,
    keep_fields: list[str] | None = None,
) -> gpd.GeoDataFrame:
    """
    Rename columns and keep only specified fields.

    Args:
        gdf: Input GeoDataFrame.
        renames: Mapping of old column names to new names.
        keep_fields: List of columns to keep (geometry is always included).
            If None, all columns are kept.

    Returns:
        GeoDataFrame with renamed and filtered columns.
    """
    if renames:
        gdf = gdf.rename(columns=renames)
    if keep_fields is not None:
        gdf = gdf[keep_fields + ["geometry"]]
    return gdf


def generate_mbtiles(
    geojson_paths: list[Path] | Path,
    output_dir: Path,
    min_zoom: int = 3,
    max_zoom: int = 14,
) -> list[Path]:
    """
    Generate MBTiles from GeoJSON files using tippecanoe.

    Args:
        geojson_paths: Single path or list of paths to GeoJSON files.
        output_dir: Directory where MBTiles files will be written.
        min_zoom: Minimum zoom level.
        max_zoom: Maximum zoom level.

    Returns:
        List of generated MBTiles paths.
    """
    if isinstance(geojson_paths, Path):
        geojson_paths = [geojson_paths]

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    generated = []
    for geojson_path in geojson_paths:
        layer_name = geojson_path.stem
        output_path = output_dir / f"{layer_name}.mbtiles"

        cmd = [
            "tippecanoe",
            "-o", str(output_path),
            "-Z", str(min_zoom),
            "-z", str(max_zoom),
            "-r1",
            "--no-feature-limit",
            "--no-tile-size-limit",
            f"--layer={layer_name}",
            "--force",
            str(geojson_path),
        ]

        print(f"{layer_name}: generating MBTiles...")
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if result.returncode != 0:
            print(f"  ERROR: {result.stderr}")
        else:
            print(f"  → {output_path}")
            generated.append(output_path)

    return generated


def upload_to_mapbox(
    mbtiles_paths: list[Path] | Path,
    token: str,
    username: str,
    poll_interval: int = 5,
) -> dict[str, str]:
    """
    Upload MBTiles files to Mapbox using the Uploads API.

    Args:
        mbtiles_paths: Single path or list of paths to MBTiles files.
        token: Mapbox secret access token (sk.*) with uploads:write scope.
        username: Mapbox username (e.g. 'ecc-design').
        poll_interval: Seconds between status checks.

    Returns:
        Dict mapping layer names to tileset IDs (e.g. {'first_nations': 'ecc-design.first_nations'}).
    """
    if isinstance(mbtiles_paths, Path):
        mbtiles_paths = [mbtiles_paths]

    api_base = f"https://api.mapbox.com/uploads/v1/{username}"
    results = {}

    for mbtiles_path in mbtiles_paths:
        layer_name = mbtiles_path.stem
        tileset_id = f"{username}.{layer_name}"
        print(f"{layer_name}: uploading to Mapbox...")

        # 1. Get temporary S3 credentials
        resp = requests.post(
            f"{api_base}/credentials",
            params={"access_token": token},
            timeout=30,
        )
        resp.raise_for_status()
        creds = resp.json()

        # 2. Upload file to Mapbox's staging S3 bucket.
        #    The bucket is owned by Mapbox and provided via their Uploads API
        #    credentials endpoint, so ExpectedBucketOwner cannot be set.
        s3 = boto3.client(
            "s3",
            aws_access_key_id=creds["accessKeyId"],
            aws_secret_access_key=creds["secretAccessKey"],
            aws_session_token=creds["sessionToken"],
            region_name="us-east-1",
        )
        s3.upload_file(str(mbtiles_path), creds["bucket"], creds["key"])  # NOSONAR

        # 3. Create the upload
        resp = requests.post(
            api_base,
            params={"access_token": token},
            json={
                "url": creds["url"],
                "tileset": tileset_id,
                "name": layer_name,
            },
            timeout=30,
        )
        resp.raise_for_status()
        upload = resp.json()
        upload_id = upload["id"]

        # 4. Poll until complete
        while True:
            time.sleep(poll_interval)
            resp = requests.get(
                f"{api_base}/{upload_id}",
                params={"access_token": token},
                timeout=30,
            )
            resp.raise_for_status()
            status = resp.json()

            if status["complete"]:
                if status.get("error"):
                    print(f"  ERROR: {status['error']}")
                else:
                    print(f"  → {tileset_id}")
                    results[layer_name] = tileset_id
                break

    return results
