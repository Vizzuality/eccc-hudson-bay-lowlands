"""Database seeding logic for loading metadata.json into the database."""

import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Category, Dataset, Layer

logger = logging.getLogger(__name__)

DEFAULT_METADATA_PATH = Path(__file__).parent.parent.parent / "data-processing" / "src" / "datasets" / "metadata.json"


def normalize_empty_string(value: str | None) -> str | None:
    """Convert empty strings to None for database storage."""
    if value == "":
        return None
    return value


def upsert_category(session: Session, category_data: dict) -> tuple[Category, bool]:
    """Find or create a category by English title. Returns (category, is_new)."""
    en_title = category_data["metadata"]["title"]["en"]
    stmt = select(Category).where(Category.metadata_["title"]["en"].as_string() == en_title)
    existing = session.execute(stmt).scalar_one_or_none()

    if existing:
        existing.metadata_ = category_data["metadata"]
        logger.info("Updated category: %s", en_title)
        return existing, False

    new_category = Category(metadata_=category_data["metadata"])
    session.add(new_category)
    session.flush()
    logger.info("Created category: %s", en_title)
    return new_category, True


def upsert_dataset(session: Session, dataset_data: dict, category_id: int) -> tuple[Dataset, bool]:
    """Find or create a dataset by English title within a category. Returns (dataset, is_new)."""
    en_title = dataset_data["metadata"]["title"]["en"]
    stmt = select(Dataset).where(
        Dataset.metadata_["title"]["en"].as_string() == en_title,
        Dataset.category_id == category_id,
    )
    existing = session.execute(stmt).scalar_one_or_none()

    if existing:
        existing.metadata_ = dataset_data["metadata"]
        logger.info("  Updated dataset: %s", en_title)
        return existing, False

    new_dataset = Dataset(metadata_=dataset_data["metadata"], category_id=category_id)
    session.add(new_dataset)
    session.flush()
    logger.info("  Created dataset: %s", en_title)
    return new_dataset, True


def upsert_layer(session: Session, layer_data: dict, dataset_id: int) -> tuple[Layer, bool]:
    """Find or create a layer by path. Returns (layer, is_new)."""
    path = layer_data["path"].lstrip("/")
    stmt = select(Layer).where(Layer.path == path)
    existing = session.execute(stmt).scalar_one_or_none()

    type_value = normalize_empty_string(layer_data.get("type"))
    unit_value = normalize_empty_string(layer_data.get("unit"))
    categories_value = layer_data.get("categories") or None
    config_value = layer_data.get("config") or None

    if existing:
        existing.format_ = layer_data["format"]
        existing.type_ = type_value
        existing.unit = unit_value
        existing.categories = categories_value
        existing.config = config_value
        existing.metadata_ = layer_data["metadata"]
        existing.dataset_id = dataset_id
        logger.info("    Updated layer: %s", path)
        return existing, False

    new_layer = Layer(
        format_=layer_data["format"],
        type_=type_value,
        path=path,
        unit=unit_value,
        categories=categories_value,
        config=config_value,
        metadata_=layer_data["metadata"],
        dataset_id=dataset_id,
    )
    session.add(new_layer)
    session.flush()
    logger.info("    Created layer: %s", path)
    return new_layer, True


def _load_seed_data(metadata_path: Path | str | None, payload: dict | None) -> dict:
    """Load seed data from a payload dict or metadata file."""
    if payload is not None:
        logger.info("Seeding from provided payload")
        return payload

    if metadata_path is None:
        metadata_path = DEFAULT_METADATA_PATH
    metadata_path = Path(metadata_path)
    logger.info("Loading metadata from: %s", metadata_path)
    with open(metadata_path) as f:
        return json.load(f)


def _record_upsert(counts: dict, entity: str, is_new: bool) -> None:
    """Increment the created or updated counter for an entity type."""
    counts[entity]["created" if is_new else "updated"] += 1


def _seed_dataset(session: Session, ds_data: dict, category_id: int, counts: dict) -> None:
    """Seed a single dataset and its child layers."""
    dataset, is_new = upsert_dataset(session, ds_data, category_id)
    _record_upsert(counts, "datasets", is_new)

    for layer_data in ds_data.get("layers", []):
        _, is_new = upsert_layer(session, layer_data, dataset.id)
        _record_upsert(counts, "layers", is_new)


def seed_database(
    session: Session,
    metadata_path: Path | str | None = None,
    payload: dict | None = None,
) -> dict:
    """Seed the database from metadata.json or a provided payload dict.

    Provide either metadata_path (file) or payload (dict). If both are given,
    payload takes precedence. If neither is given, the default file path is used.

    Does NOT commit — the caller is responsible for committing or rolling back.

    Returns:
        Summary dict with counts of created/updated records.
    """
    data = _load_seed_data(metadata_path, payload)

    counts = {
        "categories": {"created": 0, "updated": 0},
        "datasets": {"created": 0, "updated": 0},
        "layers": {"created": 0, "updated": 0},
    }

    for cat_data in data["categories"]:
        category, is_new = upsert_category(session, cat_data)
        _record_upsert(counts, "categories", is_new)

        for ds_data in cat_data.get("datasets", []):
            _seed_dataset(session, ds_data, category.id, counts)

    logger.info("Seed complete: %s", counts)
    return counts
