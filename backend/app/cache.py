"""Caching module for IsMyLandlordShady.nyc API.

Provides both in-memory and Redis caching backends with a unified interface.
Uses in-memory by default, can switch to Redis by setting REDIS_URL env var.
"""

import asyncio
import hashlib
import json
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Optional, TypeVar

from app.config import get_settings
from app.logging_config import get_logger

logger = get_logger('cache')

T = TypeVar('T')


class CacheBackend(ABC):
    """Abstract base class for cache backends."""

    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Set a value in the cache with TTL in seconds."""
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete a key from the cache."""
        pass

    @abstractmethod
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern. Returns count of deleted keys."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close the cache connection."""
        pass


class InMemoryCache(CacheBackend):
    """Simple in-memory cache with TTL support.

    Good for single-instance deployments or development.
    """

    def __init__(self, max_size: int = 10000):
        self._cache: dict[str, tuple[Any, datetime]] = {}
        self._max_size = max_size
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            if key not in self._cache:
                return None

            value, expires_at = self._cache[key]

            if datetime.utcnow() > expires_at:
                del self._cache[key]
                return None

            return value

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        async with self._lock:
            # Evict oldest entries if at capacity
            if len(self._cache) >= self._max_size:
                # Remove expired entries first
                now = datetime.utcnow()
                expired = [k for k, (_, exp) in self._cache.items() if now > exp]
                for k in expired:
                    del self._cache[k]

                # If still at capacity, remove oldest 10%
                if len(self._cache) >= self._max_size:
                    to_remove = list(self._cache.keys())[:self._max_size // 10]
                    for k in to_remove:
                        del self._cache[k]

            expires_at = datetime.utcnow() + timedelta(seconds=ttl)
            self._cache[key] = (value, expires_at)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._cache.pop(key, None)

    async def clear_pattern(self, pattern: str) -> int:
        """Clear keys matching a simple prefix pattern (e.g., 'building:*')."""
        async with self._lock:
            prefix = pattern.rstrip('*')
            to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
            for k in to_delete:
                del self._cache[k]
            return len(to_delete)

    async def close(self) -> None:
        async with self._lock:
            self._cache.clear()


class RedisCache(CacheBackend):
    """Redis-based cache backend for distributed deployments."""

    def __init__(self, redis_url: str):
        self._redis_url = redis_url
        self._redis = None

    async def _get_redis(self):
        if self._redis is None:
            try:
                import redis.asyncio as redis
                self._redis = redis.from_url(self._redis_url, decode_responses=True)
                logger.info("Connected to Redis cache")
            except ImportError:
                logger.error("redis package not installed. Run: pip install redis")
                raise
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        try:
            r = await self._get_redis()
            value = await r.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        try:
            r = await self._get_redis()
            await r.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            logger.error(f"Redis SET error: {e}")

    async def delete(self, key: str) -> None:
        try:
            r = await self._get_redis()
            await r.delete(key)
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")

    async def clear_pattern(self, pattern: str) -> int:
        try:
            r = await self._get_redis()
            cursor = 0
            deleted = 0
            while True:
                cursor, keys = await r.scan(cursor, match=pattern, count=100)
                if keys:
                    await r.delete(*keys)
                    deleted += len(keys)
                if cursor == 0:
                    break
            return deleted
        except Exception as e:
            logger.error(f"Redis CLEAR error: {e}")
            return 0

    async def close(self) -> None:
        if self._redis:
            await self._redis.close()
            self._redis = None


# Global cache instance
_cache: Optional[CacheBackend] = None


def get_cache() -> CacheBackend:
    """Get the global cache instance."""
    global _cache
    if _cache is None:
        settings = get_settings()
        redis_url = getattr(settings, 'redis_url', None)

        if redis_url:
            logger.info("Using Redis cache backend")
            _cache = RedisCache(redis_url)
        else:
            logger.info("Using in-memory cache backend")
            _cache = InMemoryCache()

    return _cache


async def close_cache() -> None:
    """Close the global cache connection."""
    global _cache
    if _cache:
        await _cache.close()
        _cache = None


def make_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a cache key from prefix and arguments."""
    key_parts = [prefix]

    for arg in args:
        if arg is not None:
            key_parts.append(str(arg))

    for k, v in sorted(kwargs.items()):
        if v is not None:
            key_parts.append(f"{k}={v}")

    key_str = ":".join(key_parts)

    # Hash long keys to avoid issues with key length limits
    if len(key_str) > 200:
        hash_suffix = hashlib.md5(key_str.encode()).hexdigest()[:16]
        key_str = f"{prefix}:hash:{hash_suffix}"

    return key_str


def cached(prefix: str, ttl: int = 300):
    """Decorator to cache function results.

    Args:
        prefix: Cache key prefix (e.g., 'building', 'search')
        ttl: Time to live in seconds (default 5 minutes)

    Example:
        @cached('building', ttl=600)
        async def get_building(bbl: str) -> dict:
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            cache = get_cache()

            # Generate cache key from function arguments
            # Skip 'self' argument if present
            cache_args = args[1:] if args and hasattr(args[0], '__class__') else args
            key = make_cache_key(prefix, *cache_args, **kwargs)

            # Try to get from cache
            cached_value = await cache.get(key)
            if cached_value is not None:
                logger.debug(f"Cache HIT: {key}")
                return cached_value

            logger.debug(f"Cache MISS: {key}")

            # Call the function and cache the result
            result = await func(*args, **kwargs)

            if result is not None:
                await cache.set(key, result, ttl)

            return result

        return wrapper
    return decorator


# Cache TTL constants (in seconds)
class CacheTTL:
    """Standard cache TTL values."""
    SHORT = 60          # 1 minute - for frequently changing data
    MEDIUM = 300        # 5 minutes - default
    LONG = 900          # 15 minutes - for stable data
    VERY_LONG = 3600    # 1 hour - for rarely changing data
    DAILY = 86400       # 24 hours - for static data


# Cache key prefixes
class CacheKeys:
    """Standard cache key prefixes."""
    BUILDING = "building"
    BUILDING_REPORT = "building:report"
    BUILDING_VIOLATIONS = "building:violations"
    SEARCH = "search"
    LEADERBOARD_BUILDINGS = "leaderboard:buildings"
    LEADERBOARD_LANDLORDS = "leaderboard:landlords"
    OWNER = "owner"
