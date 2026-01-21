"""Logging configuration for IsMyLandlordShady.nyc API."""

import logging
import sys
from typing import Any

from app.config import get_settings


def setup_logging() -> None:
    """Configure structured logging for the application."""
    settings = get_settings()

    # Determine log level from settings or environment
    log_level = getattr(settings, 'log_level', 'INFO').upper()

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True,
    )

    # Set levels for third-party loggers to reduce noise
    logging.getLogger('uvicorn').setLevel(logging.INFO)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)

    # Create app logger
    logger = logging.getLogger('ismylandlordshady')
    logger.setLevel(log_level)

    logger.info(f"Logging configured at level: {log_level}")


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a module.

    Args:
        name: The module name (typically __name__)

    Returns:
        A configured logger instance
    """
    return logging.getLogger(f'ismylandlordshady.{name}')


class RequestLogger:
    """Context manager for logging request details."""

    def __init__(self, logger: logging.Logger, method: str, path: str):
        self.logger = logger
        self.method = method
        self.path = path
        self.extra: dict[str, Any] = {}

    def __enter__(self):
        self.logger.info(f"Request started: {self.method} {self.path}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.logger.error(
                f"Request failed: {self.method} {self.path} | Error: {exc_val}",
                exc_info=True
            )
        else:
            status = self.extra.get('status_code', 'unknown')
            duration = self.extra.get('duration_ms', 'unknown')
            self.logger.info(
                f"Request completed: {self.method} {self.path} | "
                f"Status: {status} | Duration: {duration}ms"
            )
        return False  # Don't suppress exceptions

    def set_response_info(self, status_code: int, duration_ms: float):
        """Set response information for logging."""
        self.extra['status_code'] = status_code
        self.extra['duration_ms'] = round(duration_ms, 2)
