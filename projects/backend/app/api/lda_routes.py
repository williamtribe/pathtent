"""
API routes for LDA topic modeling analysis.

Provides endpoints for performing LDA analysis on patent texts.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.lda import LDARequest, LDAResponse
from app.services.lda_analyzer import analyze_lda
from app.services.quantitative import analyze_quantitative

router = APIRouter(tags=["analysis"])


@router.post("/analysis/lda", response_model=LDAResponse)
async def analyze_lda_endpoint(request: LDARequest) -> LDAResponse:
    """
    Perform LDA topic modeling on patent texts.

    Takes a collection of patents with text content and performs
    Latent Dirichlet Allocation to extract topics and classify documents.
    Supports automatic topic number selection or user-specified count.

    If patent metadata (application_date, ipc_codes) is provided,
    quantitative analysis is included in the response.
    """
    try:
        result = await analyze_lda(request)

        # Perform quantitative analysis if metadata is available
        has_metadata = any(
            (isinstance(p, dict) and p.get("metadata"))
            or (not isinstance(p, dict) and p.metadata is not None)
            for p in request.patents
        )

        if has_metadata:
            quantitative_result = analyze_quantitative(
                patents=list(request.patents),
                topics=result.topics,
                documents=result.documents,
            )
            # Create new response with quantitative data
            result = LDAResponse(
                topics=result.topics,
                documents=result.documents,
                coherence_score=result.coherence_score,
                num_topics=result.num_topics,
                vocabulary_size=result.vocabulary_size,
                quantitative=quantitative_result,
            )

        return result
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LDA analysis failed: {e!s}",
        )
