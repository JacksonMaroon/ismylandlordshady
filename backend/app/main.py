from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import router as v1_router
from app.config import get_settings
from app.database import engine, Base, get_db
from app.logging_config import setup_logging, get_logger
from app.middleware import RequestLoggingMiddleware, ErrorHandlingMiddleware
from app.cache import close_cache
from pipeline.runner import run_all, run_extractor, run_scoring, run_entity_resolution, EXTRACTORS

# Set up logging first
setup_logging()
logger = get_logger('main')
settings = get_settings()
logger.info("Configured CORS origins: %s", settings.allowed_origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting IsMyLandlordShady.nyc API...")

    if settings.auto_create_tables:
        # Create tables if they don't exist (useful for local/dev).
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, checkfirst=True))
        logger.info("Database tables verified")
    else:
        logger.info("AUTO_CREATE_TABLES disabled; skipping metadata.create_all()")
    logger.info("API startup complete")

    yield

    # Shutdown
    logger.info("Shutting down API...")
    await close_cache()
    logger.info("Cache closed")
    await engine.dispose()
    logger.info("Database connections closed")


app = FastAPI(
    title="IsMyLandlordShady.nyc API",
    description="API for NYC landlord and building data transparency",
    version="1.0.0",
    lifespan=lifespan,
)

# Add middleware (order matters - last added is first executed)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(v1_router)


@app.get("/")
async def root():
    return {
        "name": "IsMyLandlordShady.nyc API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint with database connectivity verification."""
    health_status = {
        "status": "healthy",
        "database": "unknown",
    }

    # Check database connectivity
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["status"] = "degraded"
        health_status["database"] = "disconnected"

    return health_status


@app.post("/admin/pipeline/trigger")
async def trigger_pipeline(
    background_tasks: BackgroundTasks,
    dataset: str | None = None,
    full_refresh: bool = False
):
    """
    Trigger the data pipeline as a background task.

    Args:
        dataset: Specific dataset to run (e.g., 'pluto', 'hpd_violations').
                 If None, runs all datasets.
        full_refresh: If True, truncate and reload instead of upsert.
    """
    if dataset:
        if dataset not in EXTRACTORS:
            return {"error": f"Unknown dataset: {dataset}. Available: {list(EXTRACTORS.keys())}"}
        logger.info(f"Received pipeline trigger for dataset: {dataset}. Full refresh: {full_refresh}")
        background_tasks.add_task(run_extractor, dataset, full_refresh)
        return {"message": f"Pipeline triggered for {dataset}", "dataset": dataset, "full_refresh": full_refresh}
    else:
        logger.info(f"Received full pipeline trigger request. Full refresh: {full_refresh}")
        background_tasks.add_task(run_all, full_refresh=full_refresh)
        return {"message": "Full pipeline triggered in background", "full_refresh": full_refresh}


@app.post("/admin/pipeline/scoring")
async def trigger_scoring(background_tasks: BackgroundTasks):
    """Trigger scoring recalculation as a background task."""
    logger.info("Received scoring trigger request")
    background_tasks.add_task(run_scoring)
    return {"message": "Scoring triggered in background"}


@app.post("/admin/pipeline/entity-resolution")
async def trigger_entity_resolution(background_tasks: BackgroundTasks):
    """Trigger entity resolution as a background task."""
    logger.info("Received entity resolution trigger request")
    background_tasks.add_task(run_entity_resolution)
    return {"message": "Entity resolution triggered in background"}


@app.get("/admin/entity-resolution/stats")
async def entity_resolution_stats(db: AsyncSession = Depends(get_db)):
    """Get entity resolution data quality stats."""
    query = text("""
        SELECT
            COUNT(*) as total_contacts,
            COUNT(CASE WHEN contact_type IN ('CorporateOwner', 'HeadOfficer', 'IndividualOwner', 'JointOwner', 'Officer', 'Shareholder', 'Owner') THEN 1 END) as owner_type_contacts,
            COUNT(CASE WHEN contact_type IN ('CorporateOwner', 'HeadOfficer', 'IndividualOwner', 'JointOwner', 'Officer', 'Shareholder', 'Owner') AND name_hash IS NOT NULL THEN 1 END) as with_hash,
            COUNT(CASE WHEN contact_type IN ('CorporateOwner', 'HeadOfficer', 'IndividualOwner', 'JointOwner', 'Officer', 'Shareholder', 'Owner') AND owner_portfolio_id IS NOT NULL THEN 1 END) as linked,
            COUNT(CASE WHEN contact_type IN ('CorporateOwner', 'HeadOfficer', 'IndividualOwner', 'JointOwner', 'Officer', 'Shareholder', 'Owner') AND (full_name IS NULL OR full_name = '') THEN 1 END) as empty_name,
            COUNT(CASE WHEN contact_type IN ('CorporateOwner', 'HeadOfficer', 'IndividualOwner', 'JointOwner', 'Officer', 'Shareholder', 'Owner') AND (business_address IS NULL OR business_address = '') THEN 1 END) as empty_address
        FROM registration_contacts;
    """)

    result = await db.execute(query)
    row = result.first()

    owner_contacts = row.owner_type_contacts

    return {
        "total_contacts": row.total_contacts,
        "owner_type_contacts": owner_contacts,
        "with_hash": row.with_hash,
        "with_hash_pct": round(100 * row.with_hash / owner_contacts, 1) if owner_contacts else 0,
        "linked": row.linked,
        "linked_pct": round(100 * row.linked / owner_contacts, 1) if owner_contacts else 0,
        "empty_name": row.empty_name,
        "empty_name_pct": round(100 * row.empty_name / owner_contacts, 1) if owner_contacts else 0,
        "empty_address": row.empty_address,
        "empty_address_pct": round(100 * row.empty_address / owner_contacts, 1) if owner_contacts else 0,
    }
