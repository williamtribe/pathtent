# @TODO-8 — Create patent collection API routes
"""
API routes for patent data collection from KIPRIS.

Provides endpoints for collecting patents using search formulas.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.collection import CollectRequest, CollectResponse
from app.services.patent_collector import collect_patents

router = APIRouter(tags=["collection"])


@router.post("/patent/collect", response_model=CollectResponse)
async def collect_patents_endpoint(request: CollectRequest) -> CollectResponse:
    """
    Collect patents from KIPRIS using a search formula.

    Takes a KIPRIS search formula and collects matching patents
    with titles, abstracts, IPC codes, and other metadata.
    Supports pagination up to max_results limit.
    """
    try:
        result = await collect_patents(request)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Patent collection failed: {e!s}",
        )
