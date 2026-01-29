from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.cached import CachedBuildingService
from app.schemas.building import (
    BuildingSearchResult,
    BuildingReport,
    ViolationsResponse,
    TimelineResponse,
    ViolationItem,
    TimelineEvent,
    RecentViolationsResponse,
    RecentViolationItem,
)

router = APIRouter()


@router.get("/search", response_model=BuildingSearchResult)
async def search_buildings(
    q: str = Query(..., min_length=3, description="Address search query"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Search buildings by address with autocomplete.

    Returns matching buildings with their grades and scores.
    Results are cached for 1 minute.
    """
    service = CachedBuildingService(db)
    results = await service.search_buildings(q, limit=limit)
    return BuildingSearchResult(results=results, query=q)


@router.get("/violations/recent", response_model=RecentViolationsResponse)
async def get_recent_violations(
    limit: int = Query(50, ge=1, le=100),
    violation_class: Optional[str] = Query(
        None, description="Filter by class (A, B, C)"
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get recent HPD violations across all buildings.

    Returns the most recent violations with building info.
    Results are cached for 5 minutes.
    """
    service = CachedBuildingService(db)
    violations = await service.get_recent_violations(
        limit=limit, violation_class=violation_class
    )

    return RecentViolationsResponse(
        items=[RecentViolationItem(**v) for v in violations],
        limit=limit,
    )


@router.get("/{bbl}", response_model=BuildingReport)
async def get_building(
    bbl: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get full building report by BBL (Borough-Block-Lot).

    Returns comprehensive information including:
    - Building details (address, units, year built)
    - Score breakdown and grade
    - Owner information
    - Violation summary
    - Complaint summary
    - Eviction count

    Results are cached for 5 minutes.
    """
    service = CachedBuildingService(db)
    report = await service.get_building_report(bbl)

    if not report:
        raise HTTPException(status_code=404, detail="Building not found")

    return report


@router.get("/{bbl}/violations", response_model=ViolationsResponse)
async def get_building_violations(
    bbl: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, description="Filter by status (e.g., OPEN)"),
    violation_class: Optional[str] = Query(
        None, description="Filter by class (A, B, C)"
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get paginated violations for a building.

    Filter by status or violation class.
    Results are cached for 5 minutes.
    """
    service = CachedBuildingService(db)

    # Check building exists
    building = await service.get_building_by_bbl(bbl)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    # Get total count and violations
    total = await service.get_violations_count(
        bbl,
        status=status,
        violation_class=violation_class,
    )

    violations = await service.get_violations(
        bbl,
        limit=limit,
        offset=offset,
        status=status,
        violation_class=violation_class,
    )

    return ViolationsResponse(
        items=[ViolationItem(**v) for v in violations],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{bbl}/timeline", response_model=TimelineResponse)
async def get_building_timeline(
    bbl: str,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Get combined timeline of events for a building.

    Includes violations, 311 complaints, and evictions in chronological order.
    Results are cached for 5 minutes.
    """
    service = CachedBuildingService(db)

    # Check building exists
    building = await service.get_building_by_bbl(bbl)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    events = await service.get_timeline(bbl, limit=limit)

    return TimelineResponse(
        events=[TimelineEvent(**e) for e in events],
        bbl=bbl,
    )
