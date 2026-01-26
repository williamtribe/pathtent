"""API routes for KIPRIS search.

Provides endpoints for direct KIPRIS freeSearch API access.
"""

# @TODO-1 — KIPRIS freeSearch wrapper endpoint

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from kipris.client import KIPRISClient
from kipris.models import FreeSearchResult

from app.config import Settings

router = APIRouter(tags=["kipris"])


class KIPRISSearchRequest(BaseModel):
    """Request for KIPRIS freeSearch."""

    keywords: list[str] = Field(..., description="Keywords to search (OR logic)")
    max_results: int = Field(
        500, ge=1, le=2000, description="Maximum results to return"
    )


class KIPRISSearchResponse(BaseModel):
    """Response from KIPRIS freeSearch."""

    patents: list[FreeSearchResult]
    total_found: int
    collected: int
    search_query: str


@router.post("/kipris/search", response_model=KIPRISSearchResponse)
async def search_kipris(request: KIPRISSearchRequest) -> KIPRISSearchResponse:
    """Search KIPRIS using freeSearchInfo API.

    Takes keywords and returns matching patents.
    Keywords are joined with spaces (OR logic in KIPRIS).
    """
    settings = Settings()

    if not settings.kipris_service_key:
        raise HTTPException(status_code=500, detail="KIPRIS_SERVICE_KEY not configured")

    # Build search query (space-separated = OR logic)
    # Use more keywords for diverse search, deduplicate
    unique_keywords = list(
        dict.fromkeys(request.keywords)
    )  # Preserve order, remove duplicates
    search_query = " ".join(
        unique_keywords[:15]
    )  # Use up to 15 keywords for broader coverage

    try:
        patents: list[FreeSearchResult] = []
        total_found = 0

        async with KIPRISClient(service_key=settings.kipris_service_key) as client:
            # First page
            from kipris.models import FreeSearchParams

            search_params = FreeSearchParams.model_construct(
                word=search_query,
                docs_start=1,
                docs_count=min(request.max_results, 500),
                patent=True,
                utility=True,
            )

            response = await client.free_search(search_params)
            patents = list(response.results)
            total_found = response.total_count or len(patents)
            collected = len(patents)

            # Collect more pages if needed
            page = 2
            while collected < request.max_results and collected < total_found:
                search_params = FreeSearchParams.model_construct(
                    word=search_query,
                    docs_start=collected + 1,
                    docs_count=min(request.max_results - collected, 500),
                    patent=True,
                    utility=True,
                )

                page_response = await client.free_search(search_params)
                if not page_response.results:
                    break
                patents.extend(page_response.results)
                collected = len(patents)
                page += 1
                if page > 10:  # Safety limit
                    break

        return KIPRISSearchResponse(
            patents=patents,
            total_found=total_found,
            collected=len(patents),
            search_query=search_query,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KIPRIS search failed: {str(e)}")
