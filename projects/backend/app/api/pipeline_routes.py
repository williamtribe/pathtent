"""Unified analysis pipeline API routes.

Single endpoint for: Natural Language → Search → Noise Removal → LDA
"""

import logging

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import RequireAPIKey, limiter

logger = logging.getLogger(__name__)

from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.pipeline import run_pipeline

router = APIRouter(tags=["pipeline"])


@router.post("/analysis/pipeline", response_model=PipelineResponse)
@limiter.limit("5/minute")
async def analyze_pipeline(
    body: PipelineRequest, request: Request, _auth: RequireAPIKey
) -> PipelineResponse:
    """Run the unified analysis pipeline.

    This endpoint orchestrates the entire analysis flow:
    1. **Keyword Extraction**: AI extracts keywords, synonyms, IPC codes from description
    2. **KIPRIS Search**: Search patents using extracted keywords
    3. **Noise Removal**: Filter irrelevant patents using AI-generated config
    4. **LDA Analysis**: Topic modeling on filtered patents

    The response includes:
    - Results from each step (success/failure status)
    - AI-generated config (keywords, IPC codes, noise removal settings)
    - Final LDA topics and document assignments

    Users can optionally provide custom noise_removal_config to override AI-generated settings.
    """
    try:
        result = await run_pipeline(body)
        return result
    except Exception as e:
        logger.exception("Pipeline failed")
        raise HTTPException(
            status_code=500, detail="파이프라인 처리 중 오류가 발생했습니다"
        )
