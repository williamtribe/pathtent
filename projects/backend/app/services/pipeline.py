"""Unified analysis pipeline service.

Orchestrates: Natural Language → Keywords/IPC extraction → KIPRIS Search → Noise Removal → LDA

The key insight is that KIPRIS API doesn't support complex search formulas (TAC:, IPC: syntax),
so we search with simple keywords and use noise removal for precise filtering.
"""

import logging

from kipris.client import KIPRISClient
from kipris.models import FreeSearchParams, FreeSearchResult

from app.config import Settings
from app.schemas.lda import LDARequest, LDAResponse
from app.schemas.noise_removal import NoiseRemovalConfig
from app.schemas.pipeline import (
    NoiseRemovalSummary,
    PipelineRequest,
    PipelineResponse,
    PipelineStepResult,
    SearchResultSummary,
)
from app.services.formula_generator import generate_formula
from app.services.lda_analyzer import LDAAnalyzer
from app.services.noise_removal import NoiseRemovalService

logger = logging.getLogger(__name__)


def generate_noise_config_from_formula(
    description: str,
    keywords: list[str],
    synonyms: dict[str, list[str]],
    ipc_codes: list[str],
    excluded_terms: list[str],
) -> NoiseRemovalConfig:
    """Generate NoiseRemovalConfig from formula generation output.

    Args:
        description: Original natural language description
        keywords: Core keywords from formula generation
        synonyms: Synonym mappings
        ipc_codes: IPC codes (format: "B60L: description...")
        excluded_terms: Terms to exclude

    Returns:
        NoiseRemovalConfig ready for noise removal
    """
    # Flatten all keywords and synonyms for required_keywords (OR logic)
    required_keywords: list[str] = []
    for kw in keywords:
        required_keywords.append(kw)
    for kw, syns in synonyms.items():
        required_keywords.extend(syns)

    # Remove duplicates while preserving order
    seen: set[str] = set()
    unique_keywords: list[str] = []
    for kw in required_keywords:
        kw_lower = kw.lower()
        if kw_lower not in seen:
            seen.add(kw_lower)
            unique_keywords.append(kw)

    # Extract raw IPC codes for filtering (e.g., "B60L" from "B60L: Electric...")
    include_ipc: list[str] = []
    for ipc in ipc_codes:
        if ":" in ipc:
            code = ipc.split(":")[0].strip().replace(" ", "")
            # Add wildcard for subclass matching
            include_ipc.append(f"{code}*")
        else:
            include_ipc.append(f"{ipc.replace(' ', '')}*")

    return NoiseRemovalConfig(
        main_category=description[:100],  # Truncate if too long
        sub_categories=keywords[:5],  # First 5 keywords as sub-categories
        include_ipc=include_ipc,
        exclude_ipc=[],  # User can add later
        required_keywords=unique_keywords,
        exclude_keywords=excluded_terms,
        use_embedding_filter=False,  # Off by default, user can enable
        embedding_threshold=0.5,
    )


def build_simple_search_query(
    keywords: list[str], synonyms: dict[str, list[str]]
) -> str:
    """Build a simple OR-based search query from keywords.

    Since KIPRIS freeSearchInfo doesn't support complex syntax,
    we create a simple keyword query and rely on noise removal for filtering.

    Args:
        keywords: Core keywords
        synonyms: Synonym mappings

    Returns:
        Simple search query string (keywords joined with spaces = OR logic in KIPRIS)
    """
    # Use main keywords only (not all synonyms to avoid too broad search)
    # KIPRIS treats space-separated terms as OR
    search_terms = keywords[:5]  # Limit to top 5 keywords
    return " ".join(search_terms)


async def run_pipeline(request: PipelineRequest) -> PipelineResponse:
    """Run the unified analysis pipeline.

    Steps:
    1. Extract keywords/IPC from natural language (AI)
    2. Search KIPRIS with simple keywords
    3. Apply noise removal (using AI-generated config)
    4. Run LDA analysis

    Args:
        request: Pipeline request with description and options

    Returns:
        PipelineResponse with results from each step
    """
    settings = Settings()
    steps: list[PipelineStepResult] = []
    response = PipelineResponse()

    # =========================================================================
    # Step 1: AI extracts keywords, synonyms, IPC codes
    # =========================================================================
    try:
        logger.info(
            f"Step 1: Extracting keywords from description ({len(request.description)} chars)"
        )
        formula_result = await generate_formula(request.description)  # type: ignore[call-arg]

        response.generated_keywords = formula_result.keywords
        response.generated_synonyms = formula_result.synonyms
        response.generated_ipc_codes = formula_result.ipc_codes
        response.generated_noise_config = generate_noise_config_from_formula(
            description=request.description,
            keywords=formula_result.keywords,
            synonyms=formula_result.synonyms,
            ipc_codes=formula_result.ipc_codes,
            excluded_terms=formula_result.excluded_terms,
        )

        steps.append(
            PipelineStepResult(
                step="keyword_extraction",
                status="completed",
                count=len(formula_result.keywords),
                message=f"Extracted {len(formula_result.keywords)} keywords, {len(formula_result.ipc_codes)} IPC codes",
            )
        )

    except Exception as e:
        logger.error(f"Step 1 failed: {e}")
        steps.append(
            PipelineStepResult(
                step="keyword_extraction",
                status="failed",
                message=str(e),
            )
        )
        response.steps = steps
        response.error = f"Keyword extraction failed: {e}"
        return response

    # =========================================================================
    # Step 2: Search KIPRIS with simple keywords
    # =========================================================================
    try:
        search_query = build_simple_search_query(
            formula_result.keywords, formula_result.synonyms
        )
        logger.info(f"Step 2: Searching KIPRIS with query: {search_query}")

        patents: list[FreeSearchResult] = []
        total_found = 0

        async with KIPRISClient(
            service_key=settings.kipris_service_key or ""
        ) as kipris_client:
            # First page - use model_construct to bypass validation since type checker doesn't understand Pydantic aliases
            search_params = FreeSearchParams.model_construct(
                word=search_query,
                docs_start=1,
                docs_count=min(request.max_patents, 500),
                patent=True,
                utility=True,
            )

            search_response = await kipris_client.free_search(search_params)
            patents = list(search_response.results)

            # Collect more pages if needed
            total_found = search_response.total_count or len(patents)
            collected = len(patents)

            # If we need more patents and there are more available
            page = 2
            while collected < request.max_patents and collected < total_found:
                search_params = FreeSearchParams.model_construct(
                    word=search_query,
                    docs_start=collected + 1,
                    docs_count=min(request.max_patents - collected, 500),
                    patent=True,
                    utility=True,
                )

                page_response = await kipris_client.free_search(search_params)
                if not page_response.results:
                    break
                patents.extend(page_response.results)
                collected = len(patents)
                page += 1
                if page > 10:  # Safety limit
                    break

        response.search_summary = SearchResultSummary(
            total_found=total_found,
            collected=collected,
            search_keywords=formula_result.keywords,
        )

        steps.append(
            PipelineStepResult(
                step="kipris_search",
                status="completed",
                count=collected,
                message=f"Found {total_found} total, collected {collected}",
            )
        )

    except Exception as e:
        logger.error(f"Step 2 failed: {e}")
        steps.append(
            PipelineStepResult(
                step="kipris_search",
                status="failed",
                message=str(e),
            )
        )
        response.steps = steps
        response.error = f"KIPRIS search failed: {e}"
        return response

    # =========================================================================
    # Step 3: Noise removal (optional)
    # =========================================================================
    filtered_patents: list[FreeSearchResult] = patents

    if request.enable_noise_removal and patents:
        try:
            # Use custom config if provided, otherwise use generated config
            noise_config = (
                request.noise_removal_config or response.generated_noise_config
            )
            if noise_config is None:
                raise ValueError("No noise removal config available")

            logger.info(f"Step 3: Applying noise removal to {len(patents)} patents")
            noise_service = NoiseRemovalService()
            noise_result, _excluded = await noise_service.process(patents, noise_config)

            filtered_patents = noise_result.valid_patents

            response.noise_removal_summary = NoiseRemovalSummary(
                input_count=noise_result.input_count,
                output_count=noise_result.final_count,
                excluded_summary=noise_result.excluded_summary,
                config_used=noise_config,
            )

            steps.append(
                PipelineStepResult(
                    step="noise_removal",
                    status="completed",
                    count=noise_result.final_count,
                    message=f"Filtered {noise_result.input_count} → {noise_result.final_count} patents",
                )
            )

        except Exception as e:
            logger.error(f"Step 3 failed: {e}")
            steps.append(
                PipelineStepResult(
                    step="noise_removal",
                    status="failed",
                    message=str(e),
                )
            )
            # Continue with unfiltered patents
            filtered_patents = patents
    else:
        steps.append(
            PipelineStepResult(
                step="noise_removal",
                status="skipped",
                count=len(patents),
                message="Noise removal disabled",
            )
        )

    # =========================================================================
    # Step 4: LDA analysis
    # =========================================================================
    if filtered_patents:
        try:
            # Convert patents to LDA input format
            lda_documents = []
            for patent in filtered_patents:
                text_parts = []
                if patent.invention_name:
                    text_parts.append(patent.invention_name)
                if patent.abstract:
                    text_parts.append(patent.abstract)

                if text_parts:
                    lda_documents.append(
                        {
                            "id": patent.application_number
                            or f"patent-{len(lda_documents)}",
                            "text": " ".join(text_parts),
                        }
                    )

            if not lda_documents:
                raise ValueError("No valid documents for LDA analysis")

            # Determine number of topics
            num_topics: int | str = request.num_topics
            if isinstance(num_topics, str) and num_topics == "auto":
                # Auto-detect: rough heuristic based on document count
                doc_count = len(lda_documents)
                if doc_count < 50:
                    num_topics = 3
                elif doc_count < 200:
                    num_topics = 5
                elif doc_count < 500:
                    num_topics = 7
                else:
                    num_topics = 10

            logger.info(
                f"Step 4: Running LDA with {num_topics} topics on {len(lda_documents)} documents"
            )

            lda_request = LDARequest(
                patents=lda_documents,
                num_topics=num_topics,
            )

            analyzer = LDAAnalyzer()
            lda_response = await analyzer.analyze(lda_request)

            response.lda_result = lda_response

            steps.append(
                PipelineStepResult(
                    step="lda_analysis",
                    status="completed",
                    count=len(lda_documents),
                    message=f"Analyzed {len(lda_documents)} documents into {num_topics} topics",
                )
            )

        except Exception as e:
            logger.error(f"Step 4 failed: {e}")
            steps.append(
                PipelineStepResult(
                    step="lda_analysis",
                    status="failed",
                    message=str(e),
                )
            )
            response.error = f"LDA analysis failed: {e}"
    else:
        steps.append(
            PipelineStepResult(
                step="lda_analysis",
                status="skipped",
                message="No patents to analyze after filtering",
            )
        )

    response.steps = steps
    return response
