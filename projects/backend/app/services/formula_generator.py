"""
KIPRIS search formula generator service.

Generates expert-level patent search formulas using AI for keyword extraction
and FormulaBuilder for rule-based formula construction.
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent, ModelRetry, RunContext
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

from app.config import Settings
from app.schemas.formula import FormulaOptions, FormulaResult
from app.services.formula_builder import FormulaBuilder, PrecisionLevel
from app.services.ipc_search import IpcSearchService


FORMULA_GENERATE_PROMPT = """
<goal>
Extract keywords, synonyms, and exclusion terms from the user's invention description.
DO NOT generate a search formula - it will be constructed automatically from your keywords.
DO NOT generate IPC codes - they will be added from a verified database.
</goal>

<strategy>
1. **System Decomposition**: Break invention into Product → Unit → Module → Feature
2. **Keyword Extraction**: Identify 3-5 core technical concepts (Korean and English)
3. **Synonym Expansion**: Add synonyms, related terms, translations for EACH keyword
4. **Noise Reduction**: Identify 1-3 terms to exclude that would cause false positives
</strategy>

<rules>
- Extract 3-5 CORE keywords that define the invention's essence
- For EACH keyword, provide 3-7 synonyms (including Korean/English translations)
- Exclude terms that appear in similar but irrelevant patent domains
- Focus on technical precision, not search syntax
</rules>

<output_format>
Return structured JSON with:
- keywords: List of 3-5 core technical keywords
- synonyms: Dictionary mapping EACH keyword to its synonyms (3-7 per keyword)
- excluded_terms: 1-3 terms to exclude (common noise in this domain)
- explanation: Brief explanation of keyword selection rationale
- tips: 2-3 tips for refining the search
</output_format>

<example>
Input: "A smart brake system for electric vehicles that uses AI to predict stopping distance"

Output:
{
  "keywords": ["electric vehicle", "brake", "AI", "stopping distance"],
  "synonyms": {
    "electric vehicle": ["EV", "BEV", "battery vehicle", "전기차", "전기자동차", "hybrid vehicle"],
    "brake": ["braking", "braking system", "deceleration", "제동", "브레이크"],
    "AI": ["artificial intelligence", "machine learning", "neural network", "인공지능", "딥러닝"],
    "stopping distance": ["braking distance", "정지거리", "제동거리"]
  },
  "excluded_terms": ["clutch", "combustion engine", "gasoline"],
  "explanation": "Core concepts: EV platform + brake mechanism + AI prediction. Excluded ICE-specific terms to filter noise.",
  "tips": ["Consider adding 'prediction' or 'predictive' synonyms", "May need to narrow if results include general EV patents"]
}
</example>
"""


FORMULA_IMPROVE_PROMPT = """
<goal>
Refine keywords, synonyms, and exclusion terms based on user feedback.
DO NOT generate a search formula - it will be reconstructed from your keywords.
DO NOT modify IPC codes - they are managed separately.
</goal>

<feedback_types>
1. **too_many**: Too many results → Increase precision
   - Remove broad/generic keywords
   - Use more specific synonyms
   - Add more exclusion terms
   
2. **too_few**: Too few results → Increase recall
   - Add more synonyms per keyword
   - Remove restrictive keywords
   - Reduce exclusion terms
   
3. **noisy**: Irrelevant results → Refine targeting
   - Add specific exclusion terms for observed noise
   - Replace generic keywords with domain-specific ones
   - Review synonym relevance
</feedback_types>

<rules>
- Preserve the core search intent
- Make incremental adjustments based on feedback
- Explain what changed and why
- Suggest next steps for further refinement
</rules>

<context>
User will provide:
- original_keywords: Current keywords and synonyms
- feedback: Type of issue (too_many/too_few/noisy)
- result_count: Approximate number of results (if known)
- additional_context: Specific requirements or observations
</context>

<output_format>
Return structured JSON with:
- keywords: Refined list of core keywords
- synonyms: Updated synonym mappings for each keyword
- excluded_terms: Updated exclusion terms
- explanation: Explanation of what changed and why
- tips: 2-3 tips for further refinement
</output_format>
"""


class AIFormulaOutput(BaseModel):
    """Internal model for AI keyword extraction output."""

    keywords: list[str] = Field(description="Core technical keywords (3-5)")
    synonyms: dict[str, list[str]] = Field(
        description="Synonym mappings for each keyword"
    )
    excluded_terms: list[str] = Field(
        description="Terms to exclude for noise reduction"
    )
    explanation: str = Field(description="Brief explanation of keyword selection")
    tips: list[str] = Field(description="Tips for refining the search")


class _FormulaGenerateAgentSingleton:
    """Singleton for formula generation agent."""

    _instance: Agent[None, AIFormulaOutput] | None = None

    @classmethod
    def get(cls) -> Agent[None, AIFormulaOutput]:
        if cls._instance is None:
            cls._instance = cls._create()
        return cls._instance

    @classmethod
    def _create(cls) -> Agent[None, AIFormulaOutput]:
        settings = Settings()
        provider = GoogleProvider(api_key=settings.google_api_key)
        model = GoogleModel(settings.gemini_model, provider=provider)
        agent = Agent(
            model=model,
            output_type=AIFormulaOutput,
            system_prompt=FORMULA_GENERATE_PROMPT,
        )

        @agent.output_validator
        async def validate_keywords(
            ctx: RunContext[None], result: AIFormulaOutput
        ) -> AIFormulaOutput:
            # Validate keywords count
            if len(result.keywords) < 2:
                raise ModelRetry(
                    "Need at least 2 core keywords. Extract key technical terms."
                )

            # Validate synonyms exist for keywords
            if len(result.synonyms) < len(result.keywords) // 2:
                raise ModelRetry(
                    "Provide synonyms for each keyword. Missing synonym mappings."
                )

            return result

        return agent


class _FormulaImproveAgentSingleton:
    """Singleton for formula improvement agent."""

    _instance: Agent[None, AIFormulaOutput] | None = None

    @classmethod
    def get(cls) -> Agent[None, AIFormulaOutput]:
        if cls._instance is None:
            cls._instance = cls._create()
        return cls._instance

    @classmethod
    def _create(cls) -> Agent[None, AIFormulaOutput]:
        settings = Settings()
        provider = GoogleProvider(api_key=settings.google_api_key)
        model = GoogleModel(settings.gemini_model, provider=provider)
        agent = Agent(
            model=model,
            output_type=AIFormulaOutput,
            system_prompt=FORMULA_IMPROVE_PROMPT,
        )

        @agent.output_validator
        async def validate_improved_keywords(
            ctx: RunContext[None], result: AIFormulaOutput
        ) -> AIFormulaOutput:
            if len(result.keywords) < 1:
                raise ModelRetry("Provide at least one keyword.")
            if not result.explanation:
                raise ModelRetry("Explain what changes were made to the keywords.")
            return result

        return agent


# Expose singleton getters
formula_generate_agent = _FormulaGenerateAgentSingleton.get
formula_improve_agent = _FormulaImproveAgentSingleton.get


async def generate_formula(
    text: str,
    options: FormulaOptions | None = None,
) -> FormulaResult:
    """
    Generate a KIPRIS search formula from invention description.

    Uses AI for keywords/synonyms extraction, FormulaBuilder for
    rule-based formula construction, and IpcSearchService for grounded IPC codes.

    Args:
        text: Invention description or idea text
        options: Optional configuration for formula generation

    Returns:
        FormulaResult with complete search formula and metadata
    """
    settings = Settings()

    # Build prompt with options if provided
    prompt = text
    if options:
        prompt += f"\n\n[Options: precision={options.target_precision}"
        if not options.include_synonyms:
            prompt += ", minimal synonyms"
        prompt += "]"

    # Step 1: AI extracts keywords, synonyms, excluded terms (NO formula)
    agent = formula_generate_agent()
    result = await agent.run(prompt)
    output = result.output

    # Step 2: Get grounded IPC codes via embedding search
    ipc_codes: list[str] = []
    ipc_codes_raw: list[str] = []
    if options is None or options.include_ipc:
        ipc_service = IpcSearchService(api_key=settings.google_api_key)
        ipc_results = await ipc_service.search(text, top_k=3)
        ipc_codes = [f"{r.code}: {r.description[:50]}..." for r in ipc_results]
        ipc_codes_raw = [r.code.replace(" ", "") for r in ipc_results]

    # Step 3: Build formula using FormulaBuilder (rule-based, always valid)
    precision = PrecisionLevel.BALANCED
    if options and options.target_precision == "high":
        precision = PrecisionLevel.HIGH
    elif options and options.target_precision == "recall":
        precision = PrecisionLevel.RECALL

    formula = FormulaBuilder.build(
        keywords=output.keywords,
        synonyms=output.synonyms,
        excluded_terms=output.excluded_terms if output.excluded_terms else None,
        ipc_codes=ipc_codes_raw if ipc_codes_raw else None,
        precision=precision,
    )

    return FormulaResult(
        formula=formula,
        keywords=output.keywords,
        synonyms=output.synonyms,
        ipc_codes=ipc_codes,
        excluded_terms=output.excluded_terms,
        explanation=output.explanation,
        tips=output.tips,
    )


async def improve_formula(
    original_formula: str,
    original_keywords: list[str],
    original_synonyms: dict[str, list[str]],
    feedback: str,
    result_count: int | None = None,
    additional_context: str | None = None,
) -> FormulaResult:
    """
    Improve an existing KIPRIS search formula based on feedback.

    AI refines keywords/synonyms, FormulaBuilder reconstructs the formula.
    IPC codes from the original formula are preserved.

    Args:
        original_formula: The original search formula
        original_keywords: Keywords from the original formula
        original_synonyms: Synonym mappings from the original formula
        feedback: Type of issue ('too_many', 'too_few', or 'noisy')
        result_count: Number of results from original formula (optional)
        additional_context: Additional requirements or observations (optional)

    Returns:
        FormulaResult with improved formula and explanation of changes
    """
    import re

    # Extract existing IPC codes from original formula
    ipc_pattern = r"MIPC:\(([^)]+)\)"
    ipc_match = re.search(ipc_pattern, original_formula)
    ipc_codes_raw: list[str] = []
    if ipc_match:
        ipc_str = ipc_match.group(1)
        ipc_codes_raw = [code.strip() for code in ipc_str.split("+")]

    # Build improvement prompt with structured keyword info
    prompt = f"Original keywords: {original_keywords}\n"
    prompt += f"Original synonyms: {original_synonyms}\n"
    prompt += f"Feedback: {feedback}\n"
    if result_count is not None:
        prompt += f"Result count: approximately {result_count} patents\n"
    if additional_context:
        prompt += f"Additional context: {additional_context}\n"
    prompt += "\nPlease refine the keywords and synonyms based on the feedback."

    agent = formula_improve_agent()
    result = await agent.run(prompt)
    output = result.output

    # Determine precision based on feedback
    precision = PrecisionLevel.BALANCED
    if feedback == "too_many":
        precision = PrecisionLevel.HIGH
    elif feedback == "too_few":
        precision = PrecisionLevel.RECALL

    # Build improved formula using FormulaBuilder
    formula = FormulaBuilder.build(
        keywords=output.keywords,
        synonyms=output.synonyms,
        excluded_terms=output.excluded_terms if output.excluded_terms else None,
        ipc_codes=ipc_codes_raw if ipc_codes_raw else None,
        precision=precision,
    )

    return FormulaResult(
        formula=formula,
        keywords=output.keywords,
        synonyms=output.synonyms,
        ipc_codes=ipc_codes_raw,
        excluded_terms=output.excluded_terms,
        explanation=output.explanation,
        tips=output.tips,
    )
