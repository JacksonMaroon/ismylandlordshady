"""Tests for leaderboard API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.building import Building
from app.models.score import BuildingScore
from app.models.owner import OwnerPortfolio


@pytest.mark.asyncio
async def test_get_worst_buildings_empty(client: AsyncClient):
    """Test worst buildings returns empty when no data."""
    response = await client.get("/api/v1/leaderboards/worst-buildings")

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["offset"] == 0
    assert data["limit"] == 100


@pytest.mark.asyncio
async def test_get_worst_buildings_pagination(client: AsyncClient):
    """Test worst buildings respects pagination params."""
    response = await client.get(
        "/api/v1/leaderboards/worst-buildings",
        params={"limit": 50, "offset": 10}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 50
    assert data["offset"] == 10


@pytest.mark.asyncio
async def test_get_worst_buildings_with_data(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_building_data: dict,
):
    """Test worst buildings returns ranked buildings."""
    # Create buildings with scores
    for i in range(3):
        building_data = sample_building_data.copy()
        building_data["bbl"] = f"100001000{i}"
        building_data["full_address"] = f"{i} BROADWAY, MANHATTAN"

        building = Building(**building_data)
        db_session.add(building)
        await db_session.flush()

        score = BuildingScore(
            bbl=building_data["bbl"],
            overall_score=50.0 + i * 10,
            grade="D" if i == 2 else "C",
            total_violations=10 + i * 5,
            class_c_violations=2 + i,
            total_complaints=5 + i,
            total_evictions=i,
        )
        db_session.add(score)

    await db_session.commit()

    response = await client.get("/api/v1/leaderboards/worst-buildings")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3
    # Should be sorted by score descending (worst first)
    assert data["items"][0]["score"] >= data["items"][1]["score"]


@pytest.mark.asyncio
async def test_get_worst_buildings_borough_filter(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Test worst buildings can filter by borough."""
    # Create buildings in different boroughs
    boroughs = ["Manhattan", "Brooklyn", "Queens"]
    for i, borough in enumerate(boroughs):
        building = Building(
            bbl=f"100001000{i}",
            borough=borough,
            block=1,
            lot=i,
            full_address=f"1 MAIN ST, {borough.upper()}",
        )
        db_session.add(building)
        await db_session.flush()

        score = BuildingScore(
            bbl=building.bbl,
            overall_score=50.0,
            grade="C",
            total_violations=10,
            class_c_violations=2,
            total_complaints=5,
            total_evictions=1,
        )
        db_session.add(score)

    await db_session.commit()

    response = await client.get(
        "/api/v1/leaderboards/worst-buildings",
        params={"borough": "Manhattan"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["borough"] == "Manhattan"


@pytest.mark.asyncio
async def test_get_worst_landlords_empty(client: AsyncClient):
    """Test worst landlords returns empty when no data."""
    response = await client.get("/api/v1/leaderboards/worst-landlords")

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_worst_landlords_pagination(client: AsyncClient):
    """Test worst landlords respects pagination params."""
    response = await client.get(
        "/api/v1/leaderboards/worst-landlords",
        params={"limit": 25, "offset": 5}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 25
    assert data["offset"] == 5


@pytest.mark.asyncio
async def test_get_worst_landlords_with_data(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_portfolio_data: dict,
):
    """Test worst landlords returns ranked landlords."""
    # Create portfolios with scores (only those with > 1 building)
    for i in range(3):
        portfolio_data = sample_portfolio_data.copy()
        portfolio_data["id"] = i + 1
        portfolio_data["name_hash"] = f"hash{i}"
        portfolio_data["primary_name"] = f"LANDLORD {i} LLC"
        portfolio_data["total_buildings"] = 5 + i  # All have > 1 building
        portfolio_data["portfolio_score"] = 60.0 + i * 10

        portfolio = OwnerPortfolio(**portfolio_data)
        db_session.add(portfolio)

    await db_session.commit()

    response = await client.get("/api/v1/leaderboards/worst-landlords")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3
    # Should be sorted by score descending
    assert data["items"][0]["score"] >= data["items"][1]["score"]


@pytest.mark.asyncio
async def test_get_worst_landlords_excludes_single_building(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_portfolio_data: dict,
):
    """Test worst landlords excludes owners with only one building."""
    # Create portfolio with only 1 building
    portfolio_data = sample_portfolio_data.copy()
    portfolio_data["total_buildings"] = 1  # Should be excluded

    portfolio = OwnerPortfolio(**portfolio_data)
    db_session.add(portfolio)
    await db_session.commit()

    response = await client.get("/api/v1/leaderboards/worst-landlords")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
