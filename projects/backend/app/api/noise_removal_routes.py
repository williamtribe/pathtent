"""API routes for noise removal pipeline."""

import logging

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import RequireAPIKey, limiter

logger = logging.getLogger(__name__)

from app.config import Settings
from app.schemas.noise_removal import (
    NoiseRemovalRequest,
    NoiseRemovalResponse,
)
from app.services.embedding import GeminiEmbeddingService
from app.services.noise_removal import NoiseRemovalService

router = APIRouter(tags=["noise-removal"])


@router.post(
    "/noise-removal/process",
    response_model=NoiseRemovalResponse,
    response_model_by_alias=False,
)
@limiter.limit("10/minute")
async def process_noise_removal(
    request: NoiseRemovalRequest, req: Request, _auth: RequireAPIKey
) -> NoiseRemovalResponse:
    """Process patents through the 2-step noise removal pipeline.

    Steps:
    1. Duplicate removal (by application_number)
    2. Embedding filtering (semantic similarity with embedding_query)

    Returns counts at each step and final valid patents.
    """
    settings = Settings()

    try:
        # Initialize embedding service (required for the new simplified pipeline)
        api_key = settings.google_api_key
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GOOGLE_API_KEY not configured for embedding service",
            )
        embedding_service = GeminiEmbeddingService(api_key=api_key)

        # Process through pipeline
        service = NoiseRemovalService(embedding_service=embedding_service)
        result, excluded_patents = await service.process(
            patents=request.patents,
            config=request.config,
        )

        return NoiseRemovalResponse(
            result=result,
            excluded_patents=excluded_patents,
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("Noise removal validation error: %s", e)
        raise HTTPException(status_code=400, detail="입력값 검증 오류가 발생했습니다")
    except Exception as e:
        logger.exception("Noise removal failed")
        raise HTTPException(
            status_code=500, detail="노이즈 제거 처리 중 오류가 발생했습니다"
        )
