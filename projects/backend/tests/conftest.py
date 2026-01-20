from collections.abc import AsyncGenerator, Generator

import asyncpg
import pytest
import pytest_asyncio
from app.models import Base
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--run-integration",
        action="store_true",
        default=False,
        help="run integration tests",
    )


@pytest.fixture(scope="session")
def postgres_container() -> Generator[PostgresContainer]:
    """Start PostgreSQL container for integration tests."""
    container = PostgresContainer("postgres:16")
    container.start()
    yield container
    container.stop()


@pytest_asyncio.fixture(scope="session")
async def setup_pgqueuer_tables(postgres_container: PostgresContainer) -> None:
    """Initialize pgqueuer tables in test database."""
    connection_url = postgres_container.get_connection_url()
    asyncpg_url = connection_url.replace("postgresql+psycopg2://", "postgresql://")

    conn = await asyncpg.connect(asyncpg_url)
    try:
        # Create pgqueuer_jobs table
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS pgqueuer_jobs (
                id SERIAL PRIMARY KEY,
                queue_name VARCHAR(255) NOT NULL,
                payload JSONB NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                priority INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                scheduled_at TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                error TEXT,
                retry_count INTEGER NOT NULL DEFAULT 0,
                max_retries INTEGER NOT NULL DEFAULT 3
            );
            """
        )
        # Create index for efficient queue processing
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_pgqueuer_jobs_queue_status
            ON pgqueuer_jobs (queue_name, status, priority DESC, created_at);
            """
        )
    finally:
        await conn.close()


@pytest_asyncio.fixture
async def db_session(
    postgres_container: PostgresContainer, setup_pgqueuer_tables: None
) -> AsyncGenerator[AsyncSession]:
    """Provide database session with automatic rollback for test isolation."""
    connection_url = postgres_container.get_connection_url()
    asyncpg_url = connection_url.replace("psycopg2", "asyncpg")

    engine = create_async_engine(asyncpg_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_maker() as session:
        async with session.begin():
            yield session
            await session.rollback()

    await engine.dispose()
