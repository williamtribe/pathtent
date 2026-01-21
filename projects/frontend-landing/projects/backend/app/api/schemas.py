from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.services.query_generator import KIPRISSearchQuery


class ConfigureSearchRequest(BaseModel):
    """Request to generate KIPRIS search query from text"""

    text: str


class ConfigureSearchResponse(BaseModel):
    """Response with generated search query"""

    search_query: KIPRISSearchQuery


class SearchRequest(BaseModel):
    """Request to start patent search"""

    search_query: str  # Search term string
    original_text: str  # Original document text


class SearchResponse(BaseModel):
    """Response with search ID for polling"""

    search_id: UUID


class SearchResultItem(BaseModel):
    """Single patent result item"""

    application_number: str
    invention_title: str
    similarity_score: float
    claims_source: str  # "claims" | "full_doc"


class SearchStatusResponse(BaseModel):
    """Search status and results"""

    status: Literal["pending", "processing", "completed", "failed"]
    results: list[SearchResultItem] | None = None  # Only when completed
    error: str | None = None  # Only when failed
    progress: dict | None = None  # {"total": N, "completed": M, "failed": F}
