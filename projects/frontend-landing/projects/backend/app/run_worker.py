import asyncio

from app.worker import create_pgqueuer


async def main() -> None:
    pgq = await create_pgqueuer()
    await pgq.run()


if __name__ == "__main__":
    asyncio.run(main())
