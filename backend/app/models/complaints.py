from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Complaint311(Base):
    __tablename__ = "complaints_311"

    unique_key = Column(Integer, primary_key=True)
    bbl = Column(String(10))  # Removed FK to allow loading without buildings
    created_date = Column(DateTime)
    closed_date = Column(DateTime)
    agency = Column(String(20))
    agency_name = Column(String(100))
    complaint_type = Column(String(100))
    descriptor = Column(String(200))
    location_type = Column(String(100))
    incident_zip = Column(String(20))
    incident_address = Column(String(200))
    street_name = Column(String(100))
    city = Column(String(100))
    status = Column(String(50))
    resolution_description = Column(Text)
    resolution_action_updated_date = Column(DateTime)
    borough = Column(String(50))
    latitude = Column(String(50))
    longitude = Column(String(50))

    # Computed fields
    days_to_resolve = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)

    # No ORM relationships - BBL field used for explicit joins

    __table_args__ = (
        Index("idx_complaints_311_bbl", "bbl"),
        Index("idx_complaints_311_complaint_type", "complaint_type"),
        Index("idx_complaints_311_created_date", "created_date"),
    )
