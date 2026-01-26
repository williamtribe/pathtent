"""Noise removal schemas for patent filtering pipeline.

2-step pipeline:
1. Duplicate removal (by application_number)
2. Embedding similarity filtering (batch processing)
"""

from pydantic import BaseModel, Field

from kipris.models import FreeSearchResult


class NoiseRemovalConfig(BaseModel):
    """Configuration for noise removal pipeline."""

    # Query for embedding similarity
    embedding_query: str = Field(
        ...,
        description="Query text for embedding similarity (user's technology description)",
    )
    embedding_threshold: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum cosine similarity score (0.0-1.0). Higher = stricter filtering.",
    )


class ExcludedPatent(BaseModel):
    """A patent excluded from the results with reason."""

    patent: FreeSearchResult
    excluded_at_step: int = Field(
        ...,
        ge=1,
        le=2,
        description="Step number where excluded (1=duplicate, 2=low_similarity)",
    )
    reason: str = Field(
        ...,
        description="Exclusion reason: 'duplicate' or 'low_similarity'",
    )
    similarity_score: float | None = Field(
        default=None,
        description="Similarity score (only for low_similarity exclusions)",
    )


class ExcludedSummary(BaseModel):
    """Summary of excluded patents by reason."""

    duplicate: int = Field(
        default=0, description="Count excluded for duplicate application_number"
    )
    low_similarity: int = Field(
        default=0, description="Count excluded for low embedding similarity"
    )


class NoiseRemovalResult(BaseModel):
    """Result of the noise removal pipeline."""

    # Counts at each step
    input_count: int = Field(..., description="Total patents received as input")
    after_dedup_count: int = Field(..., description="Count after duplicate removal")
    final_count: int = Field(..., description="Final count after embedding filtering")

    # Results
    valid_patents: list[FreeSearchResult] = Field(
        default_factory=list, description="Patents that passed all filters"
    )
    excluded_summary: ExcludedSummary = Field(
        default_factory=ExcludedSummary, description="Summary of exclusions by reason"
    )


class NoiseRemovalRequest(BaseModel):
    """Request for noise removal processing."""

    patents: list[FreeSearchResult] = Field(..., description="Patents to filter")
    config: NoiseRemovalConfig = Field(..., description="Filtering configuration")


class NoiseRemovalResponse(BaseModel):
    """Response from noise removal processing."""

    result: NoiseRemovalResult = Field(..., description="Filtering result")
    excluded_patents: list[ExcludedPatent] | None = Field(
        default=None,
        description="List of excluded patents with reasons (only if include_excluded=true in request)",
    )


# Pipeline integration types
class NoiseRemovalSummary(BaseModel):
    """Summary for pipeline response."""

    input_count: int
    after_dedup_count: int
    output_count: int
    duplicate_removed: int
    low_similarity_removed: int
