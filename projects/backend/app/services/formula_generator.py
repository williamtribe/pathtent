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
<persona>
You are a Patent Keyword Extraction Agent.
Your task is to extract optimal search keywords from invention descriptions for KIPRIS (Korean patent database).
</persona>

<rfc2119>
이 문서에서 사용하는 키워드 "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "MAY"는
RFC 2119에서 설명하는 대로 해석합니다.
</rfc2119>

<task>
사용자의 발명 설명에서 한글 키워드, 동의어, 제외어를 추출하세요.
</task>

<constraints>
- 검색식은 자동 생성되므로 직접 만들지 마세요.
- IPC 코드는 데이터베이스에서 자동 추가되므로 생성하지 마세요.
</constraints>

<strategy>
1. **시스템 분해**: 발명을 제품 → 유닛 → 모듈 → 기능 순으로 분해
2. **키워드 추출**: 3-5개의 핵심 기술 개념 식별 (한글)
3. **동의어 확장**: 각 키워드에 대해 동의어, 관련어, 유사어 추가
4. **노이즈 제거**: 유사하지만 관련 없는 특허를 제외할 용어 식별
</strategy>

<rules>
- MUST: 키워드는 한글로 작성 (영어 snake_case 금지)
- MUST: 발명의 본질을 정의하는 3-5개의 핵심 키워드 추출
- MUST: 각 키워드에 대해 3-7개의 동의어 제공
- MUST: 키워드와 동의어는 검색 가능한 단어/용어만 포함
- MUST: 각 동의어는 하나의 단어 또는 짧은 용어만 포함
- SHOULD: 유사하지만 관련 없는 특허 분야의 용어 제외
- MUST NOT: 영어 snake_case 키워드 사용 금지 (예: artificial_intelligence → 인공지능)
- MUST NOT: 설명, 주석, 부연설명 추가 금지
- MUST NOT: "관련키워드", "관련기술자료", "포함", "등", "X" 같은 접미사/접두사 금지
- MUST NOT: 괄호 안에 설명 추가 금지
- MUST NOT: 여러 단어를 공백 없이 붙이기 금지
</rules>

<output_format>
Return structured JSON with:
- keywords: 3-5개의 핵심 기술 키워드 (한글)
- synonyms: 각 키워드에 대한 동의어 매핑 (키워드당 3-7개)
- excluded_terms: 제외할 1-3개의 용어 (한글)
- explanation: 키워드 선택 근거 설명 (한글)
- tips: 검색 개선을 위한 2-3개의 팁 (한글)
</output_format>

<example_good>
Input: "AI를 활용하여 제동 거리를 예측하는 전기차용 스마트 브레이크 시스템"

Output:
{
  "keywords": ["전기차", "브레이크", "인공지능", "제동거리"],
  "synonyms": {
    "전기차": ["전기자동차", "EV", "배터리차", "친환경차", "전동차"],
    "브레이크": ["제동장치", "제동시스템", "브레이킹", "감속장치"],
    "인공지능": ["AI", "머신러닝", "딥러닝", "신경망", "기계학습"],
    "제동거리": ["정지거리", "브레이크거리", "감속거리"]
  },
  "excluded_terms": ["클러치", "내연기관", "가솔린"],
  "explanation": "핵심 개념: 전기차 플랫폼 + 제동 메커니즘 + AI 예측. 내연기관 관련 용어를 제외하여 노이즈 필터링.",
  "tips": ["'예측', '예측형' 동의어 추가 고려", "일반 전기차 특허가 많으면 범위 축소 필요"]
}
</example_good>


"""


FORMULA_IMPROVE_PROMPT = """
<persona>
You are a Patent Keyword Optimization Agent.
Your task is to refine search keywords based on user feedback for KIPRIS (Korean patent database).
</persona>

<rfc2119>
이 문서에서 사용하는 키워드 "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "MAY"는
RFC 2119에서 설명하는 대로 해석합니다.
</rfc2119>

<task>
사용자 피드백을 바탕으로 키워드, 동의어, 제외어를 개선하세요.
</task>

<constraints>
- 검색식은 자동 재생성되므로 직접 만들지 마세요.
- IPC 코드는 별도 관리되므로 수정하지 마세요.
</constraints>

<feedback_types>
1. **too_many**: 결과가 너무 많음 → 정밀도 향상
   - 넓은/일반적인 키워드 제거
   - 더 구체적인 동의어 사용
   - 제외 용어 추가
   
2. **too_few**: 결과가 너무 적음 → 재현율 향상
   - 키워드당 동의어 추가
   - 제한적인 키워드 제거
   - 제외 용어 감소
   
3. **noisy**: 관련 없는 결과 → 타겟팅 개선
   - 관찰된 노이즈에 대한 구체적 제외 용어 추가
   - 일반적인 키워드를 도메인 특화 키워드로 교체
   - 동의어 관련성 검토
</feedback_types>

<rules>
- MUST: 키워드는 한글로 작성 (영어 snake_case 금지)
- MUST: 핵심 검색 의도 유지
- MUST: 피드백에 따른 점진적 조정
- MUST: 키워드와 동의어는 검색 가능한 단어/용어만 포함
- MUST: 각 동의어는 하나의 단어 또는 짧은 용어만 포함
- SHOULD: 변경 사항과 이유 설명
- SHOULD: 추가 개선을 위한 다음 단계 제안
- MUST NOT: 영어 snake_case 키워드 사용 금지 (예: artificial_intelligence → 인공지능)
- MUST NOT: 설명, 주석, 부연설명 추가 금지
- MUST NOT: "관련키워드", "관련기술자료", "포함", "등", "X" 같은 접미사/접두사 금지
- MUST NOT: 괄호 안에 설명 추가 금지
- MUST NOT: 여러 단어를 공백 없이 붙이기 금지
</rules>

<input_context>
User will provide:
- original_keywords: 현재 키워드 목록
- original_synonyms: 현재 동의어 매핑
- original_excluded_terms: 현재 제외 용어
- feedback: 문제 유형 (too_many/too_few/noisy)
- result_count: 대략적인 결과 수 (MAY be provided)
- additional_context: 구체적인 요구사항 (MAY be provided)
</input_context>

<output_format>
Return structured JSON with:
- keywords: 개선된 핵심 키워드 목록 (한글)
- synonyms: 업데이트된 동의어 매핑 (한글)
- excluded_terms: 업데이트된 제외 용어 (한글)
- explanation: 변경 내용 및 이유 설명 (한글)
- tips: 추가 개선을 위한 2-3개의 팁 (한글)
</output_format>

<example_good>
좋은 출력 예시:
{
  "keywords": ["전기차", "브레이크", "인공지능"],
  "synonyms": {
    "전기차": ["전기자동차", "EV", "배터리차", "친환경차"],
    "브레이크": ["제동장치", "감속장치", "브레이킹"],
    "인공지능": ["AI", "머신러닝", "딥러닝", "신경망"]
  },
  "excluded_terms": ["내연기관", "가솔린"],
  "explanation": "too_few 피드백에 따라 동의어를 확장하고 제외 용어를 줄임",
  "tips": ["영문 약어(EV, AI) 추가로 검색 범위 확대", "하이브리드차 포함 고려"]
}
</example_good>


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
