from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://landlord:landlord_dev_password@localhost:5432/landlord_shady"
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

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
