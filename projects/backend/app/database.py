from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import Settings

settings = Settings()


def get_async_database_url(url: str | None) -> str:
    """Convert DATABASE_URL to async format for SQLAlchemy.

    Railway provides: postgresql://...
    SQLAlchemy async needs: postgresql+asyncpg://...
    """
    if url is None:
        raise ValueError("DATABASE_URL is required")
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(
    get_async_database_url(settings.database_url),
    echo=settings.debug,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)
