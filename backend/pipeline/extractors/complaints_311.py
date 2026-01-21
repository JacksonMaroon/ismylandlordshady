from typing import Any
from datetime import datetime

from app.config import get_settings
from app.models.complaints import Complaint311
from pipeline.extractors.base import BaseExtractor


class Complaints311Extractor(BaseExtractor):
    """Extractor for 311 Complaints dataset (housing-related only)."""

    # Housing-related complaint types to include
    HOUSING_COMPLAINT_TYPES = [
        "HEAT/HOT WATER",
        "HEATING",
        "PLUMBING",
        "WATER SYSTEM",
        "ELECTRIC",
        "ELEVATOR",
        "APPLIANCE",
        "PAINT/PLASTER",
        "FLOORING/STAIRS",
        "DOOR/WINDOW",
        "SAFETY",
        "GENERAL CONSTRUCTION/PLUMBING",
        "UNSANITARY CONDITION",
        "PAINT - Loss OF COVERAGE OR PEELING",
        "WATER LEAK",
        "MOLD",
        "RODENT",
        "PEST",
        "ROACH",
        "VERMIN",
    ]

    @property
    def dataset_id(self) -> str:
        return get_settings().complaints_311_dataset

    @property
    def model_class(self):
        return Complaint311

    @property
    def where_clause(self) -> str:
        """Filter to housing-related complaints."""
        types = ", ".join(f"'{t}'" for t in self.HOUSING_COMPLAINT_TYPES)
        return f"complaint_type IN ({types}) OR agency = 'HPD'"

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform 311 complaint record to model fields."""
        unique_key = self.safe_int(record.get("unique_key"))
        if not unique_key:
            return None

        # Extract BBL if available
        bbl = record.get("bbl")
        if not bbl:
            # Try to construct from components
            borough = self._borough_name_to_id(record.get("borough"))
            # Unfortunately 311 doesn't always have block/lot
            bbl = None

        # Calculate resolution time
        created = self.parse_date(record.get("created_date"))
        closed = self.parse_date(record.get("closed_date"))
        days_to_resolve = None
        if created and closed:
            days_to_resolve = (closed - created).days

        return {
            "unique_key": unique_key,
            "bbl": bbl,
            "created_date": created,
            "closed_date": closed,
            "agency": record.get("agency"),
            "agency_name": record.get("agency_name"),
            "complaint_type": record.get("complaint_type"),
            "descriptor": record.get("descriptor"),
            "location_type": record.get("location_type"),
            "incident_zip": record.get("incident_zip"),
            "incident_address": record.get("incident_address"),
            "street_name": record.get("street_name"),
            "city": record.get("city"),
            "status": record.get("status"),
            "resolution_description": record.get("resolution_description"),
            "resolution_action_updated_date": self.parse_date(
                record.get("resolution_action_updated_date")
            ),
            "borough": record.get("borough"),
            "latitude": record.get("latitude"),
            "longitude": record.get("longitude"),
            "days_to_resolve": days_to_resolve,
        }

    @staticmethod
    def _borough_name_to_id(name: str | None) -> str | None:
        """Convert borough name to ID."""
        if not name:
            return None
        mapping = {
            "MANHATTAN": "1",
            "BRONX": "2",
            "BROOKLYN": "3",
            "QUEENS": "4",
            "STATEN ISLAND": "5",
        }
        return mapping.get(name.upper())
