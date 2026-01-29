from typing import Optional
from pydantic import BaseModel


class LeaderboardBuilding(BaseModel):
    """Building in leaderboard."""
    bbl: str
    address: Optional[str]
    borough: Optional[str]
    zip_code: Optional[str]
    units: Optional[int]
    score: float
    grade: str
    violations: int
    class_c: int
    complaints: int
    evictions: int


class LeaderboardLandlord(BaseModel):
    """Landlord in leaderboard."""
    id: int
    name: str
    buildings: int
    units: int
    violations: int
    class_c: int
    score: float
    grade: str
    is_llc: bool


class BuildingsLeaderboardResponse(BaseModel):
    """Paginated buildings leaderboard response."""
    items: list[LeaderboardBuilding]
    total: int
    offset: int
    limit: int


class LandlordsLeaderboardResponse(BaseModel):
    """Paginated landlords leaderboard response."""
    items: list[LeaderboardLandlord]
    total: int
    offset: int
    limit: int
