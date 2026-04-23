import os
import subprocess
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import shapes
from rasterio.mask import mask
from shapely import union_all
from shapely.geometry import mapping, shape


def detect_raster_type(geotiff_path: Path, categorical_threshold: int = 20) -> str:
    """
    Detect whether a raster is categorical or continuous based on number of unique values.

    Args:
        geotiff_path (Path): Input raster path
        categorical_threshold (int): Max number of unique values to consider categorical

    Returns:
        "categorical" or "continuous"
    """
    with rasterio.open(geotiff_path) as src:
        band = src.read(1)
        unique_vals = np.unique(band)
        if len(unique_vals) <= categorical_threshold:
            return "categorical"
        else:
            return "continuous"

def convert_to_cog(
    geotiff_path: Path,
    cog_output_path: Path,
    compression: str = "DEFLATE",
    block_size: int = 512,
) -> None:
    """
    Convert a GeoTIFF file to a COG with appropriate overviews, without reprojecting.

    Args:
        geotiff_path (Path): Path to the input GeoTIFF.
        cog_output_path (Path): Path where the COG will be written.
        compression (str): Lossless compression method (DEFLATE, LZW, ZSTD).
        block_size (int): Internal tile size (pixels).
    """
    geotiff_path = geotiff_path.resolve()
    cog_output_path = cog_output_path.resolve()

    if not geotiff_path.exists():
        raise FileNotFoundError(f"Input GeoTIFF not found: {geotiff_path}")

    # Detect raster type
    raster_type = detect_raster_type(geotiff_path)
    if raster_type == "categorical":
        overview_resampling = "mode"
    else:
        overview_resampling = "average"

    # Ensure output directory exists
    cog_output_path.parent.mkdir(parents=True, exist_ok=True)

    # Build rio-cogeo command without web optimization (no CRS change)
    command = [
        "rio",
        "cogeo",
        "create",
        "--overview-resampling", overview_resampling,
        "--co", f"COMPRESS={compression}",
        "--co", "BIGTIFF=IF_SAFER",
        "--co", f"BLOCKXSIZE={block_size}",
        "--co", f"BLOCKYSIZE={block_size}",
        str(geotiff_path),
        str(cog_output_path),
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✔ Converted {geotiff_path.name} to COG ({raster_type}, {overview_resampling})")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip() if e.stderr else str(e)
        raise RuntimeError(
            f"COG conversion failed for {geotiff_path.name}: {error_msg}"
        ) from e


def _default_nodata(dtype: str) -> int | float:
    """Return a safe nodata sentinel for the given rasterio dtype string."""
    defaults = {
        "uint8": 255,
        "uint16": 65535,
        "int16": -32768,
        "int32": -2147483648,
    }
    return defaults.get(dtype, -9999.0)


def clip_raster_to_vector(
    raster_path: Path,
    vector_path: Path,
    output_path: Path,
    crop: bool = True
) -> None:
    """
    Clip a raster to the boundaries of a vector polygon.

    Args:
        raster_path (Path): Path to input raster file
        vector_path (Path): Path to vector file with clipping boundary
        output_path (Path): Path for the clipped output raster
        crop (bool): Whether to crop the raster extent to the vector bounds
    """
    # Read the vector boundary
    gdf = gpd.read_file(vector_path)

    # Ensure we have a valid geometry
    if gdf.empty:
        raise ValueError(f"No geometries found in {vector_path}")

    # Combine all geometries into one (in case there are multiple polygons)
    if len(gdf) > 1:
        boundary = union_all(gdf.geometry)
    else:
        boundary = gdf.geometry.iloc[0]

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Clip the raster
    with rasterio.open(raster_path) as src:
        # Convert boundary to the same CRS as raster if needed
        if gdf.crs != src.crs:
            gdf_reproj = gdf.to_crs(src.crs)
            if len(gdf_reproj) > 1:
                boundary = union_all(gdf_reproj.geometry)
            else:
                boundary = gdf_reproj.geometry.iloc[0]

        # Convert Shapely geometry to GeoJSON-like dict format for rasterio.mask
        boundary_geojson = mapping(boundary)

        # Determine appropriate nodata value if not set
        nodata_value = src.nodata if src.nodata is not None else _default_nodata(src.dtypes[0])

        # Clip the raster
        clipped_image, clipped_transform = mask(
            src,
            [boundary_geojson],
            crop=crop,
            nodata=nodata_value,
            filled=True
        )

        # Update metadata
        clipped_meta = src.meta.copy()
        clipped_meta.update({
            "height": clipped_image.shape[1],
            "width": clipped_image.shape[2],
            "transform": clipped_transform,
            "nodata": nodata_value
        })

        # Write clipped raster
        with rasterio.open(output_path, "w", **clipped_meta) as dst:
            dst.write(clipped_image)

    print(f"✔ Clipped {raster_path.name} to HBL extent")


def batch_clip_rasters(
    raster_dir: Path,
    vector_path: Path,
    output_dir: Path,
    patterns: list[str] | str = ["CAN_*"],
    folder_name: str | None = None  # optional custom folder name
) -> None:
    """
    Batch clip multiple rasters to a vector boundary.
    Optionally store outputs in a custom folder name under output_dir.
    Automatically strips "CAN_" prefix from folder names when processing CAN_* patterns.

    Args:
        raster_dir (Path): Directory containing input rasters or folders
        vector_path (Path): Path to vector boundary file
        output_dir (Path): Directory for clipped outputs
        patterns (list[str] | str): Glob pattern(s) to match files or folders
        folder_name (str | None): Optional folder name under output_dir to store all clipped rasters
    """
    if isinstance(patterns, str):
        patterns = [patterns]

    raster_files = []

    for pattern in patterns:
        # Direct files
        direct_files = list(raster_dir.glob(f"{pattern}.tif"))
        raster_files.extend(direct_files)

        # Folders matching pattern
        matching_folders = [d for d in raster_dir.glob(pattern) if d.is_dir()]
        for folder in matching_folders:
            folder_tiffs = list(folder.glob("*.tif"))
            raster_files.extend(folder_tiffs)

    if not raster_files:
        print(f"No raster files found matching patterns {patterns} in {raster_dir}")
        return

    print(f"Found {len(raster_files)} raster files to clip:")
    success_count = 0

    for raster_file in raster_files:
        try:
            # Decide where to store clipped output
            if folder_name:
                output_subdir = output_dir / folder_name
            elif raster_file.parent != raster_dir:
                relative_folder = raster_file.parent.relative_to(raster_dir)
                folder_name_str = str(relative_folder)
                # Automatically strip "CAN_" prefix when processing CAN_* patterns
                if folder_name_str.startswith("CAN_"):
                    folder_name_str = folder_name_str[4:]  # Remove "CAN_"
                output_subdir = output_dir / folder_name_str
            else:
                output_subdir = output_dir

            output_subdir.mkdir(parents=True, exist_ok=True)

            # Output filename now keeps original name, no prefix
            output_path = output_subdir / raster_file.name

            clip_raster_to_vector(raster_file, vector_path, output_path)
            success_count += 1

        except Exception as e:
            print(f"✘ Failed to clip {raster_file.name}: {e}")

    print(f"\nSuccessfully clipped {success_count}/{len(raster_files)} rasters")

def raster_to_footprint(raster_path, output_vector):
    """
    Create a footprint vector from a raster (binary mask of valid data).

    Parameters
    ----------
    raster_path : str
        Path to input raster (GeoTIFF, COG, etc.)
    output_vector : str
        Path to output vector (GeoPackage, Shapefile, etc.)
    """

    # Make sure output directory exists
    output_dir = os.path.dirname(output_vector)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)


    with rasterio.open(raster_path) as src:
        image = src.read(1)
        nodata = src.nodata
        transform = src.transform
        crs = src.crs

    # Binary mask of valid data
    mask = image != nodata
    binary = mask.astype("uint8")

    # Extract polygons
    geoms = [shape(geom) for geom, value in shapes(binary, mask=binary, transform=transform)]

    # Merge into single footprint
    footprint = union_all(geoms)

    # Create GeoDataFrame
    gdf = gpd.GeoDataFrame({"id": [1]}, geometry=[footprint], crs=crs)

    # Save to file
    gdf.to_file(output_vector, driver="GeoJSON")
    print(f"Footprint saved to: {output_vector}")
