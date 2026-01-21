"""Tests for owner/portfolio API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.owner import OwnerPortfolio


@pytest.mark.asyncio
async def test_get_owner_portfolio_not_found(client: AsyncClient):
    """Test get portfolio returns 404 for non-existent ID."""
    response = await client.get("/api/v1/owners/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Portfolio not found"


@pytest.mark.asyncio
async def test_get_owner_portfolio_success(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_portfolio_data: dict,
):
    """Test get portfolio returns portfolio details."""
    portfolio = OwnerPortfolio(**sample_portfolio_data)
    db_session.add(portfolio)
    await db_session.commit()

    response = await client.get(f"/api/v1/owners/{sample_portfolio_data['id']}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_portfolio_data["id"]
    assert data["name"] == sample_portfolio_data["primary_name"]
    assert data["grade"] == sample_portfolio_data["portfolio_grade"]
    assert data["score"] == sample_portfolio_data["portfolio_score"]


@pytest.mark.asyncio
async def test_get_owner_portfolio_stats(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_portfolio_data: dict,
):
    """Test get portfolio includes statistics."""
    portfolio = OwnerPortfolio(**sample_portfolio_data)
    db_session.add(portfolio)
    await db_session.commit()

    response = await client.get(f"/api/v1/owners/{sample_portfolio_data['id']}")

    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert data["stats"]["total_buildings"] == sample_portfolio_data["total_buildings"]
    assert data["stats"]["total_units"] == sample_portfolio_data["total_units"]
    assert data["stats"]["total_violations"] == sample_portfolio_data["total_violations"]
    assert data["stats"]["class_c_violations"] == sample_portfolio_data["class_c_violations"]


@pytest.mark.asyncio
async def test_get_owner_portfolio_is_llc_flag(
    client: AsyncClient,
    db_session: AsyncSession,
    sample_portfolio_data: dict,
):
    """Test get portfolio includes LLC flag."""
    portfolio = OwnerPortfolio(**sample_portfolio_data)
    db_session.add(portfolio)
    await db_session.commit()

    response = await client.get(f"/api/v1/owners/{sample_portfolio_data['id']}")

    assert response.status_code == 200
    data = response.json()
    assert data["is_llc"] == bool(sample_portfolio_data["is_llc"])
