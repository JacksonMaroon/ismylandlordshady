from typing import Any

from app.config import get_settings
from app.models.hpd import HPDViolation
from pipeline.extractors.base import BaseExtractor


class HPDViolationsExtractor(BaseExtractor):
    """Extractor for HPD Violations dataset."""

    @property
    def dataset_id(self) -> str:
        return get_settings().hpd_violations_dataset

    @property
    def model_class(self):
        return HPDViolation

    @property
    def order_clause(self) -> str | None:
        """Order by inspection date descending to get newest violations first."""
        return "inspectiondate DESC"

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform HPD violation record to model fields."""
        violation_id = self.safe_int(record.get("violationid"))
        if not violation_id:
            return None

        # Build BBL from components
        borough = record.get("boroid") or record.get("boro")
        block = record.get("block")
        lot = record.get("lot")
        bbl = self.make_bbl(borough, block, lot)

        if not bbl:
            return None

        return {
            "violation_id": violation_id,
            "bbl": bbl,
            "building_id": self.safe_int(record.get("buildingid")),
            "registration_id": self.safe_int(record.get("registrationid")),
            "apartment": record.get("apartment"),
            "story": record.get("story"),
            "inspection_date": self.parse_date(record.get("inspectiondate")),
            "approved_date": self.parse_date(record.get("approveddate")),
            "original_certify_by_date": self.parse_date(record.get("originalcertifybydate")),
            "original_correct_by_date": self.parse_date(record.get("originalcorrectbydate")),
            "new_certify_by_date": self.parse_date(record.get("newcertifybydate")),
            "new_correct_by_date": self.parse_date(record.get("newcorrectbydate")),
            "certified_date": self.parse_date(record.get("certifieddate")),
            "order_number": record.get("ordernumber"),
            "novid": self.safe_int(record.get("novid")),
            "nov_description": record.get("novdescription"),
            "nov_issued_date": self.parse_date(record.get("novissueddate")),
            "current_status": record.get("currentstatus"),
            "current_status_date": self.parse_date(record.get("currentstatusdate")),
            "nov_type": record.get("novtype"),
            "violation_status": record.get("violationstatus"),
            "violation_class": record.get("class"),
        }
