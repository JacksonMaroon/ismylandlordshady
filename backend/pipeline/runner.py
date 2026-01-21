import asyncio
import argparse
import logging
from datetime import datetime

from pipeline.extractors import (
    HPDViolationsExtractor,
    HPDRegistrationsExtractor,
    Complaints311Extractor,
    DOBViolationsExtractor,
    EvictionsExtractor,
)
from pipeline.extractors.hpd_registrations import (
    RegistrationContactsExtractor,
    BuildingsFromRegistrationsExtractor,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Available datasets and their extractors
EXTRACTORS = {
    "buildings": BuildingsFromRegistrationsExtractor,
    "hpd_registrations": HPDRegistrationsExtractor,
    "registration_contacts": RegistrationContactsExtractor,
    "hpd_violations": HPDViolationsExtractor,
    "complaints_311": Complaints311Extractor,
    "dob_violations": DOBViolationsExtractor,
    "evictions": EvictionsExtractor,
}

# Recommended order for full data load
LOAD_ORDER = [
    "buildings",
    "hpd_registrations",
    "registration_contacts",
    "hpd_violations",
    "complaints_311",
    "dob_violations",
    "evictions",
]


async def run_extractor(name: str, full_refresh: bool = False, start_offset: int = 0) -> int:
    """Run a single extractor with optional offset for resumption."""
    if name not in EXTRACTORS:
        raise ValueError(f"Unknown dataset: {name}. Available: {list(EXTRACTORS.keys())}")

    extractor_class = EXTRACTORS[name]
    extractor = extractor_class()

    logger.info(f"Starting extractor: {name}" + (f" from offset {start_offset}" if start_offset else ""))
    start = datetime.now()

    count = await extractor.extract_and_load(full_refresh=full_refresh, start_offset=start_offset)

    elapsed = (datetime.now() - start).total_seconds()
    logger.info(f"Completed {name}: {count} records in {elapsed:.1f}s")

    return count


async def run_all(full_refresh: bool = False):
    """Run all extractors in order."""
    logger.info("Starting full data pipeline")
    start = datetime.now()
    total = 0

    for name in LOAD_ORDER:
        try:
            count = await run_extractor(name, full_refresh=full_refresh)
            total += count
        except Exception as e:
            logger.error(f"Error in {name}: {e}")
            raise

    elapsed = (datetime.now() - start).total_seconds()
    logger.info(f"Pipeline complete: {total} total records in {elapsed:.1f}s")


async def run_entity_resolution():
    """Run entity resolution to group owners into portfolios."""
    from app.services.entity_resolution import EntityResolutionService

    service = EntityResolutionService()
    await service.run_entity_resolution()


async def run_scoring():
    """Compute scores for all buildings."""
    from app.services.scoring import ScoringService

    service = ScoringService()
    await service.compute_all_scores()


def main():
    parser = argparse.ArgumentParser(description="NYC Landlord Data Pipeline")
    parser.add_argument(
        "--dataset",
        "-d",
        choices=list(EXTRACTORS.keys()) + ["all"],
        default="all",
        help="Dataset to extract (default: all)",
    )
    parser.add_argument(
        "--full-refresh",
        "-f",
        action="store_true",
        help="Truncate and reload instead of upsert",
    )
    parser.add_argument(
        "--entity-resolution",
        "-e",
        action="store_true",
        help="Run entity resolution after extraction",
    )
    parser.add_argument(
        "--scoring",
        "-s",
        action="store_true",
        help="Compute building scores after extraction",
    )
    parser.add_argument(
        "--offset",
        "-o",
        type=int,
        default=0,
        help="Start offset for resuming interrupted loads (e.g., 7600000)",
    )
    parser.add_argument(
        "--skip-extraction",
        action="store_true",
        help="Skip data extraction, only run entity resolution and/or scoring",
    )

    args = parser.parse_args()

    async def execute():
        # Skip extraction if --skip-extraction flag is set
        if not args.skip_extraction:
            if args.dataset == "all":
                await run_all(full_refresh=args.full_refresh)
            else:
                await run_extractor(args.dataset, full_refresh=args.full_refresh, start_offset=args.offset)

        if args.entity_resolution:
            await run_entity_resolution()

        if args.scoring:
            await run_scoring()

    asyncio.run(execute())


if __name__ == "__main__":
    main()
