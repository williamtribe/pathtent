"""Unified analysis pipeline schemas.

Pipeline flow: Natural Language → Keywords/IPC → Search → Noise Removal → LDA
"""

from pydantic import BaseModel, Field

from kipris.models import FreeSearchResult
from app.schemas.lda import LDAResponse
from app.schemas.noise_removal import NoiseRemovalConfig, NoiseRemovalSummary


class PipelineRequest(BaseModel):
    """Request for unified analysis pipeline."""

    description: str = Field(
        ...,
        min_length=10,
        description="Natural language description of the technology/invention to analyze",
    )
    max_patents: int = Field(
        default=500,
        ge=10,
        le=2000,
        description="Maximum number of patents to collect from KIPRIS",
    )
    num_topics: int | str = Field(
        default="auto",
        description="Number of LDA topics (integer or 'auto' for automatic detection)",
    )
    enable_noise_removal: bool = Field(
        default=True,
        description="Enable noise removal filtering",
    )
    noise_removal_config: NoiseRemovalConfig | None = Field(
        default=None,
        description="Optional custom noise removal config (auto-generated if not provided)",
    )


class PipelineStepResult(BaseModel):
    """Result of a single pipeline step."""

    step: str = Field(..., description="Step name")
    status: str = Field(..., description="'completed', 'skipped', or 'failed'")
    count: int | None = Field(default=None, description="Item count after this step")
    message: str | None = Field(
        default=None, description="Additional info or error message"
    )


class SearchResultSummary(BaseModel):
    """Summary of search results (without full patent data)."""

    total_found: int = Field(..., description="Total patents found in KIPRIS")
    collected: int = Field(..., description="Patents actually collected")
    search_keywords: list[str] = Field(
        default_factory=list, description="Keywords used for search"
    )


class PipelineResponse(BaseModel):
    """Response from unified analysis pipeline."""

    # Pipeline metadata
    steps: list[PipelineStepResult] = Field(
        default_factory=list, description="Results of each pipeline step"
    )

    # Generated config (for user to view/edit)
    generated_keywords: list[str] = Field(
        default_factory=list, description="AI-generated keywords"
    )
    generated_synonyms: dict[str, list[str]] = Field(
        default_factory=dict, description="AI-generated synonyms"
    )
    generated_ipc_codes: list[str] = Field(
        default_factory=list, description="AI-generated IPC codes"
    )
    generated_noise_config: NoiseRemovalConfig | None = Field(
        default=None, description="Auto-generated noise removal config"
    )

    # Results
    search_summary: SearchResultSummary | None = Field(
        default=None, description="Search results summary"
    )
    noise_removal_summary: NoiseRemovalSummary | None = Field(
        default=None, description="Noise removal summary"
    )
    filtered_patents: list[FreeSearchResult] = Field(
        default_factory=list,
        description="Patents after noise removal (for LDA re-run with different topic count)",
    )
    lda_result: LDAResponse | None = Field(
        default=None, description="LDA analysis results"
    )

    # Error handling
    error: str | None = Field(
        default=None, description="Error message if pipeline failed"
    )
