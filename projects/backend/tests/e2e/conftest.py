import os

import pytest


def pytest_configure(config: pytest.Config) -> None:
    os.environ.setdefault("KIPRIS_SERVICE_KEY", "dummy-key-for-collection")
    os.environ.setdefault("GOOGLE_API_KEY", "dummy-key-for-collection")
    os.environ.setdefault("PINECONE_API_KEY", "dummy-key-for-collection")
    os.environ.setdefault("PINECONE_INDEX_NAME", "dummy-index-for-collection")
    os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://dummy:dummy@localhost/dummy")

    config.addinivalue_line(
        "markers",
        "integration: mark test as integration test (requires --run-integration)",
    )


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    if not config.getoption("--run-integration"):
        skip_integration = pytest.mark.skip(reason="need --run-integration to run")
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip_integration)
