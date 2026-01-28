"""
API routes for patent data collection from KIPRIS.

Provides endpoints for collecting patents using search formulas.
"""

import logging

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import RequireAPIKey, limiter

logger = logging.getLogger(__name__)

from app.schemas.collection import CollectRequest, CollectResponse
from app.services.patent_collector import collect_patents

router = APIRouter(tags=["collection"])


@router.post("/patent/collect", response_model=CollectResponse)
@limiter.limit("10/minute")
async def collect_patents_endpoint(
    request: CollectRequest, req: Request, _auth: RequireAPIKey
) -> CollectResponse:
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
        logger.warning("Patent collection validation error: %s", e)
        raise HTTPException(
            status_code=400,
            detail="입력값 검증 오류가 발생했습니다",
        )
    except Exception as e:
        logger.exception("Patent collection failed")
        raise HTTPException(
            status_code=500,
            detail="특허 수집 중 오류가 발생했습니다",
        )
