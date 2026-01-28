"""
API routes for LDA topic modeling analysis.

Provides endpoints for performing LDA analysis on patent texts.
"""

import logging

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import RequireAPIKey, limiter
from app.schemas.lda import LDARequest, LDAResponse
from app.services.lda_analyzer import analyze_lda
from app.services.quantitative import analyze_quantitative

router = APIRouter(tags=["analysis"])


@router.post("/analysis/lda", response_model=LDAResponse)
@limiter.limit("10/minute")
async def analyze_lda_endpoint(
    body: LDARequest, request: Request, _auth: RequireAPIKey
) -> LDAResponse:
    """
    Perform LDA topic modeling on patent texts.

    Takes a collection of patents with text content and performs
    Latent Dirichlet Allocation to extract topics and classify documents.
    Supports automatic topic number selection or user-specified count.

    If patent metadata (application_date, ipc_codes) is provided,
    quantitative analysis is included in the response.
    """
    try:
        result = await analyze_lda(body)

        # Perform quantitative analysis if metadata is available
        has_metadata = any(
            (isinstance(p, dict) and p.get("metadata"))
            or (not isinstance(p, dict) and p.metadata is not None)
            for p in body.patents
        )

        if has_metadata:
            quantitative_result = analyze_quantitative(
                patents=list(body.patents),
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
        logger.warning("LDA validation error: %s", e)
        raise HTTPException(
            status_code=400,
            detail="입력값 검증 오류가 발생했습니다",
        )
    except Exception as e:
        logger.exception("LDA analysis failed")
        raise HTTPException(
            status_code=500,
            detail="LDA 분석 중 오류가 발생했습니다",
        )
