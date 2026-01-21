#!/usr/bin/env python3
"""Initialize pgqueuer tables in PostgreSQL database."""

import asyncio
import os
from pathlib import Path

import asyncpg
from pgqueuer.db import AsyncpgDriver
from pgqueuer.queries import Queries


async def init_pgqueuer_tables() -> None:
    """Create pgqueuer tables in the database."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        env_path = Path(__file__).with_name(".env")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                stripped = line.strip()
                if not stripped or stripped.startswith("#"):
                    continue
                if stripped.startswith("DATABASE_URL="):
                    database_url = stripped.split("=", 1)[1].strip()
                    break

    if not database_url:
        raise RuntimeError("DATABASE_URL is not set")

    dsn = database_url.replace("+asyncpg", "")
    conn = await asyncpg.connect(dsn)
    try:
        driver = AsyncpgDriver(conn)
        queries = Queries(driver)
        await queries.install()
        print("PGQueuer tables initialized successfully!")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(init_pgqueuer_tables())
