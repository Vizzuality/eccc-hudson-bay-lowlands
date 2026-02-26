"""Standalone CLI script to seed the database from metadata.json.

Usage:
    cd api
    uv run python seed.py
    uv run python seed.py --metadata-path /custom/path/to/metadata.json
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from db.base import Base
from db.database import SessionLocal, engine
from models import Category, Dataset, Layer  # noqa: F401
from services.seed import DEFAULT_METADATA_PATH, seed_database

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Seed the database from metadata.json")
    parser.add_argument(
        "--metadata-path",
        type=Path,
        default=DEFAULT_METADATA_PATH,
        help=f"Path to metadata.json (default: {DEFAULT_METADATA_PATH})",
    )
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        counts = seed_database(session, args.metadata_path)
        session.commit()
        logger.info("Seed committed successfully.")
        logger.info(
            "Summary: %d categories (%d new, %d updated), %d datasets (%d new, %d updated), %d layers (%d new, %d updated)",
            counts["categories"]["created"] + counts["categories"]["updated"],
            counts["categories"]["created"],
            counts["categories"]["updated"],
            counts["datasets"]["created"] + counts["datasets"]["updated"],
            counts["datasets"]["created"],
            counts["datasets"]["updated"],
            counts["layers"]["created"] + counts["layers"]["updated"],
            counts["layers"]["created"],
            counts["layers"]["updated"],
        )
    except Exception:
        session.rollback()
        logger.exception("Seed failed, transaction rolled back.")
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
