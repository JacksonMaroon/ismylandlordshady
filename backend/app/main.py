from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import router as v1_router
from app.database import engine, Base, get_db
from app.logging_config import setup_logging, get_logger
from app.middleware import RequestLoggingMiddleware, ErrorHandlingMiddleware
from app.cache import close_cache
from pipeline.runner import run_all

# Set up logging first
setup_logging()
logger = get_logger('main')


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting IsMyLandlordShady.nyc API...")

    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, checkfirst=True))

    logger.info("Database tables verified")
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
    allow_origins=[
        "http://localhost:3000",
        "https://ismylandlordshady.nyc",
        "https://www.ismylandlordshady.nyc",
        "https://frontend-two-kohl-50.vercel.app",  # Production Vercel App
    ],
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
async def trigger_pipeline(background_tasks: BackgroundTasks, full_refresh: bool = False):
    """Trigger the data pipeline as a background task."""
    logger.info(f"Received pipeline trigger request. Full refresh: {full_refresh}")
    background_tasks.add_task(run_all, full_refresh=full_refresh)
    return {"message": "Pipeline triggered in background", "full_refresh": full_refresh}
