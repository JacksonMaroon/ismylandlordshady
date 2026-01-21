from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class HPDRegistration(Base):
    __tablename__ = "hpd_registrations"

    registration_id = Column(Integer, primary_key=True)
    bbl = Column(String(10), nullable=False, index=True)  # No FK - allows loading without all buildings
    building_id = Column(Integer)
    bin = Column(String(10))
    house_number = Column(String(20))
    street_name = Column(String(100))
    borough = Column(String(20))
    zip_code = Column(String(10))
    block = Column(Integer)
    lot = Column(Integer)
    last_registration_date = Column(Date)
    registration_end_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    contacts = relationship("RegistrationContact", back_populates="registration")

    __table_args__ = (
        Index("idx_hpd_registrations_bbl", "bbl"),
    )


class RegistrationContact(Base):
    __tablename__ = "registration_contacts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    registration_id = Column(Integer, ForeignKey("hpd_registrations.registration_id"), nullable=False)
    contact_type = Column(String(50))  # Owner, Agent, etc.
    contact_description = Column(String(100))
    corporation_name = Column(String(200))
    first_name = Column(String(100))
    middle_initial = Column(String(10))
    last_name = Column(String(100))
    full_name = Column(String(300))
    business_address = Column(Text)
    business_city = Column(String(100))
    business_state = Column(String(50))
    business_zip = Column(String(20))

    # Entity resolution fields
    normalized_name = Column(String(300))
    normalized_address = Column(Text)
    name_hash = Column(String(32), index=True)
    owner_portfolio_id = Column(Integer, ForeignKey("owner_portfolios.id"))

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    registration = relationship("HPDRegistration", back_populates="contacts")
    portfolio = relationship("OwnerPortfolio", back_populates="contacts")

    __table_args__ = (
        Index("idx_registration_contacts_registration_id", "registration_id"),
        Index("idx_registration_contacts_normalized_name", "normalized_name"),
        Index("idx_registration_contacts_name_hash", "name_hash"),
        UniqueConstraint("registration_id", "contact_type", "full_name", name="uq_registration_contacts_natural_key"),
    )


class HPDViolation(Base):
    __tablename__ = "hpd_violations"

    violation_id = Column(Integer, primary_key=True)
    bbl = Column(String(10), nullable=False, index=True)  # No FK - allows loading without all buildings
    building_id = Column(Integer)
    registration_id = Column(Integer)
    apartment = Column(String(20))
    story = Column(String(20))
    inspection_date = Column(Date)
    approved_date = Column(Date)
    original_certify_by_date = Column(Date)
    original_correct_by_date = Column(Date)
    new_certify_by_date = Column(Date)
    new_correct_by_date = Column(Date)
    certified_date = Column(Date)
    order_number = Column(String(50))
    novid = Column(Integer)
    nov_description = Column(Text)
    nov_issued_date = Column(Date)
    current_status = Column(String(50))
    current_status_date = Column(Date)
    nov_type = Column(String(50))
    violation_status = Column(String(50))
    violation_class = Column(String(5))  # A, B, C

    created_at = Column(DateTime, default=datetime.utcnow)

    # No ORM relationships - BBL field used for explicit joins

    __table_args__ = (
        Index("idx_hpd_violations_bbl", "bbl"),
        Index("idx_hpd_violations_class", "violation_class"),
        Index("idx_hpd_violations_inspection_date", "inspection_date"),
        Index("idx_hpd_violations_status", "current_status"),
    )
