"""
API routes for KIPRIS search formula generation.

Provides endpoints for generating and improving patent search formulas.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.formula import (
    FormulaGenerateRequest,
    FormulaImproveRequest,
    FormulaResult,
)
from app.services.formula_generator import generate_formula, improve_formula

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
