"""Tests for health and root endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test the root endpoint returns API info."""
    response = await client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "IsMyLandlordShady.nyc API"
    assert data["version"] == "1.0.0"
    assert data["docs"] == "/docs"


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Test the health check endpoint."""
    response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
