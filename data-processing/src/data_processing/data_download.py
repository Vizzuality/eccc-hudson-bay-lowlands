import zipfile
from pathlib import Path

import requests
from tqdm import tqdm


def _download_file_with_progress(url: str, output_path: Path, timeout: int = 60) -> bool:
    """
    Download a file with progress bar and error handling.

    Args:
        url (str): URL to download from
        output_path (Path): Path where file will be saved
        timeout (int): Request timeout in seconds

    Returns:
        bool: True if download successful, False otherwise
    """
    try:
        print(f"Downloading {output_path.name}...")
        with requests.Session() as session:
            response = session.get(url, stream=True, timeout=timeout)
            response.raise_for_status()

            total_size = int(response.headers.get('content-length', 0))

            with open(output_path, "wb") as f, tqdm(
                desc=f"Downloading {output_path.name}",
                total=total_size,
                unit="B",
                unit_scale=True,
                unit_divisor=1024
            ) as bar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        bar.update(len(chunk))

        print(f"✔ Downloaded {output_path}")
        return True

    except requests.HTTPError as e:
        print(f"✘ HTTP error downloading {output_path.name}: {e}")
        return False
    except requests.RequestException as e:
        print(f"✘ Request failed for {output_path.name}: {e}")
        return False
    except Exception as e:
        print(f"✘ Unexpected error downloading {output_path.name}: {e}")
        return False


def _extract_zip(zip_path: Path, output_dir: Path, remove_zip: bool = False) -> bool:
    """
    Extract a zip file into a subfolder named after the zip file.

    Args:
        zip_path (Path): Path to zip file
        output_dir (Path): Directory to extract to
        remove_zip (bool): Whether to remove zip after extraction

    Returns:
        bool: True if extraction successful, False otherwise
    """
    try:
        # Create extraction folder named after the zip file (without .zip extension)
        zip_folder_name = zip_path.stem
        extract_dir = output_dir / zip_folder_name

        print(f"Extracting {zip_path.name}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        print(f"✔ Extracted to {extract_dir}")

        if remove_zip:
            zip_path.unlink()
            print(f"✔ Removed {zip_path}")

        return True

    except zipfile.BadZipFile as e:
        print(f"✘ Error extracting {zip_path.name}: {e}")
        return False
    except Exception as e:
        print(f"✘ Unexpected error during extraction: {e}")
        return False


def download_water_data(output_dir: str, year_start: int = 1985, year_end: int = 2021) -> bool:
    """
    Download Hudson Bay Lowlands annual surface water masks (1985-2021).

    Args:
        output_dir (str): Directory to save files
        year_start (int): Start year (default: 1985)
        year_end (int): End year (default: 2021)

    Returns:
        bool: True if all downloads successful, False otherwise
    """
    base_url = "https://data-donnees.az.ec.gc.ca/api/file?path=%2Fwater%2Fscientificknowledge%2Fannual-hudson-bay-lowland-surface-water-masks-1985-2021-data%2Fwf"

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    success_count = 0
    total_count = year_end - year_start + 1

    for year in range(year_start, year_end + 1):
        filename = f"wf{year}.tif"
        url = f"{base_url}{year}.tif"
        file_path = output_path / filename

        if _download_file_with_progress(url, file_path):
            success_count += 1

    print(f"\nDownloaded {success_count}/{total_count} water data files")
    return success_count == total_count


def download_tree_data(output_dir: str, extract: bool = True, remove_zip: bool = False) -> bool:
    """
    Download Canadian Forest Service treed area data (1984-2022).

    Args:
        output_dir (str): Directory to save files
        extract (bool): Whether to extract zip file (default: True)
        remove_zip (bool): Whether to remove zip after extraction (default: False)

    Returns:
        bool: True if download (and extraction if requested) successful, False otherwise
    """
    url = "https://opendata.nfis.org/downloads/forest_change/CA_treed_area_1984-2022.zip"
    filename = "CAN_treed_area_1984-2022.zip"

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    zip_path = output_path / filename

    # Download the zip file
    if not _download_file_with_progress(url, zip_path, timeout=120):
        return False

    # Extract if requested
    if extract:
        return _extract_zip(zip_path, output_path, remove_zip)

    return True


def download_flood_index(output_dir: str) -> bool:
    """
    Download Canadian Flood Susceptibility Index.

    Args:
        output_dir (str): Directory to save files

    Returns:
        bool: True if download successful, False otherwise
    """
    url = "https://datacube-prod-data-public.s3.ca-central-1.amazonaws.com/store/water/flood-susceptibility/FS-national-2015-index.tif"
    filename = "FSI.tif"

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    file_path = output_path / filename

    return _download_file_with_progress(url, file_path, timeout=120)
