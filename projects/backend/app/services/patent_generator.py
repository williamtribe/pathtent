"""Patent specification generation service using Gemini AI."""

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

from app.config import Settings


# ============================================================================
# Question Generation
# ============================================================================

QUESTION_GENERATION_PROMPT = """
당신은 한국 특허청 전문 특허 변리사입니다.
연구 논문/보고서를 분석하여 특허 명세서 작성에 필요한 핵심 질문을 생성합니다.

<목표>
주어진 연구 내용을 바탕으로 특허 명세서의 각 섹션을 작성하기 위해 
연구자에게 추가로 확인해야 할 질문들을 생성합니다.
</목표>

<질문_카테고리>
1. 기술: 발명의 핵심 기술적 특징, 구현 방법
2. 배경: 기존 기술의 문제점, 해결하려는 과제
3. 효과: 발명의 기술적/상업적 효과
4. 적용분야: 발명이 적용될 수 있는 산업 분야
5. 청구항: 보호받고자 하는 권리 범위
</질문_카테고리>

<규칙>
- 총 5-7개의 질문 생성
- 각 카테고리에서 최소 1개 이상의 질문 포함
- 연구 내용에서 명확하지 않은 부분 중심으로 질문
- 특허 명세서 작성에 실질적으로 필요한 정보만 질문
- 질문은 구체적이고 명확하게 작성
</규칙>

<출력_형식>
1. 연구 내용 요약 (2-3문장)
2. 질문 목록 (각 질문에 카테고리, 힌트 포함)
</출력_형식>
"""


class QuestionItem(BaseModel):
    """Generated question for patent specification."""

    id: str = Field(..., description="질문 ID (q1, q2, ...)")
    question: str = Field(..., description="질문 내용")
    category: str = Field(
        ..., description="카테고리: 기술, 배경, 효과, 적용분야, 청구항"
    )
    hint: str = Field(..., description="답변 힌트 또는 예시")


class QuestionGenerationResult(BaseModel):
    """Result of question generation."""

    summary: str = Field(..., description="연구 내용 요약 (2-3문장)")
    questions: list[QuestionItem] = Field(..., description="질문 목록")


# ============================================================================
# Patent Specification Generation
# ============================================================================

PATENT_GENERATION_PROMPT = """
당신은 한국 특허청 전문 특허 변리사입니다.
연구 내용과 추가 답변을 바탕으로 한국 특허 명세서 형식에 맞는 완전한 명세서를 작성합니다.

<한국_특허_명세서_형식>
1. 발명의 명칭
2. 기술분야
3. 발명의 배경이 되는 기술
4. 해결하려는 과제
5. 과제의 해결 수단
6. 발명의 효과
7. 발명을 실시하기 위한 구체적인 내용
8. 청구항
9. 요약서
</한국_특허_명세서_형식>

<청구항_작성_규칙>
- 독립항 1개 이상 필수
- 종속항은 독립항을 인용
- 명확하고 간결한 문장
- 발명의 기술적 범위를 명확하게 한정
- "~것을 특징으로 하는" 형식 사용
</청구항_작성_규칙>

<작성_규칙>
- 전문적이고 격식 있는 문체 사용
- 기술 용어는 일관되게 사용
- 수치나 구체적 실시예는 답변에서 제공된 정보만 사용
- 불확실한 정보는 일반화하여 작성
- 각 섹션은 충분한 내용으로 작성 (최소 3-5문장)
</작성_규칙>
"""


class ClaimItem(BaseModel):
    """Patent claim."""

    number: int = Field(..., description="청구항 번호")
    text: str = Field(..., description="청구항 내용")
    is_independent: bool = Field(..., description="독립항 여부")
    depends_on: int | None = Field(None, description="종속 대상 청구항 번호")


class PatentSpecificationResult(BaseModel):
    """Generated patent specification."""

    title: str = Field(..., description="발명의 명칭")
    technical_field: str = Field(..., description="기술분야")
    background_art: str = Field(..., description="발명의 배경이 되는 기술")
    problem_to_solve: str = Field(..., description="해결하려는 과제")
    solution: str = Field(..., description="과제의 해결 수단")
    advantageous_effects: str = Field(..., description="발명의 효과")
    detailed_description: str = Field(
        ..., description="발명을 실시하기 위한 구체적인 내용"
    )
    claims: list[ClaimItem] = Field(..., description="청구항 목록")
    abstract: str = Field(..., description="요약서 (200자 이내)")


# ============================================================================
# Agent Singletons
# ============================================================================


class _QuestionAgentSingleton:
    _instance: Agent[None, QuestionGenerationResult] | None = None

    @classmethod
    def get(cls) -> Agent[None, QuestionGenerationResult]:
        if cls._instance is None:
            cls._instance = cls._create()
        return cls._instance

    @classmethod
    def _create(cls) -> Agent[None, QuestionGenerationResult]:
        settings = Settings()
        provider = GoogleProvider(api_key=settings.google_api_key)
        model = GoogleModel(settings.gemini_model, provider=provider)
        return Agent(
            model=model,
            output_type=QuestionGenerationResult,
            system_prompt=QUESTION_GENERATION_PROMPT,
        )


class _PatentAgentSingleton:
    _instance: Agent[None, PatentSpecificationResult] | None = None

    @classmethod
    def get(cls) -> Agent[None, PatentSpecificationResult]:
        if cls._instance is None:
            cls._instance = cls._create()
        return cls._instance

    @classmethod
    def _create(cls) -> Agent[None, PatentSpecificationResult]:
        settings = Settings()
        provider = GoogleProvider(api_key=settings.google_api_key)
        model = GoogleModel(settings.gemini_model, provider=provider)
        return Agent(
            model=model,
            output_type=PatentSpecificationResult,
            system_prompt=PATENT_GENERATION_PROMPT,
        )


# ============================================================================
# Public API
# ============================================================================


async def analyze_document(text: str) -> QuestionGenerationResult:
    """
    Analyze research document and generate questions for patent specification.

    Args:
        text: Research paper/report text content

    Returns:
        QuestionGenerationResult with summary and questions
    """
    agent = _QuestionAgentSingleton.get()
    result = await agent.run(
        f"다음 연구 내용을 분석하고 특허 명세서 작성을 위한 질문을 생성하세요:\n\n{text}"
    )
    return result.output


async def generate_specification(
    original_text: str,
    summary: str,
    answers: dict[str, str],
) -> PatentSpecificationResult:
    """
    Generate patent specification from research document and answers.

    Args:
        original_text: Original research document text
        summary: Summary from analysis phase
        answers: Dict mapping question_id to answer text

    Returns:
        PatentSpecificationResult with complete specification
    """
    # Format answers for prompt
    answers_text = "\n".join([f"- {qid}: {answer}" for qid, answer in answers.items()])

    prompt = f"""
다음 연구 내용과 추가 정보를 바탕으로 특허 명세서를 작성하세요.

## 연구 내용 요약
{summary}

## 원본 연구 내용
{original_text}

## 추가 답변 정보
{answers_text}

위 정보를 종합하여 완전한 한국 특허 명세서를 작성하세요.
"""

    agent = _PatentAgentSingleton.get()
    result = await agent.run(prompt)
    return result.output
