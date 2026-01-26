"""
KIPRIS search formula generator service.

Generates expert-level patent search formulas using AI for keyword extraction
and FormulaBuilder for rule-based formula construction.
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent, ModelRetry, RunContext


from app.config import Settings
from app.schemas.formula import (
    FormulaBlock,
    FormulaBlocksResponse,
    FormulaOptions,
    FormulaResult,
)
from app.services.formula_builder import FormulaBuilder, PrecisionLevel
from app.services.ipc_search import IpcSearchService


FORMULA_CATEGORY_PROMPT = """
<persona>
You are a Patent Category Analysis Agent.
Your task is to decompose invention descriptions into meaningful technical categories for KIPRIS (Korean patent database) search.
</persona>

<rfc2119>
이 문서에서 사용하는 키워드 "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "MAY"는
RFC 2119에서 설명하는 대로 해석합니다.
</rfc2119>

<task>
사용자의 발명 설명을 분석하여 기술 카테고리로 분해하고, 각 카테고리별 키워드를 추출하세요.
</task>

<constraints>
- 검색식은 자동 생성되므로 직접 만들지 마세요.
- IPC 코드는 임베딩 검색으로 자동 추가되므로 생성하지 마세요.
</constraints>

<strategy>
1. **주제 분해**: 발명을 3-7개의 의미 있는 기술 카테고리로 분해
2. **카테고리 명명**: 각 카테고리에 명확한 기술 분야명 부여 (예: 터치 센서, 지문 인식, 광 센서)
3. **키워드 추출**: 각 카테고리별로 5-10개의 관련 키워드 추출
4. **표기 변형 포함**: 오탈자, 발음 변형, 외래어 표기 변형, 영문 와일드카드 포함
5. **노이즈 제거**: 유사하지만 관련 없는 특허를 제외할 용어 식별
</strategy>

<rules>
- MUST: 3-7개의 기술 카테고리로 분해
- MUST: 각 카테고리명은 명확한 기술 분야명 (예: "터치 센서", "배터리 관리", "냉각 시스템")
- MUST: 각 카테고리당 5-10개의 키워드 (한글 + 영문 와일드카드)
- MUST: 한글 표기 변형 포함 (예: 센서/쎈서, 배터리/밧데리)
- MUST: 영문 키워드는 와일드카드 사용 (예: sensor*, battery*, touch*)
- SHOULD: 카테고리 간 중복 키워드 최소화
- MUST NOT: IPC 코드 생성하지 않기 (자동 할당됨)
</rules>

<korean_variations>
한글 키워드의 흔한 표기 변형 패턴:
- 된소리 변형: 센서↔쎈서, 센싱↔쎈싱, 셀↔쎌, 소프트↔쏘프트
- 외래어 표기: 배터리↔밧데리↔바테리, 디스플레이↔디스프레이
- 장단음 변형: 리튬↔리툼, 엘이디↔엘리디
- 띄어쓰기 변형: 전기차↔전기 차, 스마트폰↔스마트 폰
- 약어 확장: AI↔인공지능, EV↔전기차↔전기자동차
</korean_variations>

<output_format>
Return structured JSON with:
- categories: 3-7개의 기술 카테고리 (각각 name과 keywords 포함)
- excluded_terms: 제외할 1-3개의 용어 (한글)
- explanation: 카테고리 분류 근거 설명 (한글)
- tips: 검색 개선을 위한 2-3개의 팁 (한글)
</output_format>

<example_good>
Input: "디스플레이에 사용되는 다양한 센서 기술"

Output:
{
  "categories": [
    {
      "name": "터치 센서",
      "keywords": ["터치*", "터치패널*", "터치스크린*", "정전용량*", "capacitive*", "touchscreen*", "touch sensor*", "터치 센서", "터치 패널"]
    },
    {
      "name": "지문 인식",
      "keywords": ["지문*", "핑거프린트*", "fingerprint*", "생체인식*", "biometric*", "지문 센서", "지문 인식"]
    },
    {
      "name": "광 센서",
      "keywords": ["광센서*", "조도*", "조도센서*", "ambient light*", "light sensor*", "광 센서", "빛 감지"]
    },
    {
      "name": "근접 센서",
      "keywords": ["근접*", "근접센서*", "proximity*", "거리감지*", "근접 센서", "proximity sensor*"]
    },
    {
      "name": "환경 센서",
      "keywords": ["온도*", "습도*", "환경센서*", "temperature*", "humidity*", "환경 센서", "온습도*"]
    }
  ],
  "excluded_terms": ["카메라", "이미지센서", "CMOS"],
  "explanation": "디스플레이 센서를 5가지 주요 기술 카테고리로 분류: 터치 입력, 생체 인증, 조도 감지, 근접 감지, 환경 모니터링. 각 카테고리는 독립적인 기술 분야로 사용자가 원하는 조합으로 검색 가능.",
  "tips": ["압력 센서 카테고리 추가 고려", "OLED/LCD 특화 센서 분리 가능", "카테고리 조합으로 검색 범위 조절"]
}
</example_good>
"""

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
4. **표기 변형 추가**: 오탈자, 발음 변형, 외래어 표기 변형 포함
5. **노이즈 제거**: 유사하지만 관련 없는 특허를 제외할 용어 식별
</strategy>

<rules>
- MUST: 키워드는 한글로 작성 (영문 약어 AI, EV 등은 허용)
- MUST: 핵심 키워드 3-5개, 각 키워드당 동의어 5-10개 (변형 포함)
- MUST: 각 동의어는 단일 단어 또는 짧은 용어만 (설명 없이 깔끔하게)
- MUST: 한글 표기 변형 포함 (예: 센서/쎈서, 센싱/쎈싱, 배터리/밧데리/바테리)
- MUST: 영문 키워드와 함께 표기 변형 포함 (예: sensor*/sensing*/detect*)
- SHOULD: 유사하지만 관련 없는 특허 분야의 용어 제외
- MUST NOT: 동의어에 부연설명이나 접미사 붙이지 않기
</rules>

<korean_variations>
한글 키워드의 흔한 표기 변형 패턴:
- 된소리 변형: 센서↔쎈서, 센싱↔쎈싱, 셀↔쎌, 소프트↔쏘프트
- 외래어 표기: 배터리↔밧데리↔바테리, 디스플레이↔디스프레이
- 장단음 변형: 리튬↔리툼, 엘이디↔엘리디
- 띄어쓰기 변형: 전기차↔전기 차, 스마트폰↔스마트 폰
- 약어 확장: AI↔인공지능, EV↔전기차↔전기자동차
- 하이픈 변형: head-up↔headup↔head up
</korean_variations>

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
  "keywords": ["전기차", "브레이크", "인공지능", "제동거리", "센서"],
  "synonyms": {
    "전기차": ["전기자동차", "EV", "배터리차", "친환경차", "전동차", "electric vehicle*", "battery vehicle*"],
    "브레이크": ["제동장치", "제동시스템", "브레이킹", "브레이크", "감속장치", "brake*", "braking*"],
    "인공지능": ["AI", "머신러닝", "딥러닝", "신경망", "기계학습", "인공 지능", "machine learning*", "deep learning*"],
    "제동거리": ["정지거리", "브레이크거리", "감속거리", "제동 거리", "braking distance*", "stopping distance*"],
    "센서": ["센서", "쎈서", "센싱", "쎈싱", "sensor*", "sensing*", "검출기", "검지기", "감지기", "detector*"]
  },
  "excluded_terms": ["클러치", "내연기관", "가솔린"],
  "explanation": "핵심 개념: 전기차 플랫폼 + 제동 메커니즘 + AI 예측 + 센서 시스템. 한글 표기 변형(센서/쎈서)과 영문 와일드카드를 포함하여 검색 범위 확보. 내연기관 관련 용어를 제외하여 노이즈 필터링.",
  "tips": ["'예측', '예측형' 동의어 추가 고려", "일반 전기차 특허가 많으면 범위 축소 필요", "외래어 표기 변형 확인 필요"]
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
- MUST: 키워드는 한글로 작성 (영문 약어 AI, EV 등은 허용)
- MUST: 핵심 검색 의도 유지하며 피드백에 따라 점진적 조정
- MUST: 각 동의어는 단일 단어 또는 짧은 용어만 (설명 없이 깔끔하게)
- SHOULD: 변경 사항과 이유 설명
- MUST NOT: 동의어에 부연설명이나 접미사 붙이지 않기
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


class AICategory(BaseModel):
    """Single category from AI extraction."""

    name: str = Field(description="Category name (e.g., 'Touch Sensor')")
    keywords: list[str] = Field(description="Keywords for this category (5-10)")


class AICategoryOutput(BaseModel):
    """Internal model for AI category-based extraction output."""

    categories: list[AICategory] = Field(
        description="Technical categories with keywords (3-7 categories)"
    )
    excluded_terms: list[str] = Field(
        description="Terms to exclude for noise reduction"
    )
    explanation: str = Field(description="Brief explanation of category decomposition")
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
        from app.services.llm_factory import get_model

        model = get_model()
        agent = Agent(
            model=model,
            output_type=AIFormulaOutput,
            system_prompt=FORMULA_GENERATE_PROMPT,
            retries=3,  # Allow more retries for output validation
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

            # Validate synonyms are short terms, not sentences
            # Max 50 chars per synonym, no explanatory text
            for kw, syns in result.synonyms.items():
                for syn in syns:
                    if len(syn) > 50:
                        raise ModelRetry(
                            f"Synonym '{syn[:40]}...' is too long. "
                            "Each synonym must be a single word or short term (max 50 chars), "
                            "NOT a sentence or explanation. Remove tips from synonyms."
                        )
                    # Check for explanatory patterns
                    if any(
                        phrase in syn.lower()
                        for phrase in [
                            "추가하",
                            "검색",
                            "좁힐",
                            "포함",
                            "고려",
                            "권장",
                            "좋습니다",
                            "수 있습니다",
                            "하세요",
                        ]
                    ):
                        raise ModelRetry(
                            f"Synonym '{syn}' appears to be a tip/recommendation, not a keyword. "
                            "Move recommendations to 'tips' field. Synonyms must be single terms only."
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
        from app.services.llm_factory import get_model

        model = get_model()
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


class _FormulaCategoryAgentSingleton:
    """Singleton for category-based formula generation agent."""

    _instance: Agent[None, AICategoryOutput] | None = None

    @classmethod
    def get(cls) -> Agent[None, AICategoryOutput]:
        if cls._instance is None:
            cls._instance = cls._create()
        return cls._instance

    @classmethod
    def _create(cls) -> Agent[None, AICategoryOutput]:
        from app.services.llm_factory import get_model

        model = get_model()
        agent = Agent(
            model=model,
            output_type=AICategoryOutput,
            system_prompt=FORMULA_CATEGORY_PROMPT,
        )

        @agent.output_validator
        async def validate_categories(
            ctx: RunContext[None], result: AICategoryOutput
        ) -> AICategoryOutput:
            # Validate categories count
            if len(result.categories) < 2:
                raise ModelRetry(
                    "Need at least 2 categories. Decompose the invention into technical categories."
                )
            if len(result.categories) > 10:
                raise ModelRetry(
                    "Too many categories. Consolidate into 3-7 main technical categories."
                )

            # Validate each category has keywords
            for cat in result.categories:
                if len(cat.keywords) < 2:
                    raise ModelRetry(
                        f"Category '{cat.name}' needs at least 2 keywords."
                    )

            return result

        return agent


# Expose singleton getters
formula_generate_agent = _FormulaGenerateAgentSingleton.get
formula_improve_agent = _FormulaImproveAgentSingleton.get
formula_category_agent = _FormulaCategoryAgentSingleton.get


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


async def generate_formula_blocks(
    text: str,
    options: FormulaOptions | None = None,
) -> FormulaBlocksResponse:
    """
    Generate a category-based KIPRIS search formula from invention description.

    Decomposes the invention into technical categories, finds IPC codes for each
    category via embedding search, and returns editable blocks.

    Args:
        text: Invention description or idea text
        options: Optional configuration for formula generation

    Returns:
        FormulaBlocksResponse with category-based blocks and assembled formula
    """
    settings = Settings()

    # Build prompt with options if provided
    prompt = text
    if options:
        prompt += f"\n\n[Options: precision={options.target_precision}"
        if not options.include_synonyms:
            prompt += ", minimal keywords per category"
        prompt += "]"

    # Step 1: AI extracts categories with keywords (NO IPC codes from AI)
    agent = formula_category_agent()
    result = await agent.run(prompt)
    output = result.output

    # Guard against empty categories from AI
    if not output.categories:
        return FormulaBlocksResponse(
            blocks=[],
            block_operators=[],
            assembled_formula="",
            ipc_codes=[],
            excluded_terms=output.excluded_terms,
            explanation="No categories could be extracted from the input.",
            tips=["Try providing a more detailed invention description."],
        )

    # Step 2: For each category, find IPC codes via embedding search
    blocks: list[FormulaBlock] = []
    block_operators: list[str] = []
    all_ipc_codes_display: list[str] = []  # Collect all IPC codes for response
    seen_ipc_codes: set[str] = set()  # Track seen IPC codes for deduplication

    ipc_service: IpcSearchService | None = None
    if options is None or options.include_ipc:
        ipc_service = IpcSearchService(api_key=settings.google_api_key)

    for i, category in enumerate(output.categories):
        # Search IPC codes for this category name
        category_ipc_codes: list[str] = []  # Raw codes for formula building
        category_ipc_display: list[str] = []  # Code + full description for UI

        if ipc_service:
            ipc_results = await ipc_service.search(category.name, top_k=2)
            for r in ipc_results:
                code_clean = r.code.replace(" ", "")
                # Deduplicate IPC codes across categories
                if code_clean not in seen_ipc_codes:
                    seen_ipc_codes.add(code_clean)
                    category_ipc_codes.append(code_clean)
                    # Full description (not truncated)
                    display = f"{r.code}: {r.description}"
                    category_ipc_display.append(display)
                    all_ipc_codes_display.append(display)

        # Create block from category
        block = FormulaBlock(
            id=f"block-{i + 1}",
            name=category.name,  # Use category name directly
            field="TAC",  # Default to Title+Abstract+Claims
            keywords=category.keywords,
            operator="OR",  # Within block, keywords are OR'd
            ipc_codes=category_ipc_display,  # Per-category IPC with full description
            enabled=True,  # Default enabled
        )
        blocks.append(block)

        # Add AND operator between blocks (except after last block)
        if i < len(output.categories) - 1:
            block_operators.append("AND")

    # Step 3: Build assembled formula using FormulaBuilder.build_from_blocks
    # Only include enabled blocks
    enabled_blocks = [b for b in blocks if b.enabled]
    blocks_as_dicts = [
        {
            "id": b.id,
            "name": b.name,
            "field": b.field,
            "keywords": b.keywords,
            "operator": b.operator,
            "ipc_codes": b.ipc_codes,
        }
        for b in enabled_blocks
    ]

    # Collect IPC codes from enabled blocks only
    enabled_ipc_codes = []
    for b in enabled_blocks:
        enabled_ipc_codes.extend(b.ipc_codes)

    assembled_formula = FormulaBuilder.build_from_blocks(
        blocks=blocks_as_dicts,
        block_operators=block_operators[: len(enabled_blocks) - 1]
        if enabled_blocks
        else [],
        ipc_codes=enabled_ipc_codes if enabled_ipc_codes else None,
        excluded_terms=output.excluded_terms if output.excluded_terms else None,
    )

    return FormulaBlocksResponse(
        blocks=blocks,
        block_operators=block_operators,
        assembled_formula=assembled_formula,
        ipc_codes=all_ipc_codes_display,  # All IPC codes with full descriptions
        excluded_terms=output.excluded_terms,
        explanation=output.explanation,
        tips=output.tips,
    )


async def assemble_formula_from_blocks(
    blocks: list[FormulaBlock],
    block_operators: list[str],
    ipc_codes: list[str] | None = None,
    excluded_terms: list[str] | None = None,
) -> str:
    """
    Assemble a KIPRIS formula from user-edited blocks.

    Only enabled blocks are included in the formula. IPC codes are collected
    from enabled blocks' ipc_codes fields (if available) or from the global
    ipc_codes parameter.

    Args:
        blocks: User-edited keyword blocks (with enabled and ipc_codes fields)
        block_operators: Operators between blocks (AND/OR)
        ipc_codes: Optional global IPC codes (fallback if blocks don't have ipc_codes)
        excluded_terms: Optional terms to exclude

    Returns:
        Assembled KIPRIS formula string
    """
    # Filter to only enabled blocks
    enabled_blocks = [b for b in blocks if b.enabled]

    if not enabled_blocks:
        return ""

    # Convert enabled blocks to dict format for FormulaBuilder
    blocks_as_dicts = [
        {
            "id": b.id,
            "name": b.name,
            "field": b.field,
            "keywords": b.keywords,
            "operator": b.operator,
            "ipc_codes": b.ipc_codes,
        }
        for b in enabled_blocks
    ]

    # Collect IPC codes from enabled blocks
    # Priority: block-level IPC codes > global IPC codes
    block_ipc_codes: list[str] = []
    for b in enabled_blocks:
        if b.ipc_codes:
            block_ipc_codes.extend(b.ipc_codes)

    # Use block IPC codes if available, otherwise fall back to global
    clean_ipc_codes: list[str] | None = None
    if block_ipc_codes:
        clean_ipc_codes = block_ipc_codes
    elif ipc_codes:
        clean_ipc_codes = []
        for code in ipc_codes:
            # Handle codes like "B60L: Electric propulsion..."
            if ":" in code and not code.startswith("MIPC"):
                clean_ipc_codes.append(code.split(":")[0].strip().replace(" ", ""))
            else:
                clean_ipc_codes.append(code.replace(" ", ""))

    # Adjust block_operators for enabled blocks only
    # We need operators between consecutive enabled blocks
    enabled_indices = [i for i, b in enumerate(blocks) if b.enabled]
    adjusted_operators: list[str] = []
    for i in range(len(enabled_indices) - 1):
        # Use the operator at the position of the current enabled block
        op_idx = enabled_indices[i]
        if op_idx < len(block_operators):
            adjusted_operators.append(block_operators[op_idx])
        else:
            adjusted_operators.append("AND")  # Default fallback

    return FormulaBuilder.build_from_blocks(
        blocks=blocks_as_dicts,
        block_operators=adjusted_operators,
        ipc_codes=clean_ipc_codes,
        excluded_terms=excluded_terms,
    )
