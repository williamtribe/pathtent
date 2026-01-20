import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pgqueuer.queries import Queries
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_pgqueuer_queries
from app.api.schemas import (
    ConfigureSearchRequest,
    ConfigureSearchResponse,
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    SearchStatusResponse,
)
from app.repository import create_search, get_search_with_results
from app.services.query_generator import generate_search_query

router = APIRouter(tags=["search"])


@router.post("/search/configure")
async def configure_search(
    request: ConfigureSearchRequest,
) -> ConfigureSearchResponse:
    """Generate KIPRIS search query using LLM"""
    query = await generate_search_query(request.text)
    return ConfigureSearchResponse(search_query=query)


@router.post("/search/request", status_code=201)
async def request_search(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
    queries: Queries = Depends(get_pgqueuer_queries),
) -> SearchResponse:
    """Create search and enqueue background processing"""
    search = await create_search(
        session=db,
        original_text=request.original_text,
        search_query=request.search_query,
    )
    await db.commit()

    await queries.enqueue(
        entrypoint="search_patents",
        payload=json.dumps({"search_id": str(search.id)}).encode(),
    )

    return SearchResponse(search_id=search.id)


@router.get("/search/{search_id}")
async def get_search_result(
    search_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> SearchStatusResponse:
    """Get search status and results"""
    search = await get_search_with_results(db, search_id)
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")

    progress = None
    if search.job_group:
        progress = {
            "total": search.job_group.total_jobs,
            "completed": search.job_group.completed_jobs,
            "failed": search.job_group.failed_jobs,
        }

    results = None
    if search.status == "completed":
        results = [
            SearchResultItem(
                application_number=result.application_number,
                invention_title=result.invention_title,
                similarity_score=result.similarity_score,
                claims_source=result.claims_source,
            )
            for result in search.results
            if result.similarity_score is not None and result.similarity_score >= 0.7
        ]

    return SearchStatusResponse(
        status=search.status,
        results=results,
        error=search.error_message,
        progress=progress,
    )
