from sqlalchemy import Column, String, Integer, Float, DateTime, Index
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
from app.database import Base


class Building(Base):
    __tablename__ = "buildings"

    bbl = Column(String(10), primary_key=True)  # Borough-Block-Lot
    borough = Column(String(20), nullable=False)
    block = Column(Integer, nullable=False)
    lot = Column(Integer, nullable=False)
    house_number = Column(String(20))
    street_name = Column(String(100))
    full_address = Column(String(200))
    zip_code = Column(String(10))
    total_units = Column(Integer, default=0)
    residential_units = Column(Integer, default=0)
    year_built = Column(Integer)
    building_class = Column(String(10))
    latitude = Column(Float)
    longitude = Column(Float)
    geom = Column(Geometry("POINT", srid=4326))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships - Only keep relationships where FK exists
    # Note: HPDRegistration, HPDViolation, Complaint311 FKs were removed for flexible loading
    # Use explicit queries instead of ORM relationships for those
    score = relationship("BuildingScore", back_populates="building", uselist=False)

    __table_args__ = (
        Index("idx_buildings_address", "full_address"),
        Index("idx_buildings_borough_block", "borough", "block"),
    )

    def __repr__(self):
        return f"<Building(bbl={self.bbl}, address={self.full_address})>"
