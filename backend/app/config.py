import json
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql+asyncpg://landlord:landlord_dev_password@localhost:5432/landlord_shady",
        validation_alias="DATABASE_URL"
    )
    allowed_origins: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3004",
            "https://ismylandlordshady.nyc",
            "https://www.ismylandlordshady.nyc",
            "https://frontend-two-kohl-50.vercel.app",
        ],
        validation_alias="ALLOWED_ORIGINS",
    )
    socrata_app_token: str = ""
    socrata_base_url: str = "https://data.cityofnewyork.us"
    socrata_rate_limit: int = 10  # requests per second
    socrata_page_size: int = 50000

    # Logging
    log_level: str = "INFO"

    # Cache (optional - uses in-memory if not set)
    redis_url: str = ""

    # Dataset IDs
    hpd_violations_dataset: str = "wvxf-dwi5"
    hpd_registrations_dataset: str = "tesw-yqqr"
    registration_contacts_dataset: str = "feu5-w2e2"
    complaints_311_dataset: str = "erm2-nwe9"
    dob_violations_dataset: str = "6bgk-3dad"
    evictions_dataset: str = "6z8x-wfk4"
    acris_master_dataset: str = "bnx9-e6tj"
    acris_parties_dataset: str = "636b-3b5g"
    acris_legals_dataset: str = "8h5j-fqxa"

    @field_validator("database_url", mode="after")
    @classmethod
    def convert_database_url(cls, v: str) -> str:
        """Convert to asyncpg dialect and normalize SSL query parameters."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Raw DATABASE_URL value: {v[:50]}...")  # Log first 50 chars (mask credentials)

        converted = v
        if v.startswith("postgresql://"):
            converted = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            logger.info("Converted postgresql:// to postgresql+asyncpg://")
        elif v.startswith("postgres://"):
            converted = v.replace("postgres://", "postgresql+asyncpg://", 1)
            logger.info("Converted postgres:// to postgresql+asyncpg://")
        else:
            logger.info(f"No scheme conversion needed, URL starts with: {v[:20]}")

        # DigitalOcean provides sslmode=require, but asyncpg expects ssl=require.
        try:
            parts = urlsplit(converted)
            if parts.query:
                query_pairs = parse_qsl(parts.query, keep_blank_values=True)
                normalized_pairs: list[tuple[str, str]] = []
                sslmode_value: str | None = None
                has_ssl = False

                for key, value in query_pairs:
                    if key == "sslmode":
                        sslmode_value = value
                        continue
                    if key == "ssl":
                        has_ssl = True
                    normalized_pairs.append((key, value))

                if sslmode_value and not has_ssl:
                    normalized_pairs.append(("ssl", sslmode_value))
                    logger.info(
                        "Normalized sslmode=%s to ssl=%s for asyncpg", sslmode_value, sslmode_value
                    )
                elif sslmode_value and has_ssl:
                    logger.info("Found both sslmode and ssl in DATABASE_URL; keeping existing ssl value")

                normalized_query = urlencode(normalized_pairs)
                if normalized_query != parts.query:
                    converted = urlunsplit(
                        (parts.scheme, parts.netloc, parts.path, normalized_query, parts.fragment)
                    )
        except Exception:
            logger.exception("Failed to normalize DATABASE_URL query parameters; using original value")

        return converted

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        """Allow ALLOWED_ORIGINS to be provided as CSV or JSON list."""
        if v is None:
            return v

        if isinstance(v, str):
            raw = v.strip()
            if not raw:
                return []

            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass

            return [origin.strip() for origin in raw.split(",") if origin.strip()]

        if isinstance(v, (list, tuple, set)):
            return [str(item).strip() for item in v if str(item).strip()]

        return v

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
