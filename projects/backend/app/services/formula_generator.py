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
당신은 KIPRIS 특허 검색을 위한 키워드 추출 전문가입니다.

## 작업
발명 설명에서 검색용 키워드, 동의어, 제외어를 추출하세요.

## 규칙
- 모든 키워드와 동의어는 **한글**로 작성 (영문 약어는 허용: AI, EV 등)
- 핵심 키워드 3-5개, 각 키워드당 동의어 3-7개
- 각 동의어는 **단일 단어 또는 짧은 용어**만 (설명 없이)
- 노이즈 필터링을 위한 제외 용어 1-3개

## 예시
입력: "AI를 활용하여 제동 거리를 예측하는 전기차용 스마트 브레이크 시스템"

출력:
{
  "keywords": ["전기차", "브레이크", "인공지능", "제동거리"],
  "synonyms": {
    "전기차": ["전기자동차", "EV", "배터리차", "친환경차"],
    "브레이크": ["제동장치", "제동시스템", "감속장치"],
    "인공지능": ["AI", "머신러닝", "딥러닝", "신경망"],
    "제동거리": ["정지거리", "브레이크거리", "감속거리"]
  },
  "excluded_terms": ["내연기관", "가솔린"],
  "explanation": "전기차 플랫폼 + 제동 메커니즘 + AI 예측이 핵심",
  "tips": ["예측 관련 동의어 추가 고려"]
}
"""


FORMULA_IMPROVE_PROMPT = """
당신은 KIPRIS 특허 검색 키워드 개선 전문가입니다.

## 작업
사용자 피드백에 따라 키워드, 동의어, 제외어를 조정하세요.

## 피드백 유형별 전략
- **too_many**: 일반적 키워드 제거, 구체적 동의어 사용, 제외 용어 추가
- **too_few**: 동의어 확장, 제한적 키워드 완화, 제외 용어 감소
- **noisy**: 노이즈 유발 용어 제외, 도메인 특화 키워드로 교체

## 규칙
- 모든 키워드와 동의어는 **한글**로 작성 (영문 약어는 허용)
- 각 동의어는 **단일 단어 또는 짧은 용어**만
- 변경 이유를 설명에 포함

## 예시
피드백: too_few

출력:
{
  "keywords": ["전기차", "브레이크", "인공지능"],
  "synonyms": {
    "전기차": ["전기자동차", "EV", "배터리차", "친환경차"],
    "브레이크": ["제동장치", "감속장치", "브레이킹"],
    "인공지능": ["AI", "머신러닝", "딥러닝", "신경망"]
  },
  "excluded_terms": ["내연기관"],
  "explanation": "동의어 확장, 제외 용어 축소로 재현율 향상",
  "tips": ["하이브리드차 포함 고려"]
}
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
            import re

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

            # Check for snake_case keywords (romanized Korean)
            snake_case_pattern = re.compile(r"^[a-z]+(_[a-z]+)+$")
            for kw in result.keywords:
                if snake_case_pattern.match(kw):
                    raise ModelRetry(
                        f"Keyword '{kw}' is snake_case. Use Korean: 인공지능, 전기차, etc."
                    )

            # Check for garbage patterns in synonyms
            garbage_patterns = ["관련키워드", "관련기술", "자료X", "포함", " 등"]
            for kw, syns in result.synonyms.items():
                if snake_case_pattern.match(kw):
                    raise ModelRetry(
                        f"Synonym key '{kw}' is snake_case. Use Korean keywords."
                    )
                for syn in syns:
                    for garbage in garbage_patterns:
                        if garbage in syn:
                            raise ModelRetry(
                                f"Synonym '{syn}' contains garbage text '{garbage}'. "
                                "Use clean Korean terms only."
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
            import re

            if len(result.keywords) < 1:
                raise ModelRetry("Provide at least one keyword.")
            if not result.explanation:
                raise ModelRetry("Explain what changes were made to the keywords.")

            # Check for snake_case keywords
            snake_case_pattern = re.compile(r"^[a-z]+(_[a-z]+)+$")
            for kw in result.keywords:
                if snake_case_pattern.match(kw):
                    raise ModelRetry(
                        f"Keyword '{kw}' is snake_case. Use Korean: 인공지능, 전기차, etc."
                    )

            # Check for garbage patterns
            garbage_patterns = ["관련키워드", "관련기술", "자료X", "포함", " 등"]
            for kw, syns in result.synonyms.items():
                if snake_case_pattern.match(kw):
                    raise ModelRetry(f"Key '{kw}' is snake_case. Use Korean.")
                for syn in syns:
                    for garbage in garbage_patterns:
                        if garbage in syn:
                            raise ModelRetry(
                                f"Synonym '{syn}' has garbage '{garbage}'. Use clean terms."
                            )

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
    original_excluded_terms: list[str],
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
    prompt += f"Original excluded terms: {original_excluded_terms}\n"
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
