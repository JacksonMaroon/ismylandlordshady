from typing import Any

from app.config import get_settings
from app.models.dob import DOBViolation
from pipeline.extractors.base import BaseExtractor


class DOBViolationsExtractor(BaseExtractor):
    """Extractor for DOB Violations dataset."""

    @property
    def dataset_id(self) -> str:
        return get_settings().dob_violations_dataset

    @property
    def model_class(self):
        return DOBViolation

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform DOB violation record to model fields."""
        isn_dob = record.get("isn_dob_bis_viol")
        if not isn_dob:
            return None

        # Build BBL from components
        boro = record.get("boro")
        block = record.get("block")
        lot = record.get("lot")
        bbl = self.make_bbl(boro, block, lot)

        return {
            "isn_dob_bis_viol": isn_dob,
            "bbl": bbl,
            "bin": record.get("bin"),
            "boro": boro,
            "block": block,
            "lot": lot,
            "issue_date": self.parse_date(record.get("issue_date")),
            "violation_type_code": record.get("violation_type_code"),
            "violation_number": record.get("violation_number"),
            "house_number": record.get("house_number"),
            "street": record.get("street"),
            "disposition_date": self.parse_date(record.get("disposition_date")),
            "disposition_comments": record.get("disposition_comments"),
            "device_number": record.get("device_number"),
            "description": record.get("description"),
            "ecb_number": record.get("ecb_number"),
            "number": record.get("number"),
            "violation_category": record.get("violation_category"),
            "violation_type": record.get("violation_type"),
        }
