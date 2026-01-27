"""API routes for KIPRIS search.

Provides endpoints for direct KIPRIS freeSearch API access.
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

from kipris.client import KIPRISClient
from kipris.models import FreeSearchResult

from app.config import Settings

router = APIRouter(tags=["kipris"])


class KIPRISSearchRequest(BaseModel):
    """Request for KIPRIS search with structured keywords."""

    keywords: list[str] = Field(
        ..., description="Core keywords (AND logic between them)"
    )
    synonyms: dict[str, list[str]] = Field(
        default_factory=dict,
        description="Synonyms for each keyword (OR logic within group)",
    )
    max_results: int = Field(
        500, ge=1, le=2000, description="Maximum results to return"
    )


class KIPRISSearchResponse(BaseModel):
    """Response from KIPRIS freeSearch."""

    patents: list[FreeSearchResult]
    total_found: int
    collected: int
    search_query: str


@router.post(
    "/kipris/search", response_model=KIPRISSearchResponse, response_model_by_alias=False
)
async def search_kipris(request: KIPRISSearchRequest) -> KIPRISSearchResponse:
    """Search KIPRIS using freeSearchInfo API.

    Takes keywords and returns matching patents.
    Keywords are joined with spaces (OR logic in KIPRIS).
    """
    settings = Settings()

    if not settings.kipris_service_key:
        raise HTTPException(status_code=500, detail="KIPRIS_SERVICE_KEY not configured")

    def clean_keyword(kw: str) -> str | None:
        """Clean a keyword: remove wildcards, skip if has spaces."""
        if not kw or not kw.strip():
            return None
        cleaned = kw.rstrip("*").strip()
        if not cleaned or " " in cleaned:
            return None
        return cleaned

    # Build structured search query:
    # (kw1+syn1+syn2)*(kw2+syn3+syn4)*...
    # OR within group, AND between groups
    query_groups = []

    for core_kw in request.keywords[:5]:  # Top 5 core keywords
        cleaned_core = clean_keyword(core_kw)
        if not cleaned_core:
            continue

        # Get synonyms for this keyword
        synonyms = request.synonyms.get(core_kw, [])

        # Build group: core + synonyms (OR connected with +)
        group_terms = [cleaned_core]
        for syn in synonyms:
            cleaned_syn = clean_keyword(syn)
            if cleaned_syn and cleaned_syn not in group_terms:
                group_terms.append(cleaned_syn)

        # Create group: (term1+term2+term3)
        if group_terms:
            query_groups.append("(" + "+".join(group_terms) + ")")

    # Join groups with AND (*)
    search_query = "*".join(query_groups) if query_groups else ""
    logger.info(f"KIPRIS structured query: {search_query[:200]}...")

    if not search_query:
        raise HTTPException(status_code=400, detail="No valid keywords provided")

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
