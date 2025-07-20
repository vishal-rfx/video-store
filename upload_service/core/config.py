from pathlib import Path
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PG_DATABASE_URL: PostgresDsn = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/mydb"
    )
    PG_CA_FILE: str = ''

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / ".env",
        extra="ignore"
    )

settings = Settings()