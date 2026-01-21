from sqlalchemy import Column, String, Integer, DateTime, Float, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class OwnerPortfolio(Base):
    __tablename__ = "owner_portfolios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    primary_name = Column(String(300), nullable=False)
    normalized_name = Column(String(300))
    name_hash = Column(String(32), unique=True)
    primary_address = Column(Text)
    normalized_address = Column(Text)

    # Portfolio statistics
    total_buildings = Column(Integer, default=0)
    total_units = Column(Integer, default=0)
    total_violations = Column(Integer, default=0)
    total_complaints = Column(Integer, default=0)
    total_evictions = Column(Integer, default=0)
    class_c_violations = Column(Integer, default=0)
    class_b_violations = Column(Integer, default=0)
    class_a_violations = Column(Integer, default=0)

    # Scoring
    portfolio_score = Column(Float)
    portfolio_grade = Column(String(2))

    # Flags
    is_llc = Column(Integer, default=0)  # 1 if owner uses LLC structure

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contacts = relationship("RegistrationContact", back_populates="portfolio")

    __table_args__ = (
        Index("idx_owner_portfolios_name_hash", "name_hash"),
        Index("idx_owner_portfolios_score", "portfolio_score"),
    )

    def __repr__(self):
        return f"<OwnerPortfolio(id={self.id}, name={self.primary_name}, buildings={self.total_buildings})>"
