"""API routes for noise removal pipeline."""

from fastapi import APIRouter, HTTPException

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
async def process_noise_removal(
    request: NoiseRemovalRequest,
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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Noise removal failed: {str(e)}")
