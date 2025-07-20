import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from core.config import settings

ssl_context = ssl.create_default_context(cafile=settings.PG_CA_FILE)
engine = create_async_engine(
    str(settings.PG_DATABASE_URL),
    echo=False,
    connect_args={"ssl": ssl_context}
)

SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    """Root class that allows all ORM models to inherit from."""