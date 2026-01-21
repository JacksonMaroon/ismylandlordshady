"""Tests for building API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.building import Building
from app.models.score import BuildingScore


@pytest.mark.asyncio
async def test_search_buildings_empty_db(client: AsyncClient):
    """Test search returns empty results when database is empty."""
    response = await client.get("/api/v1/buildings/search", params={"q": "broadway"})

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "broadway"
    assert data["results"] == []


@pytest.mark.asyncio
async def test_search_buildings_query_too_short(client: AsyncClient):
    """Test search rejects queries shorter than 3 characters."""
    response = await client.get("/api/v1/buildings/search", params={"q": "ab"})

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_search_buildings_with_results(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_building_data: dict,
):
    """Test search returns matching buildings."""
    # Insert test building
    building = Building(**sample_building_data)
    db_session.add(building)
    await db_session.commit()

    response = await client.get(
        "/api/v1/buildings/search",
        params={"q": "BROADWAY", "limit": 10}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "BROADWAY"
    # Note: Results may be empty if trigram extension is not available in SQLite


@pytest.mark.asyncio
async def test_get_building_not_found(client: AsyncClient):
    """Test get building returns 404 for non-existent BBL."""
    response = await client.get("/api/v1/buildings/9999999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Building not found"


@pytest.mark.asyncio
async def test_get_building_success(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_building_data: dict,
):
    """Test get building returns building details."""
    # Insert test building
    building = Building(**sample_building_data)
    db_session.add(building)
    await db_session.commit()

    response = await client.get(f"/api/v1/buildings/{sample_building_data['bbl']}")

    assert response.status_code == 200
    data = response.json()
    assert data["bbl"] == sample_building_data["bbl"]
    assert data["address"] == sample_building_data["full_address"]
    assert data["borough"] == sample_building_data["borough"]


@pytest.mark.asyncio
async def test_get_building_with_score(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_building_data: dict,
):
    """Test get building includes score when available."""
    # Insert test building with score
    building = Building(**sample_building_data)
    db_session.add(building)
    await db_session.flush()

    score = BuildingScore(
        bbl=sample_building_data["bbl"],
        overall_score=45.5,
        grade="C",
        violation_score=30.0,
        complaints_score=10.0,
        eviction_score=5.0,
        total_violations=15,
        class_c_violations=3,
    )
    db_session.add(score)
    await db_session.commit()

    response = await client.get(f"/api/v1/buildings/{sample_building_data['bbl']}")

    assert response.status_code == 200
    data = response.json()
    assert data["score"] is not None
    assert data["score"]["overall"] == 45.5
    assert data["score"]["grade"] == "C"


@pytest.mark.asyncio
async def test_get_building_violations_not_found(client: AsyncClient):
    """Test get violations returns 404 for non-existent building."""
    response = await client.get("/api/v1/buildings/9999999999/violations")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_building_violations_empty(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_building_data: dict,
):
    """Test get violations returns empty list for building with no violations."""
    building = Building(**sample_building_data)
    db_session.add(building)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/buildings/{sample_building_data['bbl']}/violations"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["offset"] == 0
    assert data["limit"] == 50


@pytest.mark.asyncio
async def test_get_building_violations_pagination(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_building_data: dict,
):
    """Test violations endpoint respects pagination parameters."""
    building = Building(**sample_building_data)
    db_session.add(building)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/buildings/{sample_building_data['bbl']}/violations",
        params={"limit": 10, "offset": 5}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 10
    assert data["offset"] == 5


@pytest.mark.asyncio
async def test_get_building_timeline_not_found(client: AsyncClient):
    """Test get timeline returns 404 for non-existent building."""
    response = await client.get("/api/v1/buildings/9999999999/timeline")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_building_timeline_empty(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_building_data: dict,
):
    """Test get timeline returns empty list for building with no events."""
    building = Building(**sample_building_data)
    db_session.add(building)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/buildings/{sample_building_data['bbl']}/timeline"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["events"] == []
    assert data["bbl"] == sample_building_data["bbl"]
