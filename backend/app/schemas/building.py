from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class BuildingSearch(BaseModel):
    """Search result item for address autocomplete."""
    bbl: str
    address: Optional[str]
    borough: Optional[str]
    units: Optional[int]
    grade: Optional[str]
    score: Optional[float]


class BuildingSearchResult(BaseModel):
    """Wrapper for search results."""
    results: list[BuildingSearch]
    query: str


class BuildingScore(BaseModel):
    """Building score breakdown."""
    overall: Optional[float]
    grade: Optional[str]
    violation_score: Optional[float]
    complaints_score: Optional[float]
    eviction_score: Optional[float]
    ownership_score: Optional[float]
    resolution_score: Optional[float]
    percentile_city: Optional[float]
    percentile_borough: Optional[float]


class ViolationSummary(BaseModel):
    """Summary of violations by class."""
    total: int
    open: int
    by_class: dict[str, int]


class ComplaintSummary(BaseModel):
    """Summary of 311 complaints."""
    total: int
    last_year: int
    by_type: list[dict]


class EvictionSummary(BaseModel):
    """Summary of evictions."""
    total: int


class OwnerInfo(BaseModel):
    """Basic owner information."""
    name: Optional[str]
    address: Optional[str]
    portfolio_id: Optional[int]
    portfolio_size: Optional[int]
    portfolio_grade: Optional[str]
    is_llc: bool = False


class ViolationItem(BaseModel):
    """Single violation record."""
    id: int
    violation_class: Optional[str] = None
    status: Optional[str]
    inspection_date: Optional[str]
    description: Optional[str]
    apartment: Optional[str]
    story: Optional[str]

    class Config:
        populate_by_name = True


class BuildingReport(BaseModel):
    """Full building report."""
    bbl: str
    address: Optional[str]
    borough: Optional[str]
    zip_code: Optional[str]
    total_units: Optional[int]
    residential_units: Optional[int]
    year_built: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    score: Optional[BuildingScore]
    owner: Optional[OwnerInfo]
    violations: ViolationSummary
    recent_violations: list[dict]
    complaints: ComplaintSummary
    evictions: EvictionSummary


class TimelineEvent(BaseModel):
    """Event in building timeline."""
    type: str  # violation, complaint, eviction
    date: Optional[str]
    severity: Optional[str]
    description: Optional[str]
    status: Optional[str]


class ViolationsResponse(BaseModel):
    """Paginated violations response."""
    items: list[ViolationItem]
    total: int
    offset: int
    limit: int


class TimelineResponse(BaseModel):
    """Timeline response."""
    events: list[TimelineEvent]
    bbl: str


class RecentViolationItem(BaseModel):
    """Recent violation with building info."""
    id: int
    violation_class: Optional[str] = None
    status: Optional[str]
    inspection_date: Optional[str]
    description: Optional[str]
    apartment: Optional[str]
    story: Optional[str]
    bbl: str
    address: Optional[str]
    borough: Optional[str]

    class Config:
        populate_by_name = True


class RecentViolationsResponse(BaseModel):
    """Recent violations response."""
    items: list[RecentViolationItem]
    limit: int
