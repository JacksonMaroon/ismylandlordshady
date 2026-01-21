"""Tests for the caching module."""

import asyncio
import pytest

from app.cache import InMemoryCache, make_cache_key, CacheTTL


@pytest.mark.asyncio
async def test_inmemory_cache_set_get():
    """Test basic set and get operations."""
    cache = InMemoryCache()

    await cache.set("test_key", {"value": 123}, ttl=60)
    result = await cache.get("test_key")

    assert result == {"value": 123}


@pytest.mark.asyncio
async def test_inmemory_cache_get_nonexistent():
    """Test get returns None for non-existent key."""
    cache = InMemoryCache()

    result = await cache.get("nonexistent")

    assert result is None


@pytest.mark.asyncio
async def test_inmemory_cache_delete():
    """Test delete removes key."""
    cache = InMemoryCache()

    await cache.set("test_key", "value", ttl=60)
    await cache.delete("test_key")
    result = await cache.get("test_key")

    assert result is None


@pytest.mark.asyncio
async def test_inmemory_cache_ttl_expiration():
    """Test values expire after TTL."""
    cache = InMemoryCache()

    await cache.set("test_key", "value", ttl=1)  # 1 second TTL

    # Should exist immediately
    result = await cache.get("test_key")
    assert result == "value"

    # Wait for expiration
    await asyncio.sleep(1.1)

    # Should be expired
    result = await cache.get("test_key")
    assert result is None


@pytest.mark.asyncio
async def test_inmemory_cache_clear_pattern():
    """Test clear_pattern removes matching keys."""
    cache = InMemoryCache()

    await cache.set("building:123:report", "report1", ttl=60)
    await cache.set("building:123:violations", "violations1", ttl=60)
    await cache.set("building:456:report", "report2", ttl=60)
    await cache.set("owner:1", "owner1", ttl=60)

    deleted = await cache.clear_pattern("building:123:*")

    assert deleted == 2
    assert await cache.get("building:123:report") is None
    assert await cache.get("building:123:violations") is None
    assert await cache.get("building:456:report") is not None
    assert await cache.get("owner:1") is not None


@pytest.mark.asyncio
async def test_inmemory_cache_max_size_eviction():
    """Test cache evicts entries when at max size."""
    cache = InMemoryCache(max_size=5)

    # Fill cache to capacity
    for i in range(5):
        await cache.set(f"key{i}", f"value{i}", ttl=60)

    # Add one more - should trigger eviction
    await cache.set("key5", "value5", ttl=60)

    # Newest key should exist
    assert await cache.get("key5") is not None


@pytest.mark.asyncio
async def test_inmemory_cache_close():
    """Test close clears the cache."""
    cache = InMemoryCache()

    await cache.set("test_key", "value", ttl=60)
    await cache.close()
    result = await cache.get("test_key")

    assert result is None


def test_make_cache_key_simple():
    """Test cache key generation with simple arguments."""
    key = make_cache_key("building", "123")

    assert key == "building:123"


def test_make_cache_key_with_kwargs():
    """Test cache key generation with keyword arguments."""
    key = make_cache_key("search", "broadway", limit=10, offset=0)

    assert "search" in key
    assert "broadway" in key
    assert "limit=10" in key
    assert "offset=0" in key


def test_make_cache_key_ignores_none():
    """Test cache key generation ignores None values."""
    key = make_cache_key("violations", "123", status=None, violation_class="C")

    assert "status" not in key
    assert "violation_class=C" in key


def test_make_cache_key_hashes_long_keys():
    """Test long keys are hashed."""
    long_arg = "a" * 300
    key = make_cache_key("test", long_arg)

    assert len(key) < 250
    assert "hash:" in key


def test_cache_ttl_constants():
    """Test cache TTL constants have expected values."""
    assert CacheTTL.SHORT == 60
    assert CacheTTL.MEDIUM == 300
    assert CacheTTL.LONG == 900
    assert CacheTTL.VERY_LONG == 3600
    assert CacheTTL.DAILY == 86400


@pytest.mark.asyncio
async def test_cache_complex_values():
    """Test caching complex nested data structures."""
    cache = InMemoryCache()

    complex_value = {
        "list": [1, 2, 3],
        "nested": {"a": "b", "c": [4, 5]},
        "number": 42.5,
        "bool": True,
        "none": None,
    }

    await cache.set("complex", complex_value, ttl=60)
    result = await cache.get("complex")

    assert result == complex_value


@pytest.mark.asyncio
async def test_cache_concurrent_access():
    """Test cache handles concurrent access correctly."""
    cache = InMemoryCache()

    async def set_value(key: str, value: str):
        await cache.set(key, value, ttl=60)
        return await cache.get(key)

    # Run multiple concurrent operations
    tasks = [set_value(f"key{i}", f"value{i}") for i in range(100)]
    results = await asyncio.gather(*tasks)

    # All operations should succeed
    for i, result in enumerate(results):
        assert result == f"value{i}"
