"""Noise removal schemas for patent filtering pipeline.

4-step pipeline:
1. Duplicate removal (by application_number)
2. IPC code filtering (include/exclude patterns)
3. Keyword matching (OR logic, case-insensitive, partial match)
4. Embedding filtering (optional, for ambiguous cases)
"""

from pydantic import BaseModel, Field

from kipris.models import FreeSearchResult


class NoiseRemovalConfig(BaseModel):
    """Configuration for noise removal pipeline."""

    # Category definition
    main_category: str = Field(
        ..., description="Main category (e.g., 'Display Sensor Technology')"
    )
    sub_categories: list[str] = Field(
        default_factory=list,
        description="Sub categories (e.g., ['touch', 'pressure', 'fingerprint'])",
    )

    # IPC filtering (step 2)
    include_ipc: list[str] = Field(
        default_factory=list,
        description="IPC patterns to include (e.g., ['G06F-003*', 'G06K-009*']). Wildcard * supported.",
    )
    exclude_ipc: list[str] = Field(
        default_factory=list,
        description="IPC patterns to exclude (e.g., ['E04*', 'B23K*']). Wildcard * supported.",
    )

    # Keyword filtering (step 3) - OR logic
    required_keywords: list[str] = Field(
        default_factory=list,
        description="Keywords to match (OR logic). Patent kept if ANY keyword found in title/abstract. "
        "Include variations and common typos (e.g., ['display', 'Display', 'display panel', 'sensor']).",
    )
    exclude_keywords: list[str] = Field(
        default_factory=list,
        description="Keywords to exclude. Patent removed if ANY found (e.g., ['concrete', 'welding']).",
    )

    # Embedding filtering (step 4) - optional
    use_embedding_filter: bool = Field(
        default=False, description="Enable embedding-based similarity filtering"
    )
    embedding_threshold: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score for embedding filter",
    )
    embedding_query: str | None = Field(
        default=None,
        description="Query text for embedding similarity. Defaults to main_category if not provided.",
    )


class ExcludedPatent(BaseModel):
    """A patent excluded from the results with reason."""

    patent: FreeSearchResult
    excluded_at_step: int = Field(
        ..., ge=1, le=4, description="Step number where excluded (1-4)"
    )
    reason: str = Field(
        ...,
        description="Exclusion reason: 'duplicate', 'ipc_excluded', 'ipc_not_included', "
        "'keyword_missing', 'keyword_excluded', 'low_similarity'",
    )
    detail: str | None = Field(
        default=None, description="Additional detail (e.g., matched exclude keyword)"
    )


class ExcludedSummary(BaseModel):
    """Summary of excluded patents by reason."""

    duplicate: int = Field(
        default=0, description="Count excluded for duplicate application_number"
    )
    ipc_excluded: int = Field(
        default=0, description="Count excluded for matching exclude_ipc pattern"
    )
    ipc_not_included: int = Field(
        default=0, description="Count excluded for not matching any include_ipc pattern"
    )
    keyword_missing: int = Field(
        default=0, description="Count excluded for missing all required keywords"
    )
    keyword_excluded: int = Field(
        default=0, description="Count excluded for matching an exclude keyword"
    )
    low_similarity: int = Field(
        default=0, description="Count excluded for low embedding similarity"
    )


class NoiseRemovalResult(BaseModel):
    """Result of the noise removal pipeline."""

    # Counts at each step
    input_count: int = Field(..., description="Total patents received as input")
    step1_count: int = Field(..., description="Count after duplicate removal")
    step2_count: int = Field(..., description="Count after IPC filtering")
    step3_count: int = Field(..., description="Count after keyword matching")
    step4_count: int | None = Field(
        default=None, description="Count after embedding filtering (null if not used)"
    )
    final_count: int = Field(..., description="Final valid patent count")

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
