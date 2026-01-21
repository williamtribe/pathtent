import pytest
from app.models import JobGroup, Search, SearchResult
from app.repository import (
    create_job_group,
    create_search,
    create_search_result,
    get_search,
    get_search_with_results,
    increment_job_group,
    update_result_similarity,
    update_search_embedding,
    update_search_status,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = [pytest.mark.asyncio]


async def test_search_model__if_create__returns_search_with_id(
    db_session: AsyncSession,
) -> None:
    # given
    search = Search(
        original_text="test text",
        search_query="test query",
    )
    db_session.add(search)
    await db_session.flush()

    # when
    result = await db_session.get(Search, search.id)

    # then
    assert result is not None
    assert result.id == search.id
    assert result.status == "pending"
    assert result.original_text == "test text"
    assert result.search_query == "test query"


async def test_job_group_model__if_create__returns_job_group_with_relationship(
    db_session: AsyncSession,
) -> None:
    # given
    search = Search(original_text="test", search_query="query")
    db_session.add(search)
    await db_session.flush()

    job_group = JobGroup(
        search_id=search.id,
        total_jobs=10,
        completed_jobs=0,
        failed_jobs=0,
    )
    db_session.add(job_group)
    await db_session.flush()

    # when
    result = await db_session.execute(select(JobGroup).where(JobGroup.search_id == search.id))
    fetched_job_group = result.scalar_one()

    # then
    assert fetched_job_group.id == job_group.id
    assert fetched_job_group.search_id == search.id
    assert fetched_job_group.total_jobs == 10


async def test_search_result_model__if_duplicate_application_number__raises_integrity_error(
    db_session: AsyncSession,
) -> None:
    # given
    search = Search(original_text="test", search_query="query")
    db_session.add(search)
    await db_session.flush()

    result1 = SearchResult(
        search_id=search.id,
        application_number="1020230001",
        invention_title="Test Patent",
        claims_text="Claim 1",
        claims_source="claims",
        pinecone_vector_id="vec_1",
    )
    db_session.add(result1)
    await db_session.flush()

    # when/then
    result2 = SearchResult(
        search_id=search.id,
        application_number="1020230001",
        invention_title="Duplicate Patent",
        claims_text="Claim 2",
        claims_source="claims",
        pinecone_vector_id="vec_2",
    )
    db_session.add(result2)

    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_repository_create_search__if_valid_data__returns_search(
    db_session: AsyncSession,
) -> None:
    # given/when
    search = await create_search(db_session, original_text="original", search_query="query")

    # then
    assert search.id is not None
    assert search.original_text == "original"
    assert search.search_query == "query"
    assert search.status == "pending"


async def test_repository_update_search_embedding__if_valid__stores_json(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "text", "query")
    await db_session.flush()

    # when
    await update_search_embedding(db_session, search.id, [0.1, 0.2, 0.3])
    await db_session.flush()

    # then
    fetched = await get_search(db_session, search.id)
    assert fetched is not None
    assert fetched.original_embedding is not None
    assert fetched.original_embedding["values"] == [0.1, 0.2, 0.3]
    assert fetched.original_embedding["dimension"] == 3


async def test_repository_update_search_status__if_completed__sets_completed_at(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "text", "query")
    await db_session.flush()

    # when
    await update_search_status(db_session, search.id, "completed")
    await db_session.flush()

    # then
    fetched = await get_search(db_session, search.id)
    assert fetched is not None
    assert fetched.status == "completed"
    assert fetched.completed_at is not None


async def test_repository_increment_job_group__if_all_done__returns_true(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "text", "query")
    await create_job_group(db_session, search.id, total_jobs=2)
    await db_session.flush()

    # when
    is_done_1 = await increment_job_group(db_session, search.id, failed=False)
    await db_session.flush()

    is_done_2 = await increment_job_group(db_session, search.id, failed=False)
    await db_session.flush()

    # then
    assert is_done_1 is False
    assert is_done_2 is True


async def test_repository_create_search_result__if_valid__returns_result(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "text", "query")
    await db_session.flush()

    # when
    result = await create_search_result(
        db_session,
        search_id=search.id,
        application_number="1020230001",
        invention_title="Test Patent",
        claims_text="Claim 1",
        claims_source="claims",
        pinecone_vector_id="vec_1",
    )
    await db_session.flush()

    # then
    assert result.id is not None
    assert result.application_number == "1020230001"
    assert result.similarity_score is None


async def test_repository_update_result_similarity__if_valid__updates_score(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "text", "query")
    await create_search_result(
        db_session,
        search.id,
        "1020230001",
        "Title",
        "Claims",
        "claims",
        "vec_1",
    )
    await db_session.flush()

    # when
    await update_result_similarity(db_session, search.id, "1020230001", 0.95)
    await db_session.flush()

    # then
    fetched = await get_search_with_results(db_session, search.id)
    assert fetched is not None
    assert len(fetched.results) == 1
    assert fetched.results[0].similarity_score == 0.95


async def test_repository_get_search_with_results__if_multiple_results__returns_all(
    db_session: AsyncSession,
) -> None:
    # given
    search = await create_search(db_session, "text", "query")
    await create_search_result(db_session, search.id, "1020230001", "Title1", "Claims1", "claims", "vec_1")
    await create_search_result(db_session, search.id, "1020230002", "Title2", "Claims2", "claims", "vec_2")
    await db_session.flush()

    # when
    fetched = await get_search_with_results(db_session, search.id)

    # then
    assert fetched is not None
    assert len(fetched.results) == 2
    assert {r.application_number for r in fetched.results} == {
        "1020230001",
        "1020230002",
    }
