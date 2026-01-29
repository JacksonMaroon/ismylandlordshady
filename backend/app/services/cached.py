"""Cached versions of service operations.

This module provides caching wrappers for expensive database operations.
Cache keys are based on the query parameters, and results are stored
for a configurable TTL.
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import get_cache, make_cache_key, CacheTTL, CacheKeys
from app.services.buildings import BuildingService, LeaderboardService, OwnerService
from app.logging_config import get_logger

logger = get_logger('services.cached')


class CachedBuildingService:
    """Building service with caching support."""

    def __init__(self, session: AsyncSession):
        self._service = BuildingService(session)
        self._cache = get_cache()

    async def search_buildings(self, query: str, limit: int = 10) -> list[dict]:
        """Search buildings with caching (short TTL since search results change)."""
        # Normalize query for consistent caching
        normalized_query = query.upper().strip()
        cache_key = make_cache_key(CacheKeys.SEARCH, normalized_query, limit=limit)

        # Try cache first
        cached = await self._cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Cache HIT: search '{normalized_query}'")
            return cached

        logger.debug(f"Cache MISS: search '{normalized_query}'")
        results = await self._service.search_buildings(query, limit=limit)

        # Cache for short duration (search results may include new data)
        await self._cache.set(cache_key, results, ttl=CacheTTL.SHORT)
        return results

    async def get_building_by_bbl(self, bbl: str):
        """Get building by BBL (not cached - quick query)."""
        return await self._service.get_building_by_bbl(bbl)

    async def get_building_report(self, bbl: str) -> Optional[dict]:
        """Get comprehensive building report with caching."""
        cache_key = make_cache_key(CacheKeys.BUILDING_REPORT, bbl)

        # Try cache first
        cached = await self._cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Cache HIT: building report {bbl}")
            return cached

        logger.debug(f"Cache MISS: building report {bbl}")
        report = await self._service.get_building_report(bbl)

        if report is not None:
            # Cache for medium duration
            await self._cache.set(cache_key, report, ttl=CacheTTL.MEDIUM)

        return report

    async def get_violations_count(
        self,
        bbl: str,
        status: Optional[str] = None,
        violation_class: Optional[str] = None,
    ) -> int:
        """Get violations count with caching."""
        cache_key = make_cache_key(
            f"{CacheKeys.BUILDING_VIOLATIONS}:count",
            bbl,
            status=status,
            violation_class=violation_class
        )

        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached

        count = await self._service.get_violations_count(bbl, status, violation_class)
        await self._cache.set(cache_key, count, ttl=CacheTTL.MEDIUM)
        return count

    async def get_violations(
        self,
        bbl: str,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
        violation_class: Optional[str] = None,
    ) -> list[dict]:
        """Get paginated violations with caching."""
        cache_key = make_cache_key(
            CacheKeys.BUILDING_VIOLATIONS,
            bbl,
            limit=limit,
            offset=offset,
            status=status,
            violation_class=violation_class
        )

        cached = await self._cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Cache HIT: violations {bbl}")
            return cached

        logger.debug(f"Cache MISS: violations {bbl}")
        violations = await self._service.get_violations(
            bbl, limit=limit, offset=offset, status=status, violation_class=violation_class
        )

        await self._cache.set(cache_key, violations, ttl=CacheTTL.MEDIUM)
        return violations

    async def get_timeline(self, bbl: str, limit: int = 50) -> list[dict]:
        """Get building timeline with caching."""
        cache_key = make_cache_key(f"{CacheKeys.BUILDING}:timeline", bbl, limit=limit)

        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached

        timeline = await self._service.get_timeline(bbl, limit=limit)
        await self._cache.set(cache_key, timeline, ttl=CacheTTL.MEDIUM)
        return timeline

    async def get_recent_violations(
        self,
        limit: int = 50,
        violation_class: Optional[str] = None,
    ) -> list[dict]:
        """Get recent violations across all buildings with caching."""
        cache_key = make_cache_key(
            f"{CacheKeys.BUILDING}:recent_violations",
            limit=limit,
            violation_class=violation_class
        )

        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached

        violations = await self._service.get_recent_violations(
            limit=limit, violation_class=violation_class
        )
        await self._cache.set(cache_key, violations, ttl=CacheTTL.SHORT)
        return violations


class CachedLeaderboardService:
    """Leaderboard service with caching support."""

    def __init__(self, session: AsyncSession):
        self._service = LeaderboardService(session)
        self._cache = get_cache()

    async def get_worst_buildings_count(self, borough: Optional[str] = None) -> int:
        """Get total count of ranked buildings with caching."""
        cache_key = make_cache_key(
            f"{CacheKeys.LEADERBOARD_BUILDINGS}:count",
            borough=borough
        )

        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached

        count = await self._service.get_worst_buildings_count(borough)
        await self._cache.set(cache_key, count, ttl=CacheTTL.LONG)
        return count

    async def get_worst_buildings(
        self,
        borough: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """Get worst buildings leaderboard with caching."""
        cache_key = make_cache_key(
            CacheKeys.LEADERBOARD_BUILDINGS,
            borough=borough,
            limit=limit,
            offset=offset
        )

        cached = await self._cache.get(cache_key)
        if cached is not None:
            logger.debug("Cache HIT: worst buildings leaderboard")
            return cached

        logger.debug("Cache MISS: worst buildings leaderboard")
        buildings = await self._service.get_worst_buildings(borough, limit, offset)

        # Leaderboards change less frequently - use longer TTL
        await self._cache.set(cache_key, buildings, ttl=CacheTTL.LONG)
        return buildings

    async def get_worst_landlords_count(self) -> int:
        """Get total count of ranked landlords with caching."""
        cache_key = make_cache_key(f"{CacheKeys.LEADERBOARD_LANDLORDS}:count")

        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached

        count = await self._service.get_worst_landlords_count()
        await self._cache.set(cache_key, count, ttl=CacheTTL.LONG)
        return count

    async def get_worst_landlords(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """Get worst landlords leaderboard with caching."""
        cache_key = make_cache_key(
            CacheKeys.LEADERBOARD_LANDLORDS,
            limit=limit,
            offset=offset
        )

        cached = await self._cache.get(cache_key)
        if cached is not None:
            logger.debug("Cache HIT: worst landlords leaderboard")
            return cached

        logger.debug("Cache MISS: worst landlords leaderboard")
        landlords = await self._service.get_worst_landlords(limit, offset)

        await self._cache.set(cache_key, landlords, ttl=CacheTTL.LONG)
        return landlords


class CachedOwnerService:
    """Owner service with caching support."""

    def __init__(self, session: AsyncSession):
        self._service = OwnerService(session)
        self._cache = get_cache()

    async def get_portfolio(self, portfolio_id: int) -> Optional[dict]:
        """Get owner portfolio with caching."""
        cache_key = make_cache_key(CacheKeys.OWNER, portfolio_id)

        cached = await self._cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Cache HIT: owner portfolio {portfolio_id}")
            return cached

        logger.debug(f"Cache MISS: owner portfolio {portfolio_id}")
        portfolio = await self._service.get_portfolio(portfolio_id)

        if portfolio is not None:
            await self._cache.set(cache_key, portfolio, ttl=CacheTTL.MEDIUM)

        return portfolio


async def invalidate_building_cache(bbl: str) -> None:
    """Invalidate all cache entries for a building."""
    cache = get_cache()
    patterns = [
        f"{CacheKeys.BUILDING}:{bbl}*",
        f"{CacheKeys.BUILDING_REPORT}:{bbl}*",
        f"{CacheKeys.BUILDING_VIOLATIONS}:{bbl}*",
    ]
    for pattern in patterns:
        deleted = await cache.clear_pattern(pattern)
        if deleted:
            logger.info(f"Invalidated {deleted} cache entries for pattern {pattern}")


async def invalidate_leaderboard_cache() -> None:
    """Invalidate all leaderboard cache entries."""
    cache = get_cache()
    deleted = await cache.clear_pattern(f"{CacheKeys.LEADERBOARD_BUILDINGS}*")
    deleted += await cache.clear_pattern(f"{CacheKeys.LEADERBOARD_LANDLORDS}*")
    logger.info(f"Invalidated {deleted} leaderboard cache entries")
