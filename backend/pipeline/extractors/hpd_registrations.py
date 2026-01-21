import hashlib
import re
from typing import Any

from app.config import get_settings
from app.models.hpd import HPDRegistration, RegistrationContact
from app.models.building import Building
from pipeline.extractors.base import BaseExtractor


class HPDRegistrationsExtractor(BaseExtractor):
    """Extractor for HPD Registrations dataset."""

    @property
    def dataset_id(self) -> str:
        return get_settings().hpd_registrations_dataset

    @property
    def model_class(self):
        return HPDRegistration

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform HPD registration record to model fields."""
        registration_id = self.safe_int(record.get("registrationid"))
        if not registration_id:
            return None

        # Build BBL
        borough = record.get("boroid") or record.get("boro")
        block = record.get("block")
        lot = record.get("lot")
        bbl = self.make_bbl(borough, block, lot)

        if not bbl:
            return None

        return {
            "registration_id": registration_id,
            "bbl": bbl,
            "building_id": self.safe_int(record.get("buildingid")),
            "bin": record.get("bin"),
            "house_number": record.get("housenumber"),
            "street_name": record.get("streetname"),
            "borough": self._get_borough_name(borough),
            "zip_code": record.get("zip"),
            "block": self.safe_int(block),
            "lot": self.safe_int(lot),
            "last_registration_date": self.parse_date(record.get("lastregistrationdate")),
            "registration_end_date": self.parse_date(record.get("registrationenddate")),
        }

    @staticmethod
    def _get_borough_name(boro_id: str | int | None) -> str | None:
        """Convert borough ID to name."""
        mapping = {
            "1": "Manhattan",
            "2": "Bronx",
            "3": "Brooklyn",
            "4": "Queens",
            "5": "Staten Island",
        }
        return mapping.get(str(boro_id))


class RegistrationContactsExtractor(BaseExtractor):
    """Extractor for HPD Registration Contacts dataset."""

    # Patterns for name normalization
    SUFFIX_PATTERN = re.compile(
        r'\b(LLC|L\.L\.C\.|INC|INCORPORATED|CORP|CORPORATION|CO|COMPANY|'
        r'LP|L\.P\.|LTD|LIMITED|PLLC|P\.L\.L\.C\.|PC|P\.C\.)\b',
        re.IGNORECASE
    )
    PUNCT_PATTERN = re.compile(r'[^\w\s]')

    @property
    def dataset_id(self) -> str:
        return get_settings().registration_contacts_dataset

    @property
    def model_class(self):
        return RegistrationContact

    def get_primary_key_columns(self) -> list[str]:
        """Override to handle auto-increment ID."""
        return ["registration_id", "contact_type", "full_name"]

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform registration contact record to model fields."""
        registration_id = self.safe_int(record.get("registrationid"))
        if not registration_id:
            return None

        # Build full name
        first_name = record.get("firstname", "") or ""
        middle_initial = record.get("middleinitial", "") or ""
        last_name = record.get("lastname", "") or ""
        corp_name = record.get("corporationname", "") or ""

        if corp_name:
            full_name = corp_name
        else:
            parts = [first_name, middle_initial, last_name]
            full_name = " ".join(p for p in parts if p).strip()

        if not full_name:
            return None

        # Build full address
        business_address = self._build_address(record)

        # Normalize for entity resolution
        normalized_name = self._normalize_name(full_name)
        normalized_address = self._normalize_address(business_address)
        name_hash = self._create_hash(normalized_name, normalized_address)

        return {
            "registration_id": registration_id,
            "contact_type": record.get("type"),
            "contact_description": record.get("contactdescription"),
            "corporation_name": corp_name or None,
            "first_name": first_name or None,
            "middle_initial": middle_initial or None,
            "last_name": last_name or None,
            "full_name": full_name,
            "business_address": record.get("businesshousenumber", "") + " " + record.get("businessstreetname", ""),
            "business_city": record.get("businesscity"),
            "business_state": record.get("businessstate"),
            "business_zip": record.get("businesszip"),
            "normalized_name": normalized_name,
            "normalized_address": normalized_address,
            "name_hash": name_hash,
        }

    def _build_address(self, record: dict[str, Any]) -> str:
        """Build full business address from components."""
        parts = [
            record.get("businesshousenumber", ""),
            record.get("businessstreetname", ""),
            record.get("businessapartment", ""),
            record.get("businesscity", ""),
            record.get("businessstate", ""),
            record.get("businesszip", ""),
        ]
        return " ".join(str(p) for p in parts if p).strip()

    def _normalize_name(self, name: str) -> str:
        """Normalize owner name for matching."""
        if not name:
            return ""
        # Uppercase
        result = name.upper()
        # Remove LLC, INC, etc.
        result = self.SUFFIX_PATTERN.sub("", result)
        # Remove punctuation
        result = self.PUNCT_PATTERN.sub("", result)
        # Normalize whitespace
        result = " ".join(result.split())
        return result.strip()

    def _normalize_address(self, address: str) -> str:
        """Normalize address for matching."""
        if not address:
            return ""
        result = address.upper()

        # Standardize street types
        replacements = [
            (r'\bSTREET\b', 'ST'),
            (r'\bAVENUE\b', 'AVE'),
            (r'\bBOULEVARD\b', 'BLVD'),
            (r'\bROAD\b', 'RD'),
            (r'\bDRIVE\b', 'DR'),
            (r'\bLANE\b', 'LN'),
            (r'\bPLACE\b', 'PL'),
            (r'\bCOURT\b', 'CT'),
            (r'\bAPARTMENT\b', 'APT'),
            (r'\bSUITE\b', 'STE'),
            (r'\bFLOOR\b', 'FL'),
            (r'\b(\d+)(ST|ND|RD|TH)\b', r'\1'),
        ]
        for pattern, repl in replacements:
            result = re.sub(pattern, repl, result)

        # Remove apartment/suite numbers
        result = re.sub(r'\b(APT|STE|UNIT|FL|#)\s*[\w-]+\b', '', result)

        # Remove punctuation and normalize whitespace
        result = self.PUNCT_PATTERN.sub("", result)
        result = " ".join(result.split())

        return result.strip()

    def _create_hash(self, normalized_name: str, normalized_address: str) -> str:
        """Create hash for entity resolution grouping."""
        combined = f"{normalized_name}|{normalized_address}"
        return hashlib.sha256(combined.encode()).hexdigest()[:32]


class BuildingsFromRegistrationsExtractor(BaseExtractor):
    """Create/update buildings from HPD registrations data."""

    @property
    def dataset_id(self) -> str:
        return get_settings().hpd_registrations_dataset

    @property
    def model_class(self):
        return Building

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Extract building info from registration record."""
        borough = record.get("boroid") or record.get("boro")
        block = record.get("block")
        lot = record.get("lot")
        bbl = self.make_bbl(borough, block, lot)

        if not bbl:
            return None

        house_number = record.get("housenumber", "")
        street_name = record.get("streetname", "")
        full_address = f"{house_number} {street_name}".strip()

        return {
            "bbl": bbl,
            "borough": HPDRegistrationsExtractor._get_borough_name(borough),
            "block": self.safe_int(block),
            "lot": self.safe_int(lot),
            "house_number": house_number,
            "street_name": street_name,
            "full_address": full_address if full_address else None,
            "zip_code": record.get("zip"),
            "total_units": self.safe_int(record.get("totalunits")),
        }
