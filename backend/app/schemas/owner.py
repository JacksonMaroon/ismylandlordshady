from typing import Optional
from pydantic import BaseModel


class OwnerInfo(BaseModel):
    """Basic owner information."""
    name: Optional[str]
    address: Optional[str]
    portfolio_id: Optional[int]
    portfolio_size: Optional[int]
    portfolio_grade: Optional[str]
    is_llc: bool = False


class PortfolioStats(BaseModel):
    """Portfolio statistics."""
    total_buildings: int
    total_units: int
    total_violations: int
    class_c_violations: int
    class_b_violations: int
    class_a_violations: int


class PortfolioBuilding(BaseModel):
    """Building in a portfolio."""
    bbl: str
    address: Optional[str]
    borough: Optional[str]
    units: Optional[int]
    score: Optional[float]
    grade: Optional[str]


class OwnerPortfolio(BaseModel):
    """Full owner portfolio details."""
    id: int
    name: str
    address: Optional[str]
    is_llc: bool
    stats: PortfolioStats
    score: Optional[float]
    grade: Optional[str]
    buildings: list[PortfolioBuilding]
