import asyncio
import json
import os
from collections.abc import AsyncGenerator, Callable, Coroutine
from pathlib import Path
from tempfile import NamedTemporaryFile
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pgqueuer import PgQueuer
from pgqueuer.models import Context, Job
from sqlalchemy.ext.asyncio import AsyncSession

os.environ.setdefault("KIPRIS_SERVICE_KEY", "test")
os.environ.setdefault("GOOGLE_API_KEY", "test")
os.environ.setdefault("PINECONE_API_KEY", "test")
os.environ.setdefault("PINECONE_INDEX_NAME", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")

from app.repository import (
    create_job_group,
    create_search,
    create_search_result,
    get_job_group,
    get_search,
    increment_job_group,
    update_search_embedding,
)
from app.services.kipris_service import DownloadedPatent
from app.worker import _register_entrypoints

HandlerType = Callable[[Job, Context], Coroutine[None, None, None]]


def test_worker__if_pgqueuer_setup__creates_successfully() -> None:
    # given
    with (
        patch("app.worker.Settings") as mock_settings,
        patch("app.worker.asyncpg") as mock_asyncpg,
        patch("app.worker.async_session_factory"),
        patch("app.worker.GeminiEmbeddingService"),
        patch("app.worker.KIPRISService"),
        patch("app.worker.PyMuPDFExtractor"),
        patch("app.worker.PineconeService"),
    ):
        mock_settings_instance = MagicMock()
        mock_settings_instance.database_url = "postgresql+asyncpg://test:test@localhost:5432/test"
        mock_settings_instance.google_api_key = "test-key"
        mock_settings_instance.gemini_embedding_model = "models/embedding-001"
        mock_settings_instance.kipris_service_key = "test-key"
        mock_settings_instance.pinecone_api_key = "test-key"
        mock_settings_instance.pinecone_index_name = "test-index"
        mock_settings.return_value = mock_settings_instance

        mock_conn = AsyncMock()
        mock_asyncpg.connect = AsyncMock(return_value=mock_conn)

        # when
        from app.worker import create_pgqueuer

        pgq = asyncio.get_event_loop().run_until_complete(create_pgqueuer())

        # then
        assert pgq is not None
        assert isinstance(pgq, PgQueuer)


@pytest.mark.asyncio
async def test_search_patents_job__if_empty_results__completes_search_immediately(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "test original text", "nonexistent query")
    await db_session.flush()
    search_id = search.id

    mock_kipris = MagicMock()

    async def empty_generator() -> AsyncGenerator[None]:
        return
        yield

    mock_kipris.search_all_pages = MagicMock(return_value=empty_generator())

    mock_embedding_svc = MagicMock()
    mock_embedding_svc.embed = AsyncMock(return_value=[0.1] * 768)

    mock_driver = MagicMock()
    mock_context = MagicMock(spec=Context)
    mock_context.resources = {
        "session_factory": lambda: db_session,
        "kipris_service": mock_kipris,
        "embedding_service": mock_embedding_svc,
        "driver": mock_driver,
    }

    mock_job = MagicMock(spec=Job)
    mock_job.payload = json.dumps({"search_id": str(search_id)}).encode()

    # when
    pgq = MagicMock(spec=PgQueuer)
    handlers: dict[str, HandlerType] = {}

    def capture_entrypoint(name: str, accepts_context: bool = False) -> Callable[[HandlerType], HandlerType]:
        def decorator(func: HandlerType) -> HandlerType:
            handlers[name] = func
            return func

        return decorator

    pgq.entrypoint = capture_entrypoint
    _register_entrypoints(pgq)

    class SessionWrapper:
        def __init__(self, session: AsyncSession) -> None:
            self._session = session

        def __getattr__(self, name: str) -> object:
            return getattr(self._session, name)

        async def commit(self) -> None:
            await self._session.flush()

    class SessionContextManager:
        async def __aenter__(self) -> SessionWrapper:
            return SessionWrapper(db_session)

        async def __aexit__(self, *args: object) -> None:
            pass

    mock_context.resources["session_factory"] = lambda: SessionContextManager()

    await handlers["search_patents"](mock_job, mock_context)

    # then
    updated_search = await get_search(db_session, search_id)
    assert updated_search is not None
    assert updated_search.status == "completed"


@pytest.mark.asyncio
async def test_process_patent_job__if_already_processed__skips_without_increment(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "test text", "test query")
    await db_session.flush()
    search_id = search.id

    await create_job_group(db_session, search_id, total_jobs=2)
    await db_session.flush()

    await create_search_result(
        db_session,
        search_id,
        "1020230001234",
        "Test Patent",
        "claims text",
        "claims",
        "vector123",
    )
    await db_session.flush()

    job_group_before = await get_job_group(db_session, search_id)
    assert job_group_before is not None
    completed_before = job_group_before.completed_jobs

    mock_context = MagicMock(spec=Context)

    class SessionContextManager:
        async def __aenter__(self) -> AsyncSession:
            return db_session

        async def __aexit__(self, *args: object) -> None:
            pass

    mock_context.resources = {
        "session_factory": lambda: SessionContextManager(),
        "kipris_service": MagicMock(),
        "pdf_extractor": MagicMock(),
        "embedding_service": MagicMock(),
        "pinecone_service": MagicMock(),
    }

    mock_job = MagicMock(spec=Job)
    mock_job.payload = json.dumps(
        {
            "search_id": str(search_id),
            "application_number": "1020230001234",
            "invention_title": "Test Patent",
        }
    ).encode()

    # when
    pgq = MagicMock(spec=PgQueuer)
    handlers: dict[str, HandlerType] = {}

    def capture_entrypoint(name: str, accepts_context: bool = False) -> Callable[[HandlerType], HandlerType]:
        def decorator(func: HandlerType) -> HandlerType:
            handlers[name] = func
            return func

        return decorator

    pgq.entrypoint = capture_entrypoint
    _register_entrypoints(pgq)

    await handlers["process_patent"](mock_job, mock_context)

    # then
    job_group_after = await get_job_group(db_session, search_id)
    assert job_group_after is not None
    assert job_group_after.completed_jobs == completed_before


@pytest.mark.asyncio
async def test_process_patent_job__if_all_done__enqueues_similarity(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "test text", "test query")
    await db_session.flush()
    search_id = search.id

    await create_job_group(db_session, search_id, total_jobs=1)
    await db_session.flush()

    mock_kipris = MagicMock()
    with NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(b"%PDF-1.4 test")
        tmp_path = Path(tmp.name)

    mock_kipris.download_patent_pdf = AsyncMock(
        return_value=DownloadedPatent(
            application_number="1020230009999",
            invention_title="New Patent",
            pdf_path=tmp_path,
        )
    )

    mock_pdf_extractor = MagicMock()
    mock_pdf_extractor.extract_text = AsyncMock(
        return_value="【청구범위】\n청구항 1. 테스트 청구항입니다.\n【발명의 설명】"
    )

    mock_embedding_svc = MagicMock()
    mock_embedding_svc.embed = AsyncMock(return_value=[0.1] * 768)

    mock_pinecone = MagicMock()
    mock_pinecone.get_or_create = AsyncMock(return_value="vector_id_123")

    mock_driver = MagicMock()

    enqueue_calls: list[dict[str, str | bytes]] = []

    async def capture_enqueue(entrypoint: str, payload: bytes) -> list[int]:
        enqueue_calls.append({"entrypoint": entrypoint, "payload": payload})
        return [1]

    mock_context = MagicMock(spec=Context)

    class SessionContextManager:
        async def __aenter__(self) -> AsyncSession:
            return db_session

        async def __aexit__(self, *args: object) -> None:
            pass

    mock_context.resources = {
        "session_factory": lambda: SessionContextManager(),
        "kipris_service": mock_kipris,
        "pdf_extractor": mock_pdf_extractor,
        "embedding_service": mock_embedding_svc,
        "pinecone_service": mock_pinecone,
        "driver": mock_driver,
    }

    mock_job = MagicMock(spec=Job)
    mock_job.payload = json.dumps(
        {
            "search_id": str(search_id),
            "application_number": "1020230009999",
            "invention_title": "New Patent",
        }
    ).encode()

    # when
    with patch("app.worker.Queries") as mock_queries_class:
        mock_queries_instance = MagicMock()
        mock_queries_instance.enqueue = capture_enqueue
        mock_queries_class.return_value = mock_queries_instance

        pgq = MagicMock(spec=PgQueuer)
        handlers: dict[str, HandlerType] = {}

        def capture_entrypoint(name: str, accepts_context: bool = False) -> Callable[[HandlerType], HandlerType]:
            def decorator(func: HandlerType) -> HandlerType:
                handlers[name] = func
                return func

            return decorator

        pgq.entrypoint = capture_entrypoint
        _register_entrypoints(pgq)

        await handlers["process_patent"](mock_job, mock_context)

    # then
    assert len(enqueue_calls) == 1
    assert enqueue_calls[0]["entrypoint"] == "similarity_analysis"

    tmp_path.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_similarity_analysis_job__if_all_failed__marks_search_failed(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "test text", "test query")
    await db_session.flush()
    search_id = search.id

    await update_search_embedding(db_session, search_id, [0.1] * 768)
    await db_session.flush()

    await create_job_group(db_session, search_id, total_jobs=2)
    await db_session.flush()

    await increment_job_group(db_session, search_id, failed=True)
    await increment_job_group(db_session, search_id, failed=True)
    await db_session.flush()

    mock_pinecone = MagicMock()
    mock_pinecone.query_similar = AsyncMock(return_value=[])

    mock_context = MagicMock(spec=Context)

    class SessionWrapper:
        def __init__(self, session: AsyncSession) -> None:
            self._session = session

        def __getattr__(self, name: str) -> object:
            return getattr(self._session, name)

        async def commit(self) -> None:
            await self._session.flush()

    class SessionContextManager:
        async def __aenter__(self) -> SessionWrapper:
            return SessionWrapper(db_session)

        async def __aexit__(self, *args: object) -> None:
            pass

    mock_context.resources = {
        "session_factory": lambda: SessionContextManager(),
        "pinecone_service": mock_pinecone,
    }

    mock_job = MagicMock(spec=Job)
    mock_job.payload = json.dumps({"search_id": str(search_id)}).encode()

    # when
    pgq = MagicMock(spec=PgQueuer)
    handlers: dict[str, HandlerType] = {}

    def capture_entrypoint(name: str, accepts_context: bool = False) -> Callable[[HandlerType], HandlerType]:
        def decorator(func: HandlerType) -> HandlerType:
            handlers[name] = func
            return func

        return decorator

    pgq.entrypoint = capture_entrypoint
    _register_entrypoints(pgq)

    await handlers["similarity_analysis"](mock_job, mock_context)

    # then
    updated_search = await get_search(db_session, search_id)
    assert updated_search is not None
    assert updated_search.status == "failed"
    assert updated_search.error_message == "All patents failed"
