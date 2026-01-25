"""
API routes for LDA topic modeling analysis.

Provides endpoints for performing LDA analysis on patent texts.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from app.schemas.lda import LDARequest, LDAResponse
from app.services.lda_analyzer import analyze_lda, analyze_lda_with_viz

router = APIRouter(tags=["analysis"])


@router.post("/analysis/lda", response_model=LDAResponse)
async def analyze_lda_endpoint(request: LDARequest) -> LDAResponse:
    """
    Perform LDA topic modeling on patent texts.

    Takes a collection of patents with text content and performs
    Latent Dirichlet Allocation to extract topics and classify documents.
    Supports automatic topic number selection or user-specified count.
    """
    try:
        result = await analyze_lda(request)
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


@router.post("/analysis/lda/viz", response_class=HTMLResponse)
async def analyze_lda_viz_endpoint(request: LDARequest) -> HTMLResponse:
    """
    Perform LDA topic modeling and return pyLDAvis interactive visualization.

    Returns a complete HTML page with interactive topic exploration.
    Embed in iframe or open in new tab.
    """
    try:
        _, viz_html = await analyze_lda_with_viz(request)
        return HTMLResponse(content=viz_html)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LDA visualization failed: {e!s}",
        )
