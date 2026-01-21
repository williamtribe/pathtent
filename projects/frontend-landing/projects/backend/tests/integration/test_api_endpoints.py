import json
import os
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

os.environ.setdefault("KIPRIS_SERVICE_KEY", "test")
os.environ.setdefault("GOOGLE_API_KEY", "test")
os.environ.setdefault("PINECONE_API_KEY", "test")
os.environ.setdefault("PINECONE_INDEX_NAME", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")

from app.api.deps import get_db, get_pgqueuer_queries
from app.main import app
from app.models import JobGroup, Search, SearchResult
from app.services.query_generator import KIPRISSearchQuery
from httpx import ASGITransport, AsyncClient
from pgqueuer.queries import Queries
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = [pytest.mark.asyncio]


async def test_health_check__if_called__returns_ok(db_session: AsyncSession) -> None:
    # given
    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # when
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    # then
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    app.dependency_overrides.clear()


async def test_configure_search__if_valid_text__returns_search_query(
    db_session: AsyncSession,
) -> None:
    # given
    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    mock_query = KIPRISSearchQuery(word="리튬이온 배터리", ipc_number=None)

    with patch("app.api.routes.generate_search_query", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_query

        # when
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/search/configure",
                json={"text": "리튬이온 배터리 관련 특허"},
            )

    # then
    assert response.status_code == 200
    data = response.json()
    assert data["search_query"]["word"] == "리튬이온 배터리"
    assert data["search_query"]["ipc_number"] is None

    app.dependency_overrides.clear()


async def test_request_search__if_valid_request__creates_search_and_enqueues_job(
    db_session: AsyncSession,
) -> None:
    # given
    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    mock_queries = AsyncMock(spec=Queries)

    async def override_get_pgqueuer_queries() -> Queries:
        return mock_queries

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_pgqueuer_queries] = override_get_pgqueuer_queries

    # when
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/search/request",
            json={
                "search_query": "리튬이온 배터리",
                "original_text": "리튬이온 배터리 관련 특허 문서",
            },
        )

    # then
    assert response.status_code == 201
    data = response.json()
    assert "search_id" in data

    mock_queries.enqueue.assert_called_once()
    call_args = mock_queries.enqueue.call_args
    assert call_args.kwargs["entrypoint"] == "search_patents"
    payload = json.loads(call_args.kwargs["payload"].decode())
    assert payload["search_id"] == data["search_id"]

    app.dependency_overrides.clear()


async def test_get_search_result__if_pending__returns_pending_status(
    db_session: AsyncSession,
) -> None:
    # given
    search = Search(
        original_text="test text",
        search_query="test query",
        status="pending",
    )
    db_session.add(search)
    await db_session.flush()

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # when
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/api/v1/search/{search.id}")

    # then
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"
    assert data["results"] is None
    assert data["error"] is None
    assert data["progress"] is None

    app.dependency_overrides.clear()


async def test_get_search_result__if_completed__returns_filtered_results(
    db_session: AsyncSession,
) -> None:
    # given
    search = Search(
        original_text="test text",
        search_query="test query",
        status="completed",
    )
    db_session.add(search)
    await db_session.flush()

    result_high = SearchResult(
        search_id=search.id,
        application_number="10-2024-0001",
        invention_title="High similarity patent",
        claims_text="claims",
        claims_source="claims",
        pinecone_vector_id="vec1",
        similarity_score=0.85,
    )
    result_low = SearchResult(
        search_id=search.id,
        application_number="10-2024-0002",
        invention_title="Low similarity patent",
        claims_text="claims",
        claims_source="full_doc",
        pinecone_vector_id="vec2",
        similarity_score=0.65,
    )
    db_session.add_all([result_high, result_low])
    await db_session.flush()

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # when
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/api/v1/search/{search.id}")

    # then
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert len(data["results"]) == 1
    assert data["results"][0]["application_number"] == "10-2024-0001"
    assert data["results"][0]["similarity_score"] == 0.85

    app.dependency_overrides.clear()


async def test_get_search_result__if_with_job_group__returns_progress(
    db_session: AsyncSession,
) -> None:
    # given
    search = Search(
        original_text="test text",
        search_query="test query",
        status="processing",
    )
    db_session.add(search)
    await db_session.flush()

    job_group = JobGroup(
        search_id=search.id,
        total_jobs=10,
        completed_jobs=7,
        failed_jobs=2,
    )
    db_session.add(job_group)
    await db_session.flush()

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # when
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/api/v1/search/{search.id}")

    # then
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing"
    assert data["progress"] == {"total": 10, "completed": 7, "failed": 2}

    app.dependency_overrides.clear()


async def test_get_search_result__if_not_found__returns_404(
    db_session: AsyncSession,
) -> None:
    # given
    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    non_existent_id = uuid4()

    # when
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/api/v1/search/{non_existent_id}")

    # then
    assert response.status_code == 404
    assert response.json()["detail"] == "Search not found"

    app.dependency_overrides.clear()
