from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Eviction(Base):
    __tablename__ = "evictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    court_index_number = Column(String(50), unique=True)
    docket_number = Column(String(50))
    bbl = Column(String(10), ForeignKey("buildings.bbl"))
    eviction_address = Column(String(200))
    apt_seal = Column(String(50))
    executed_date = Column(Date)
    marshal_first_name = Column(String(100))
    marshal_last_name = Column(String(100))
    residential_commercial = Column(String(20))
    borough = Column(String(50))
    ejectment = Column(String(10))
    eviction_zip = Column(String(20))
    scheduled_status = Column(String(50))
    latitude = Column(String(50))
    longitude = Column(String(50))

    created_at = Column(DateTime, default=datetime.utcnow)

    # No ORM relationships - BBL field used for explicit joins

    __table_args__ = (
        Index("idx_evictions_bbl", "bbl"),
        Index("idx_evictions_executed_date", "executed_date"),
    )
