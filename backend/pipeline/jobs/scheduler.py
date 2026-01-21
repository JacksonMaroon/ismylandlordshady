import asyncio
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from pipeline.runner import run_all, run_entity_resolution, run_scoring

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def nightly_refresh():
    """Run nightly data refresh pipeline."""
    logger.info("Starting nightly data refresh")
    start = datetime.now()

    try:
        # Run all extractors
        await run_all(full_refresh=False)

        # Run entity resolution to update portfolios
        await run_entity_resolution()

        # Recompute all scores
        await run_scoring()

        elapsed = (datetime.now() - start).total_seconds()
        logger.info(f"Nightly refresh complete in {elapsed:.1f}s")

    except Exception as e:
        logger.error(f"Nightly refresh failed: {e}")
        raise


def start_scheduler():
    """Start the APScheduler for nightly jobs."""
    scheduler = AsyncIOScheduler()

    # Run nightly at 3 AM EST
    scheduler.add_job(
        nightly_refresh,
        CronTrigger(hour=3, minute=0, timezone="America/New_York"),
        id="nightly_refresh",
        name="Nightly Data Refresh",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started - nightly refresh scheduled for 3 AM EST")

    return scheduler


if __name__ == "__main__":
    scheduler = start_scheduler()

    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler shutdown")
