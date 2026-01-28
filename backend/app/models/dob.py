from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class DOBViolation(Base):
    __tablename__ = "dob_violations"

    isn_dob_bis_viol = Column(String(50), primary_key=True)
    bbl = Column(String(10))
    bin = Column(String(10))
    boro = Column(String(5))
    block = Column(String(10))
    lot = Column(String(10))
    issue_date = Column(Date)
    violation_type_code = Column(String(10))
    violation_number = Column(String(50))
    house_number = Column(String(50))
    street = Column(String(100))
    disposition_date = Column(Date)
    disposition_comments = Column(Text)
    device_number = Column(String(50))
    description = Column(Text)
    ecb_number = Column(String(50))
    number = Column(String(50))
    violation_category = Column(String(100))
    violation_type = Column(String(100))

    created_at = Column(DateTime, default=datetime.utcnow)

    # No ORM relationships - BBL field used for explicit joins

    __table_args__ = (
        Index("idx_dob_violations_bbl", "bbl"),
        Index("idx_dob_violations_issue_date", "issue_date"),
        Index("idx_dob_violations_type", "violation_type"),
    )
