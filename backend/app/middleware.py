"""Middleware for IsMyLandlordShady.nyc API."""

import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.logging_config import get_logger

logger = get_logger('middleware')


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log request/response details."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for health checks to reduce noise
        if request.url.path in ('/health', '/'):
            return await call_next(request)

        start_time = time.perf_counter()

        # Log request start
        logger.info(
            f"Request: {request.method} {request.url.path} | "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )

        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"Request failed: {request.method} {request.url.path} | "
                f"Duration: {duration_ms:.2f}ms | Error: {str(e)}",
                exc_info=True
            )
            raise

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} | "
            f"Status: {response.status_code} | Duration: {duration_ms:.2f}ms"
        )

        # Add timing header
        response.headers['X-Response-Time'] = f"{duration_ms:.2f}ms"

        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware to handle and log unhandled exceptions."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(
                f"Unhandled exception: {type(e).__name__}: {str(e)}",
                exc_info=True
            )
            raise
