"""Formula generation schemas for KIPRIS search formula service."""

from pydantic import BaseModel, Field


class FormulaOptions(BaseModel):
    """Options for formula generation."""

    include_ipc: bool = Field(
        default=True,
        description="Include IPC classification codes in the formula",
    )
    include_synonyms: bool = Field(
        default=True,
        description="Expand keywords with synonyms and related terms",
    )
    target_precision: str = Field(
        default="balanced",
        description="Target precision level: 'high' (fewer results), 'balanced', 'recall' (more results)",
    )


class FormulaGenerateRequest(BaseModel):
    """Request model for generating a KIPRIS search formula."""

    text: str = Field(
        ...,
        min_length=10,
        description="Invention description or idea text to generate search formula from",
    )
    options: FormulaOptions | None = Field(
        default=None,
        description="Optional configuration for formula generation",
    )


class FormulaImproveRequest(BaseModel):
    """Request model for improving an existing search formula."""

    original_formula: str = Field(
        ...,
        min_length=5,
        description="The original KIPRIS search formula to improve",
    )
    original_keywords: list[str] = Field(
        ...,
        description="Keywords from the original formula generation",
    )
    original_synonyms: dict[str, list[str]] = Field(
        ...,
        description="Synonym mappings from the original formula generation",
    )
    original_excluded_terms: list[str] = Field(
        default_factory=list,
        description="Excluded terms from the original formula generation",
    )
    feedback: str = Field(
        ...,
        description="User feedback: 'too_many' (too many results), 'too_few' (too few results), 'noisy' (irrelevant results)",
    )
    result_count: int | None = Field(
        default=None,
        ge=0,
        description="Number of results the original formula returned (if known)",
    )
    additional_context: str | None = Field(
        default=None,
        description="Additional context or specific requirements for improvement",
    )


class FormulaResult(BaseModel):
    """Response model containing the generated KIPRIS search formula."""

    formula: str = Field(
        ...,
        description="The generated KIPRIS search formula ready to use",
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="Core technical keywords extracted from the input",
    )
    synonyms: dict[str, list[str]] = Field(
        default_factory=dict,
        description="Synonym mappings for each core keyword",
    )
    ipc_codes: list[str] = Field(
        default_factory=list,
        description="Recommended IPC classification codes",
    )
    excluded_terms: list[str] = Field(
        default_factory=list,
        description="Terms excluded using NOT operator to reduce noise",
    )
    explanation: str = Field(
        default="",
        description="Explanation of the formula structure and search strategy",
    )
    tips: list[str] = Field(
        default_factory=list,
        description="Tips for refining or testing the formula",
    )
