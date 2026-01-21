from collections.abc import AsyncGenerator

import asyncpg
from pgqueuer.queries import Queries
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import async_session_factory

settings = Settings()


async def get_db() -> AsyncGenerator[AsyncSession]:
    """Per-request DB session"""
    async with async_session_factory() as session:
        yield session


class _PgqueuerConnection:
    connection: asyncpg.Connection | None = None


_pgq_conn = _PgqueuerConnection()


async def get_pgqueuer_queries() -> Queries:
    """pgqueuer Queries for enqueuing jobs from API"""
    if _pgq_conn.connection is None:
        db_url = settings.database_url.replace("+asyncpg", "")
        _pgq_conn.connection = await asyncpg.connect(db_url)
    return Queries.from_asyncpg_connection(_pgq_conn.connection)
