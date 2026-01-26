"""API routes for noise removal pipeline."""

import os
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.schemas.noise_removal import (
    NoiseRemovalRequest,
    NoiseRemovalResponse,
)
from app.services.embedding import GeminiEmbeddingService
from app.services.noise_removal import NoiseRemovalService

router = APIRouter(tags=["noise-removal"])


@router.post("/noise-removal/process", response_model=NoiseRemovalResponse)
async def process_noise_removal(
    request: NoiseRemovalRequest,
    include_excluded: Annotated[
        bool, Query(description="Include list of excluded patents in response")
    ] = False,
) -> NoiseRemovalResponse:
    """Process patents through the 4-step noise removal pipeline.

    Steps:
    1. Duplicate removal (by application_number)
    2. IPC code filtering (include/exclude patterns)
    3. Keyword matching (OR logic - any required keyword match keeps)
    4. Embedding filtering (optional, if use_embedding_filter=true)

    Returns counts at each step and final valid patents.
    """
    try:
        # Initialize embedding service if needed
        embedding_service = None
        if request.config.use_embedding_filter:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise HTTPException(
                    status_code=500,
                    detail="GEMINI_API_KEY not configured but embedding filter requested",
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
            excluded_patents=excluded_patents if include_excluded else None,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Noise removal failed: {str(e)}")
