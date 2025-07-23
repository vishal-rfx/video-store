from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from core.confg import settings

engine = create_async_engine(
    str(settings.PG_DATABASE_URL),
    echo=False,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    """Root class that allows all ORM models to inherit from."""

