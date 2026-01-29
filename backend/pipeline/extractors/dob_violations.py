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

    @property
    def order_clause(self) -> str | None:
        """Order by issue date descending to get newest violations first."""
        return "issue_date DESC"

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform DOB violation record to model fields."""
        isn_dob = self._truncate(record.get("isn_dob_bis_viol") or record.get("isn_dob_bis_extract"), 20)
        if not isn_dob:
            return None

        # Build BBL from components
        boro = self._truncate(record.get("boro"), 5)
        block = self._truncate(record.get("block"), 10)
        lot = self._truncate(record.get("lot"), 10)
        bbl = self.make_bbl(boro, block, lot)

        house_number = record.get("respondent_house_number") or record.get("house_number")
        street = record.get("respondent_street") or record.get("street")

        return {
            "isn_dob_bis_viol": isn_dob,
            "bbl": bbl,
            "bin": self._truncate(record.get("bin"), 10),
            "boro": boro,
            "block": block,
            "lot": lot,
            "issue_date": self.parse_date(record.get("issue_date")),
            "violation_type_code": self._truncate(
                record.get("infraction_code1") or record.get("violation_type_code"),
                10,
            ),
            "violation_number": record.get("dob_violation_number") or record.get("violation_number"),
            "house_number": self._truncate(house_number.strip() if isinstance(house_number, str) else house_number, 20),
            "street": street.strip() if isinstance(street, str) else street,
            "disposition_date": self.parse_date(record.get("hearing_date") or record.get("disposition_date")),
            "disposition_comments": record.get("hearing_status") or record.get("ecb_violation_status") or record.get("disposition_comments"),
            "device_number": record.get("device_number"),
            "description": record.get("violation_description") or record.get("section_law_description1") or record.get("description"),
            "ecb_number": self._truncate(record.get("ecb_violation_number") or record.get("ecb_number"), 50),
            "number": self._truncate(record.get("dob_violation_number") or record.get("number"), 20),
            "violation_category": record.get("severity") or record.get("violation_category"),
            "violation_type": record.get("violation_type"),
        }

    @staticmethod
    def _truncate(value: Any, max_len: int) -> str | None:
        if value is None:
            return None
        text = str(value)
        return text if len(text) <= max_len else text[:max_len]
