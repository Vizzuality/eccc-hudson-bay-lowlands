"""Logging configuration using uvicorn's colored formatter."""

import logging
import sys

from uvicorn.logging import DefaultFormatter


def setup_logging(level: str = "INFO") -> None:
    """Configure root logger with uvicorn's colored output.

    Args:
        level: Log level string (e.g. "INFO", "DEBUG").
    """
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(DefaultFormatter("%(levelprefix)s [%(name)s] %(message)s"))

    root = logging.getLogger()
    root.setLevel(logging.getLevelName(level.upper()))
    root.addHandler(handler)
