from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import JobGroup, Search, SearchResult


async def create_search(
    session: AsyncSession,
    original_text: str,
    search_query: str,
) -> Search:
    """Create new Search (pending status)"""
    search = Search(
        original_text=original_text,
        search_query=search_query,
        status="pending",
    )
    session.add(search)
    await session.flush()
    return search


async def get_search(session: AsyncSession, search_id: UUID) -> Search | None:
    """Get single Search"""
    result = await session.execute(select(Search).where(Search.id == search_id))
    return result.scalar_one_or_none()


async def update_search_embedding(
    session: AsyncSession,
    search_id: UUID,
    embedding: list[float],
) -> None:
    """Store original document embedding (JSON format)"""
    await session.execute(
        update(Search)
        .where(Search.id == search_id)
        .values(original_embedding={"values": embedding, "dimension": len(embedding)})
    )


async def update_search_status(
    session: AsyncSession,
    search_id: UUID,
    status: str,
    error_message: str | None = None,
) -> None:
    """Update Search status"""
    values: dict[str, Any] = {"status": status}
    if error_message:
        values["error_message"] = error_message
    if status == "completed":
        values["completed_at"] = func.now()

    await session.execute(update(Search).where(Search.id == search_id).values(**values))


async def create_job_group(
    session: AsyncSession,
    search_id: UUID,
    total_jobs: int,
) -> JobGroup:
    """Create JobGroup - call before process_patent enqueue"""
    job_group = JobGroup(
        search_id=search_id,
        total_jobs=total_jobs,
        completed_jobs=0,
        failed_jobs=0,
    )
    session.add(job_group)
    await session.flush()
    return job_group


async def get_job_group(
    session: AsyncSession,
    search_id: UUID,
) -> JobGroup | None:
    """Get JobGroup"""
    result = await session.execute(select(JobGroup).where(JobGroup.search_id == search_id))
    return result.scalar_one_or_none()


async def increment_job_group(
    session: AsyncSession,
    search_id: UUID,
    failed: bool = False,
) -> bool:
    """
    Increment completed/failed count.
    Returns: True if all jobs are done (completed + failed >= total)
    """
    col = JobGroup.failed_jobs if failed else JobGroup.completed_jobs

    result = await session.execute(
        update(JobGroup)
        .where(JobGroup.search_id == search_id)
        .values({col: col + 1})
        .returning(
            JobGroup.total_jobs,
            JobGroup.completed_jobs,
            JobGroup.failed_jobs,
        )
    )
    row = result.fetchone()
    if row is None:
        return False
    return (row.completed_jobs + row.failed_jobs) >= row.total_jobs


async def create_search_result(
    session: AsyncSession,
    search_id: UUID,
    application_number: str,
    invention_title: str,
    claims_text: str,
    claims_source: str,
    pinecone_vector_id: str,
) -> SearchResult:
    """Create SearchResult"""
    result = SearchResult(
        search_id=search_id,
        application_number=application_number,
        invention_title=invention_title,
        claims_text=claims_text,
        claims_source=claims_source,
        pinecone_vector_id=pinecone_vector_id,
    )
    session.add(result)
    await session.flush()
    return result


async def update_result_similarity(
    session: AsyncSession,
    search_id: UUID,
    application_number: str,
    score: float,
) -> None:
    """Update similarity score"""
    await session.execute(
        update(SearchResult)
        .where(
            SearchResult.search_id == search_id,
            SearchResult.application_number == application_number,
        )
        .values(similarity_score=score)
    )


async def get_search_with_results(
    session: AsyncSession,
    search_id: UUID,
) -> Search | None:
    """Get Search + Results + JobGroup together (for API response)"""
    result = await session.execute(
        select(Search)
        .options(selectinload(Search.results), selectinload(Search.job_group))
        .where(Search.id == search_id)
    )
    return result.scalar_one_or_none()
