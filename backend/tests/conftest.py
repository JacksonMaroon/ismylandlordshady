"""Test fixtures and configuration for IsMyLandlordShady.nyc API tests."""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.cache import InMemoryCache, get_cache


# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def async_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database session override."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sync_client(db_session: AsyncSession) -> Generator[TestClient, None, None]:
    """Create a synchronous test client for simple tests."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def test_cache() -> InMemoryCache:
    """Create a test cache instance."""
    return InMemoryCache(max_size=100)


# Sample test data fixtures
@pytest.fixture
def sample_building_data() -> dict:
    """Sample building data for tests."""
    return {
        "bbl": "1000010001",
        "borough": "Manhattan",
        "block": 1,
        "lot": 1,
        "house_number": "1",
        "street_name": "BROADWAY",
        "full_address": "1 BROADWAY, MANHATTAN",
        "zip_code": "10004",
        "total_units": 100,
        "residential_units": 80,
        "year_built": 1920,
        "latitude": 40.7128,
        "longitude": -74.0060,
    }


@pytest.fixture
def sample_violation_data() -> dict:
    """Sample violation data for tests."""
    return {
        "violation_id": 12345,
        "bbl": "1000010001",
        "apartment": "1A",
        "story": "1",
        "inspection_date": "2024-01-15",
        "nov_description": "MICE",
        "current_status": "OPEN",
        "violation_class": "C",
    }


@pytest.fixture
def sample_portfolio_data() -> dict:
    """Sample owner portfolio data for tests."""
    return {
        "id": 1,
        "primary_name": "TEST LANDLORD LLC",
        "normalized_name": "test landlord llc",
        "name_hash": "abc123",
        "total_buildings": 5,
        "total_units": 200,
        "total_violations": 50,
        "class_c_violations": 10,
        "class_b_violations": 20,
        "class_a_violations": 20,
        "portfolio_score": 75.5,
        "portfolio_grade": "D",
        "is_llc": 1,
    }
