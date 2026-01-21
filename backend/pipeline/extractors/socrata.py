import asyncio
import logging
from typing import AsyncIterator, Any
from datetime import datetime

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import get_settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Token bucket rate limiter for API requests."""

    def __init__(self, rate: int):
        self.rate = rate
        self.tokens = rate
        self.last_refill = datetime.now()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = datetime.now()
            elapsed = (now - self.last_refill).total_seconds()
            self.tokens = min(self.rate, self.tokens + elapsed * self.rate)
            self.last_refill = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.rate
                await asyncio.sleep(wait_time)
                self.tokens = 0
            else:
                self.tokens -= 1


class SocrataClient:
    """Async client for NYC Open Data Socrata API with pagination and rate limiting."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.socrata_base_url
        self.app_token = self.settings.socrata_app_token
        self.page_size = self.settings.socrata_page_size
        self.rate_limiter = RateLimiter(self.settings.socrata_rate_limit)

        self.headers = {"Accept": "application/json"}
        if self.app_token:
            self.headers["X-App-Token"] = self.app_token

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    )
    async def _fetch_page(
        self,
        client: httpx.AsyncClient,
        dataset_id: str,
        offset: int,
        where: str | None = None,
        select: str | None = None,
        order: str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch a single page of results from Socrata API."""
        await self.rate_limiter.acquire()

        url = f"{self.base_url}/resource/{dataset_id}.json"
        params = {
            "$limit": self.page_size,
            "$offset": offset,
        }
        if where:
            params["$where"] = where
        if select:
            params["$select"] = select
        if order:
            params["$order"] = order

        response = await client.get(url, params=params, headers=self.headers)
        response.raise_for_status()
        return response.json()

    async def fetch_all(
        self,
        dataset_id: str,
        where: str | None = None,
        select: str | None = None,
        order: str | None = None,
        start_offset: int = 0,
    ) -> AsyncIterator[dict[str, Any]]:
        """
        Fetch all records from a dataset with automatic pagination.

        Yields individual records as they are fetched.
        """
        offset = start_offset
        total_fetched = 0

        async with httpx.AsyncClient(timeout=120.0) as client:
            while True:
                logger.info(
                    f"Fetching {dataset_id}: offset={offset}, page_size={self.page_size}"
                )

                records = await self._fetch_page(
                    client, dataset_id, offset, where, select, order
                )

                if not records:
                    logger.info(f"Finished fetching {dataset_id}: {total_fetched} total records")
                    break

                for record in records:
                    yield record

                total_fetched += len(records)
                offset += self.page_size

                if len(records) < self.page_size:
                    logger.info(f"Finished fetching {dataset_id}: {total_fetched} total records")
                    break

    async def get_record_count(self, dataset_id: str, where: str | None = None) -> int:
        """Get total record count for a dataset."""
        await self.rate_limiter.acquire()

        url = f"{self.base_url}/resource/{dataset_id}.json"
        params = {"$select": "count(*)"}
        if where:
            params["$where"] = where

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params, headers=self.headers)
            response.raise_for_status()
            result = response.json()
            return int(result[0]["count"]) if result else 0

    async def fetch_batch(
        self,
        dataset_id: str,
        batch_size: int = 1000,
        where: str | None = None,
        select: str | None = None,
        order: str | None = None,
        start_offset: int = 0,
    ) -> AsyncIterator[list[dict[str, Any]]]:
        """
        Fetch records in batches for bulk processing.

        Yields lists of records for batch database inserts.
        """
        batch = []
        async for record in self.fetch_all(dataset_id, where, select, order, start_offset):
            batch.append(record)
            if len(batch) >= batch_size:
                yield batch
                batch = []

        if batch:
            yield batch
