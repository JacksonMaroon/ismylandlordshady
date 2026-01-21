from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.cached import CachedOwnerService
from app.schemas.owner import OwnerPortfolio

router = APIRouter()


@router.get("/{portfolio_id}", response_model=OwnerPortfolio)
async def get_owner_portfolio(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get owner portfolio details by ID.

    Returns:
    - Owner name and address
    - Portfolio statistics (buildings, units, violations)
    - Portfolio score and grade
    - List of buildings in portfolio

    Results are cached for 5 minutes.
    """
    service = CachedOwnerService(db)
    portfolio = await service.get_portfolio(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    return portfolio
