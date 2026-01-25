"""Patent collection API schemas for KIPRIS data retrieval."""

from pydantic import BaseModel, Field


class CollectRequest(BaseModel):
    """Request model for collecting patents from KIPRIS."""

    formula: str = Field(
        ...,
        min_length=3,
        description="KIPRIS search formula to use for patent collection",
    )
    max_results: int = Field(
        default=500,
        ge=1,
        le=5000,
        description="Maximum number of patents to collect (1-5000)",
    )


class PatentItem(BaseModel):
    """Single patent item from KIPRIS search results."""

    application_number: str = Field(
        ...,
        description="Patent application number",
    )
    title: str = Field(
        ...,
        description="Invention title (Korean)",
    )
    abstract: str | None = Field(
        default=None,
        description="Patent abstract text",
    )
    ipc_codes: list[str] = Field(
        default_factory=list,
        description="IPC classification codes",
    )
    applicant: str | None = Field(
        default=None,
        description="Applicant name",
    )
    application_date: str | None = Field(
        default=None,
        description="Application date (YYYY-MM-DD format)",
    )
    publication_number: str | None = Field(
        default=None,
        description="Publication number if published",
    )
    register_number: str | None = Field(
        default=None,
        description="Registration number if registered",
    )


class CollectResponse(BaseModel):
    """Response model for patent collection results."""

    patents: list[PatentItem] = Field(
        default_factory=list,
        description="List of collected patents",
    )
    total: int = Field(
        ...,
        description="Total number of patents matching the search formula",
    )
    collected: int = Field(
        ...,
        description="Number of patents actually collected (may be less than total)",
    )
    formula: str = Field(
        ...,
        description="The search formula used for collection",
    )
