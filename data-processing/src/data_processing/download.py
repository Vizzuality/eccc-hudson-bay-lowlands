import json
import zipfile
from pathlib import Path

import requests
from tqdm import tqdm

# Download Helpers

def _download_file(url: str, output_path: Path, timeout: int = 60) -> bool:
    """Download a single file with a progress bar."""
    try:
        with requests.Session() as session:
            response = session.get(url, stream=True, timeout=timeout)
            response.raise_for_status()
            total_size = int(response.headers.get("content-length", 0))

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

        print(f"✔ Downloaded {output_path.name}")
        return True

    except requests.HTTPError as e:
        print(f"✘ HTTP error for {output_path.name}: {e}")
    except requests.RequestException as e:
        print(f"✘ Request failed for {output_path.name}: {e}")
    except Exception as e:
        print(f"✘ Unexpected error for {output_path.name}: {e}")

    return False


def _extract_zip(zip_path: Path, output_dir: Path, remove_zip: bool = False) -> bool:
    """Extract a ZIP file."""
    try:
        extract_dir = output_dir / zip_path.stem
        print(f"Extracting {zip_path.name} → {extract_dir}")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        if remove_zip:
            zip_path.unlink()
            print(f"✔ Removed {zip_path.name}")

        return True
    except zipfile.BadZipFile as e:
        print(f"✘ Bad ZIP file {zip_path.name}: {e}")
    except Exception as e:
        print(f"✘ Error extracting {zip_path.name}: {e}")
    return False

# Prepare Files

def _prepare_files(dataset_name: str, dataset: dict) -> list[dict]:
    """Return a unified list of files to download."""
    files_to_download = []

    # Snow dynamics (base_url + types + winter_years)
    if "base_url" in dataset:
        for wy in dataset.get("winter_years", []):
            for typ in dataset.get("types", []):
                files_to_download.append({
                    "url": dataset["base_url"].format(type=typ, wy=wy),
                    "filename": f"HLS_Fmask_v1_1_snow_{typ}_winterYear{wy}_Canada.tif"
                })

    # Layers
    elif "layers" in dataset:
        for layer in dataset["layers"]:
            files_to_download.append({
                "url": layer.get("url"),
                "filename": layer.get("filename")
            })

    # Simple files
    elif "files" in dataset:
        files_to_download.extend(dataset["files"])

    return files_to_download


# Main Download Functions

def download_files(files: list[dict], output_dir: str, extract: bool = False, remove_zip: bool = False) -> bool:
    """Download a list of files."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    success_count = 0
    for f in files:
        file_path = output_path / f["filename"]
        if _download_file(f["url"], file_path):
            success_count += 1
            if extract and file_path.suffix.lower() == ".zip":
                _extract_zip(file_path, output_path, remove_zip)

    print(f"\nDownloaded {success_count}/{len(files)} files")
    return success_count == len(files)


def download_dataset(dataset_name: str, output_dir: str, extract: bool = None, remove_zip: bool = False) -> bool:
    """Download an entire dataset based on its JSON definition."""
    if dataset_name not in DATASETS:
        raise ValueError(f"Dataset '{dataset_name}' not defined")

    dataset = DATASETS[dataset_name]

    # Decide extraction
    if extract is None:
        extract = dataset.get("extract", False)

    # Prepare file list
    files_to_download = _prepare_files(dataset_name, dataset)

    # Download
    success = download_files(files_to_download, output_dir, extract, remove_zip)

    # Update state
    if success:
        dataset["state"] = "downloaded"
        for layer in dataset.get("layers", []):
            layer["state"] = "downloaded"

    return success



# Load JSON

with open("../src/datasets/datasets.json") as f:
    DATASETS = json.load(f)
