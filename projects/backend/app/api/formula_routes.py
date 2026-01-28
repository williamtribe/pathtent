"""
API routes for KIPRIS search formula generation.

Provides endpoints for generating and improving patent search formulas.
"""

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import RequireAPIKey, limiter
from app.schemas.formula import (
    FormulaAssembleRequest,
    FormulaAssembleResponse,
    FormulaBlocksResponse,
    FormulaGenerateRequest,
    FormulaImproveRequest,
    FormulaResult,
)
from app.services.formula_generator import (
    assemble_formula_from_blocks,
    generate_formula,
    generate_formula_blocks,
    improve_formula,
)

router = APIRouter(tags=["formula"])


@router.post("/formula/generate", response_model=FormulaResult)
@limiter.limit("20/minute")
async def generate_search_formula(
    body: FormulaGenerateRequest, request: Request, _auth: RequireAPIKey
) -> FormulaResult:
    """
    Generate a KIPRIS search formula from invention description.

    Takes an invention idea or technical description and generates
    an expert-level patent search formula ready to use in KIPRIS.
    """
    try:
        result = await generate_formula(
            text=body.text,
            options=body.options,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Formula generation failed: {e!s}",
        )


@router.post("/formula/improve", response_model=FormulaResult)
@limiter.limit("20/minute")
async def improve_search_formula(
    body: FormulaImproveRequest, request: Request, _auth: RequireAPIKey
) -> FormulaResult:
    """
    Improve an existing KIPRIS search formula based on feedback.

    Takes user feedback about search results (too many, too few, noisy)
    and adjusts the formula to better match the desired precision/recall.
    Requires original keywords and synonyms for rule-based formula reconstruction.
    """
    try:
        result = await improve_formula(
            original_formula=body.original_formula,
            original_keywords=body.original_keywords,
            original_synonyms=body.original_synonyms,
            original_excluded_terms=body.original_excluded_terms,
            feedback=body.feedback,
            result_count=body.result_count,
            additional_context=body.additional_context,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Formula improvement failed: {e!s}",
        )


@router.post("/formula/generate-blocks", response_model=FormulaBlocksResponse)
@limiter.limit("20/minute")
async def generate_search_formula_blocks(
    body: FormulaGenerateRequest, request: Request, _auth: RequireAPIKey
) -> FormulaBlocksResponse:
    """
    Generate a block-based KIPRIS search formula from invention description.

    Returns keyword blocks that users can edit, along with the assembled formula.
    Each block contains related keywords with configurable field and operator settings.
    """
    try:
        result = await generate_formula_blocks(
            text=body.text,
            options=body.options,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Formula block generation failed: {e!s}",
        )


@router.post("/formula/assemble", response_model=FormulaAssembleResponse)
@limiter.limit("30/minute")
async def assemble_search_formula(
    body: FormulaAssembleRequest, request: Request, _auth: RequireAPIKey
) -> FormulaAssembleResponse:
    """
    Assemble a KIPRIS search formula from user-edited blocks.

    Takes user-modified keyword blocks and operators, and returns
    the assembled formula string ready for KIPRIS search.
    """
    try:
        formula = await assemble_formula_from_blocks(
            blocks=body.blocks,
            block_operators=body.block_operators,
            ipc_codes=body.ipc_codes,
            excluded_terms=body.excluded_terms,
        )
        return FormulaAssembleResponse(assembled_formula=formula)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid block configuration: {e!s}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Formula assembly failed: {e!s}",
        )
