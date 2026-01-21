import logging
from abc import ABC, abstractmethod
from typing import Any
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.database import AsyncSessionLocal
from pipeline.extractors.socrata import SocrataClient

logger = logging.getLogger(__name__)


class BaseExtractor(ABC):
    """Base class for data extractors from NYC Open Data."""

    def __init__(self):
        self.client = SocrataClient()
        self.batch_size = 1000

    @property
    @abstractmethod
    def dataset_id(self) -> str:
        """Socrata dataset ID."""
        pass

    @property
    @abstractmethod
    def model_class(self):
        """SQLAlchemy model class for this data."""
        pass

    @abstractmethod
    def transform_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """Transform a Socrata record to model fields. Return None to skip."""
        pass

    @property
    def where_clause(self) -> str | None:
        """Optional SoQL WHERE clause for filtering."""
        return None

    @property
    def select_clause(self) -> str | None:
        """Optional SoQL SELECT clause for field selection."""
        return None

    @property
    def order_clause(self) -> str | None:
        """Optional SoQL ORDER clause."""
        return None

    def get_primary_key_columns(self) -> list[str]:
        """Get primary key column names for upsert conflict resolution."""
        return [col.name for col in self.model_class.__table__.primary_key.columns]

    async def extract_and_load(self, full_refresh: bool = False, start_offset: int = 0) -> int:
        """
        Extract data from Socrata and load into database.

        Args:
            full_refresh: If True, truncate and reload. If False, upsert.
            start_offset: Offset to resume from (for interrupted loads).

        Returns:
            Number of records processed.
        """
        logger.info(f"Starting extraction for {self.dataset_id}" + (f" from offset {start_offset}" if start_offset else ""))
        start_time = datetime.now()
        total_processed = 0
        batch_count = 0
        commit_interval = 10  # Commit every 10 batches to avoid data loss

        async with AsyncSessionLocal() as session:
            if full_refresh:
                await self._truncate_table(session)

            async for batch in self.client.fetch_batch(
                self.dataset_id,
                batch_size=self.batch_size,
                where=self.where_clause,
                select=self.select_clause,
                order=self.order_clause,
                start_offset=start_offset,
            ):
                transformed = []
                for record in batch:
                    try:
                        result = self.transform_record(record)
                        if result:
                            transformed.append(result)
                    except Exception as e:
                        logger.warning(f"Error transforming record: {e}")
                        continue

                if transformed:
                    await self._upsert_batch(session, transformed)
                    total_processed += len(transformed)
                    batch_count += 1
                    logger.info(f"Processed {total_processed} records...")

                    # Commit incrementally to avoid losing all data on failure
                    if batch_count % commit_interval == 0:
                        await session.commit()
                        logger.info(f"Committed {total_processed} records")

            # Final commit for any remaining uncommitted data
            await session.commit()

        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Completed {self.dataset_id}: {total_processed} records in {elapsed:.1f}s"
        )
        return total_processed

    async def _truncate_table(self, session: AsyncSession):
        """Truncate the target table."""
        table_name = self.model_class.__tablename__
        await session.execute(f"TRUNCATE TABLE {table_name} CASCADE")
        logger.info(f"Truncated table {table_name}")

    async def _upsert_batch(self, session: AsyncSession, records: list[dict]):
        """Upsert a batch of records using PostgreSQL ON CONFLICT."""
        if not records:
            return

        # Deduplicate records by primary key (keep last occurrence)
        pk_columns = self.get_primary_key_columns()
        seen = {}
        for record in records:
            key = tuple(record.get(col) for col in pk_columns)
            seen[key] = record
        deduped_records = list(seen.values())

        stmt = insert(self.model_class.__table__).values(deduped_records)

        update_dict = {
            col.name: stmt.excluded[col.name]
            for col in self.model_class.__table__.columns
            if col.name not in pk_columns
        }

        if update_dict:
            stmt = stmt.on_conflict_do_update(
                index_elements=pk_columns,
                set_=update_dict,
            )
        else:
            stmt = stmt.on_conflict_do_nothing(index_elements=pk_columns)

        await session.execute(stmt)

    @staticmethod
    def parse_date(date_str: str | None) -> datetime | None:
        """Parse date string to datetime."""
        if not date_str:
            return None
        try:
            # Handle ISO format with timezone
            if "T" in date_str:
                return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            # Handle date-only format
            return datetime.strptime(date_str[:10], "%Y-%m-%d")
        except (ValueError, TypeError):
            return None

    @staticmethod
    def safe_int(value: Any) -> int | None:
        """Safely convert value to int."""
        if value is None or value == "":
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def safe_float(value: Any) -> float | None:
        """Safely convert value to float."""
        if value is None or value == "":
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def make_bbl(borough: str | int, block: str | int, lot: str | int) -> str | None:
        """Create BBL from borough, block, lot."""
        try:
            b = int(borough)
            bl = int(block)
            l = int(lot)
            return f"{b}{bl:05d}{l:04d}"
        except (ValueError, TypeError):
            return None
