# @TODO-3 — Unified pipeline API endpoint
"""Unified analysis pipeline API routes.

Single endpoint for: Natural Language → Search → Noise Removal → LDA
"""

from fastapi import APIRouter, HTTPException

from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.pipeline import run_pipeline

router = APIRouter(tags=["pipeline"])


@router.post("/analysis/pipeline", response_model=PipelineResponse)
async def analyze_pipeline(request: PipelineRequest) -> PipelineResponse:
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
        result = await run_pipeline(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")
