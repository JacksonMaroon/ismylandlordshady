from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.config import get_settings
from app.models.building import Building
from pipeline.extractors.base import BaseExtractor


class PLUTOExtractor(BaseExtractor):
    """
    Extractor for NYC PLUTO dataset to enrich building data.

    This extractor updates existing buildings with unit counts, year built,
    and coordinates from the PLUTO dataset. It does NOT create new buildings.
    """

    @property
    def dataset_id(self) -> str:
        return get_settings().pluto_dataset

    @property
    def model_class(self):
        return Building

    @property
    def select_clause(self) -> str | None:
        """Only fetch the fields we need from PLUTO."""
        return "bbl,unitsres,unitstotal,yearbuilt,latitude,longitude"

    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform PLUTO record to building fields."""
        bbl_raw = record.get("bbl")
        if not bbl_raw:
            return None

        # PLUTO BBLs come as decimals like "4110150001.00000000" - strip the decimal
        bbl = bbl_raw.split(".")[0] if "." in str(bbl_raw) else str(bbl_raw)

        if len(bbl) != 10:
            return None

        # Extract and clean the fields
        residential_units = self.safe_int(record.get("unitsres"))
        total_units = self.safe_int(record.get("unitstotal"))
        year_built = self.safe_int(record.get("yearbuilt"))
        latitude = self.safe_float(record.get("latitude"))
        longitude = self.safe_float(record.get("longitude"))

        # Skip records with no useful data
        if all(v is None for v in [residential_units, total_units, year_built, latitude, longitude]):
            return None

        return {
            "bbl": bbl,
            "residential_units": residential_units,
            "total_units": total_units,
            "year_built": year_built,
            "latitude": latitude,
            "longitude": longitude,
        }

    async def _upsert_batch(self, session: AsyncSession, records: list[dict]):
        """
        Update existing buildings with PLUTO data.

        Uses UPDATE (not INSERT) to only update buildings that already exist.
        This prevents creating buildings with incomplete data.
        """
        if not records:
            return

        # Deduplicate records by BBL (keep last occurrence)
        seen = {}
        for record in records:
            bbl = record.get("bbl")
            if bbl:
                seen[bbl] = record
        deduped_records = list(seen.values())

        # Use UPDATE to only modify existing buildings
        sql = text("""
            UPDATE buildings SET
                residential_units = COALESCE(:residential_units, residential_units),
                total_units = COALESCE(:total_units, total_units),
                year_built = COALESCE(:year_built, year_built),
                latitude = COALESCE(:latitude, latitude),
                longitude = COALESCE(:longitude, longitude),
                updated_at = NOW()
            WHERE bbl = :bbl
        """)

        # Execute updates for each record
        for record in deduped_records:
            await session.execute(sql, record)
