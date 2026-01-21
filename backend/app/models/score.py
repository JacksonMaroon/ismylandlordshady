from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class BuildingScore(Base):
    __tablename__ = "building_scores"

    bbl = Column(String(10), ForeignKey("buildings.bbl"), primary_key=True)

    # Component scores (0-100 scale, higher is worse)
    violation_score = Column(Float, default=0)
    complaints_score = Column(Float, default=0)
    eviction_score = Column(Float, default=0)
    ownership_score = Column(Float, default=0)
    resolution_score = Column(Float, default=0)

    # Overall score and grade
    overall_score = Column(Float, default=0)
    grade = Column(String(2))  # A, B, C, D, F

    # Raw counts for display
    total_violations = Column(Integer, default=0)
    class_c_violations = Column(Integer, default=0)
    class_b_violations = Column(Integer, default=0)
    class_a_violations = Column(Integer, default=0)
    open_violations = Column(Integer, default=0)
    total_complaints = Column(Integer, default=0)
    total_evictions = Column(Integer, default=0)
    avg_resolution_days = Column(Float)

    # Comparison metrics
    violations_per_unit = Column(Float, default=0)
    complaints_per_unit = Column(Float, default=0)
    evictions_per_unit = Column(Float, default=0)

    # Borough/city comparisons
    percentile_borough = Column(Float)
    percentile_city = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    building = relationship("Building", back_populates="score")

    __table_args__ = (
        Index("idx_building_scores_grade", "grade"),
        Index("idx_building_scores_overall", "overall_score"),
    )
