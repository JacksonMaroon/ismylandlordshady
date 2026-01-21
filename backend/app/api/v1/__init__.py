from fastapi import APIRouter

from app.api.v1 import buildings, owners, leaderboards

router = APIRouter(prefix="/api/v1")

router.include_router(buildings.router, prefix="/buildings", tags=["buildings"])
router.include_router(owners.router, prefix="/owners", tags=["owners"])
router.include_router(leaderboards.router, prefix="/leaderboards", tags=["leaderboards"])
