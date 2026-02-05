import os
import subprocess
from pathlib import Path

import geopandas as gpd
import rasterio
from rasterio.features import shapes
from rasterio.mask import mask
from shapely import union_all
from shapely.geometry import shape


def convert_to_cog(
    geotiff_path: Path,
    cog_output_path: Path,
    compression: str = "DEFLATE",
    block_size: int = 512,
    overview_resampling: str = "nearest",
) -> None:
    """
    Convert a GeoTIFF file to COG format.

    Args:
        geotiff_path (Path): Path to the input GeoTIFF.
        cog_output_path (Path): Path where the COG will be written.
        compression (str): Lossless compression method (DEFLATE, LZW, ZSTD).
        block_size (int): Internal tile size (pixels).
        overview_resampling (str): Resampling method for overviews.
                                     Use 'nearest' to avoid smoothing.
    """
    geotiff_path = geotiff_path.resolve()
    cog_output_path = cog_output_path.resolve()

    if not geotiff_path.exists():
        raise FileNotFoundError(f"Input GeoTIFF not found: {geotiff_path}")

    # Ensure output directory exists
    cog_output_path.parent.mkdir(parents=True, exist_ok=True)

    command = [
        "rio",
        "cogeo",
        "create",
        "--overview-resampling",
        overview_resampling,
        "--co", f"COMPRESS={compression}",
        "--co", "BIGTIFF=YES",
        "--co", f"BLOCKXSIZE={block_size}",
        "--co", f"BLOCKYSIZE={block_size}",
        str(geotiff_path),
        str(cog_output_path),
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✔ Converted {geotiff_path.name} to COG")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip() if e.stderr else str(e)
        raise RuntimeError(
            f"COG conversion failed for {geotiff_path.name}: {error_msg}"
        ) from e


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

        # Clip the raster
        clipped_image, clipped_transform = mask(
            src,
            [boundary],
            crop=crop,
            nodata=src.nodata
        )

        # Update metadata
        clipped_meta = src.meta.copy()
        clipped_meta.update({
            "height": clipped_image.shape[1],
            "width": clipped_image.shape[2],
            "transform": clipped_transform
        })

        # Write clipped raster
        with rasterio.open(output_path, "w", **clipped_meta) as dst:
            dst.write(clipped_image)

    print(f"✔ Clipped {raster_path.name} to HBL extent")


def batch_clip_rasters(
    raster_dir: Path,
    vector_path: Path,
    output_dir: Path,
    patterns: list[str] | str = ["CAN_*"]
) -> None:
    """
    Batch clip multiple rasters to a vector boundary.
    Handles both direct files and files within matching folders.

    Args:
        raster_dir (Path): Directory containing input rasters or folders
        vector_path (Path): Path to vector boundary file
        output_dir (Path): Directory for clipped outputs
        patterns (list[str] | str): Glob pattern(s) to match files or folders
    """
    # Convert single pattern to list for consistent handling
    if isinstance(patterns, str):
        patterns = [patterns]

    raster_files = []

    for pattern in patterns:
        # First, look for direct files matching the pattern
        direct_files = list(raster_dir.glob(f"{pattern}.tif"))
        raster_files.extend(direct_files)

        # Then, look for folders matching the pattern and find TIFs inside them
        matching_folders = [d for d in raster_dir.glob(pattern) if d.is_dir()]
        for folder in matching_folders:
            folder_tiffs = list(folder.glob("*.tif"))
            raster_files.extend(folder_tiffs)

    if not raster_files:
        print(f"No raster files found matching patterns {patterns} in {raster_dir}")
        print(f"   Checked for direct files: {[f'{p}.tif' for p in patterns]}")
        print(f"   Checked for folders: {patterns}")
        return

    print(f"Found {len(raster_files)} raster files to clip:")
    success_count = 0

    for raster_file in raster_files:
        # Show the folder context for better understanding
        relative_path = raster_file.relative_to(raster_dir)
        print(f"{relative_path}")

        try:
            # Create output filename (add HBL_ prefix)
            output_name = "HBL_" + raster_file.name
            output_path = output_dir / output_name

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
