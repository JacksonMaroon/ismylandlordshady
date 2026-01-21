from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.cached import CachedLeaderboardService
from app.schemas.leaderboard import (
    LeaderboardBuilding,
    LeaderboardLandlord,
    BuildingsLeaderboardResponse,
    LandlordsLeaderboardResponse,
)

router = APIRouter()


@router.get("/worst-buildings", response_model=BuildingsLeaderboardResponse)
async def get_worst_buildings(
    borough: Optional[str] = Query(
        None,
        description="Filter by borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)",
    ),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get worst buildings ranked by overall score.

    Higher scores indicate worse conditions. Can filter by borough.
    Returns paginated results with total count.
    Results are cached for 15 minutes.
    """
    service = CachedLeaderboardService(db)

    total = await service.get_worst_buildings_count(borough=borough)
    buildings = await service.get_worst_buildings(
        borough=borough,
        limit=limit,
        offset=offset,
    )

    return BuildingsLeaderboardResponse(
        items=[LeaderboardBuilding(**b) for b in buildings],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/worst-landlords", response_model=LandlordsLeaderboardResponse)
async def get_worst_landlords(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get worst landlords ranked by portfolio score.

    Only includes landlords with more than one building.
    Higher scores indicate worse conditions across their portfolio.
    Returns paginated results with total count.
    Results are cached for 15 minutes.
    """
    service = CachedLeaderboardService(db)

    total = await service.get_worst_landlords_count()
    landlords = await service.get_worst_landlords(
        limit=limit,
        offset=offset,
    )

    return LandlordsLeaderboardResponse(
        items=[LeaderboardLandlord(**l) for l in landlords],
        total=total,
        offset=offset,
        limit=limit,
    )
