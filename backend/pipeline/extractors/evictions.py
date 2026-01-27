from typing import Any

from app.config import get_settings
from app.models.eviction import Eviction
from pipeline.extractors.base import BaseExtractor


class EvictionsExtractor(BaseExtractor):
    """Extractor for NYC Evictions dataset."""

    @property
    def dataset_id(self) -> str:
        return get_settings().evictions_dataset

    @property
    def model_class(self):
        return Eviction

    def get_primary_key_columns(self) -> list[str]:
        """Use court index number as unique identifier."""
        return ["court_index_number"]

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform eviction record to model fields."""
        court_index = record.get("court_index_number") or record.get("courtindexnumber")
        if not court_index:
            return None

        # Build BBL if available (evictions dataset may have this)
        bbl = record.get("bbl")
        if not bbl:
            borough = self._borough_name_to_id(record.get("borough"))
            # Note: evictions data typically doesn't have block/lot
            bbl = None

        return {
            "court_index_number": court_index,
            "docket_number": record.get("docket_number") or record.get("docketnumber"),
            "bbl": bbl,
            "eviction_address": record.get("eviction_address") or record.get("evictionaddress"),
            "apt_seal": record.get("eviction_apt_num") or record.get("aptseal"),
            "executed_date": self.parse_date(record.get("executed_date") or record.get("executeddate")),
            "marshal_first_name": record.get("marshal_first_name") or record.get("marshalfirstname"),
            "marshal_last_name": record.get("marshal_last_name") or record.get("marshallastname"),
            "residential_commercial": record.get("residential_commercial_ind") or record.get("residentialcommercialind"),
            "borough": record.get("borough"),
            "ejectment": record.get("ejectment"),
            "eviction_zip": record.get("eviction_zip") or record.get("evictionzip"),
            "scheduled_status": record.get("eviction_possession") or record.get("scheduledstatus"),
            "latitude": record.get("latitude"),
            "longitude": record.get("longitude"),
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
