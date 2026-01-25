"""
API routes for KIPRIS search formula generation.

Provides endpoints for generating and improving patent search formulas.
"""

from fastapi import APIRouter, HTTPException

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
async def generate_search_formula(request: FormulaGenerateRequest) -> FormulaResult:
    """
    Generate a KIPRIS search formula from invention description.

    Takes an invention idea or technical description and generates
    an expert-level patent search formula ready to use in KIPRIS.
    """
    try:
        result = await generate_formula(
            text=request.text,
            options=request.options,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Formula generation failed: {e!s}",
        )


@router.post("/formula/improve", response_model=FormulaResult)
async def improve_search_formula(request: FormulaImproveRequest) -> FormulaResult:
    """
    Improve an existing KIPRIS search formula based on feedback.

    Takes user feedback about search results (too many, too few, noisy)
    and adjusts the formula to better match the desired precision/recall.
    Requires original keywords and synonyms for rule-based formula reconstruction.
    """
    try:
        result = await improve_formula(
            original_formula=request.original_formula,
            original_keywords=request.original_keywords,
            original_synonyms=request.original_synonyms,
            original_excluded_terms=request.original_excluded_terms,
            feedback=request.feedback,
            result_count=request.result_count,
            additional_context=request.additional_context,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Formula improvement failed: {e!s}",
        )


@router.post("/formula/generate-blocks", response_model=FormulaBlocksResponse)
async def generate_search_formula_blocks(
    request: FormulaGenerateRequest,
) -> FormulaBlocksResponse:
    """
    Generate a block-based KIPRIS search formula from invention description.

    Returns keyword blocks that users can edit, along with the assembled formula.
    Each block contains related keywords with configurable field and operator settings.
    """
    try:
        result = await generate_formula_blocks(
            text=request.text,
            options=request.options,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Formula block generation failed: {e!s}",
        )


@router.post("/formula/assemble", response_model=FormulaAssembleResponse)
async def assemble_search_formula(
    request: FormulaAssembleRequest,
) -> FormulaAssembleResponse:
    """
    Assemble a KIPRIS search formula from user-edited blocks.

    Takes user-modified keyword blocks and operators, and returns
    the assembled formula string ready for KIPRIS search.
    """
    try:
        formula = await assemble_formula_from_blocks(
            blocks=request.blocks,
            block_operators=request.block_operators,
            ipc_codes=request.ipc_codes,
            excluded_terms=request.excluded_terms,
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
