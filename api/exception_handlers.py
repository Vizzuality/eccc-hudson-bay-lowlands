"""Centralized exception handlers for logging and consistent error responses."""

import logging
import uuid

from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTPException with logging and structured response."""
    logger.warning(
        "HTTP %d on %s %s: %s",
        exc.status_code,
        request.method,
        request.url.path,
        exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "method": request.method,
            "path": request.url.path,
        },
        headers=getattr(exc, "headers", None),
    )


def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors with logging and structured response."""
    logger.warning(
        "Validation error on %s %s: %s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    return JSONResponse(
        status_code=422,
        content={
            "status_code": 422,
            "detail": "Validation error",
            "errors": jsonable_encoder(exc.errors()),
            "body": jsonable_encoder(exc.body) if exc.body else None,
            "method": request.method,
            "path": request.url.path,
        },
    )


def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unhandled exceptions — logs the full traceback."""
    error_id = str(uuid.uuid4())

    logger.error(
        "Unhandled exception [%s] on %s %s: %s",
        error_id,
        request.method,
        request.url.path,
        str(exc),
        exc_info=exc,
    )
    return JSONResponse(
        status_code=500,
        content={
            "status_code": 500,
            "detail": "Internal server error. Please contact support with the error ID below.",
            "error_id": error_id,
            "method": request.method,
            "path": request.url.path,
        },
    )
