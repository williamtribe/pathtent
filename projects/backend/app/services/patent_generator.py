"""Patent specification generation service using LLM (multi-provider support)."""

from pydantic import BaseModel, Field
from pydantic_ai import Agent


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

<질문_유형>
객관식으로 처리 가능한 질문은 choices를 제공하세요:
- 적용분야: 산업 분야 (제조, 의료, 통신, 금융, 교육, 농업 등)
- 기술분야: 기술 카테고리 (AI/ML, IoT, 클라우드, 블록체인, 로봇 등)
- 효과: 주요 효과 유형 (비용절감, 시간단축, 품질향상, 안전성향상 등)

주관식이 필요한 질문은 choices를 비워두세요:
- 구체적인 구현 방법
- 기술적 상세 설명
- 특정 문제점 설명
</질문_유형>

<규칙>
- 총 5-7개의 질문 생성
- 각 카테고리에서 최소 1개 이상의 질문 포함
- 연구 내용에서 명확하지 않은 부분 중심으로 질문
- 특허 명세서 작성에 실질적으로 필요한 정보만 질문
- 질문은 구체적이고 명확하게 작성
- 객관식 질문의 경우 4-6개의 선택지 제공
- 모든 객관식 질문에는 "기타 (직접 입력)" 옵션이 자동으로 추가됨
</규칙>

<출력_형식>
1. 연구 내용 요약 (2-3문장)
2. 질문 목록 (각 질문에 카테고리, 힌트, choices(선택적) 포함)
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
    choices: list[str] | None = Field(None, description="객관식 선택지 (없으면 주관식)")


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
1. 발명의 명칭 (국문 및 영문)
2. 기술분야
3. 발명의 배경이 되는 기술
4. 해결하려는 과제
5. 과제의 해결 수단
6. 발명의 효과
7. 발명을 실시하기 위한 구체적인 내용
8. 청구항
9. 요약서
</한국_특허_명세서_형식>

<발명의_명칭_작성_규칙>
- 국문 명칭: 발명의 핵심 내용을 간결하게 표현 (20자 이내 권장)
- 영문 명칭: 국문 명칭을 정확하게 영어로 번역
- 너무 포괄적이거나 추상적인 표현 지양
- 기술적 특징을 명확히 드러내는 용어 사용
</발명의_명칭_작성_규칙>

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

    title: str = Field(..., description="발명의 명칭 (국문)")
    title_en: str = Field(..., description="발명의 명칭 (영문)")
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
        from app.services.llm_factory import get_model

        model = get_model()
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
        from app.services.llm_factory import get_model

        model = get_model()
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


from collections.abc import AsyncIterator
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)


async def generate_specification_stream(
    original_text: str,
    summary: str,
    answers: dict[str, str],
) -> AsyncIterator[dict]:
    """
    Generate patent specification with streaming updates.

    Yields partial specification as it's being generated.
    """
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

    try:
        async with agent.run_stream(prompt) as result:
            chunk_count = 0
            final_output = None

            # stream_output() yields partial validated outputs for structured data
            async for partial_output in result.stream_output(debounce_by=0.5):
                chunk_count += 1
                final_output = partial_output
                logger.info(f"Chunk {chunk_count}: title={getattr(partial_output, 'title', 'N/A')}")
                yield {
                    "type": "partial",
                    "data": partial_output.model_dump(),
                    "done": False,
                }

            # Use the last yielded output as the final result
            if final_output is not None:
                logger.info(f"Streaming complete, got final result: {final_output.title}")
                yield {"type": "complete", "data": final_output.model_dump(), "done": True}
            else:
                # Fallback to result.output if no partial outputs were received
                final_result = result.output
                logger.info(f"Using result.output: {final_result.title}")
                yield {"type": "complete", "data": final_result.model_dump(), "done": True}

    except Exception as e:
        logger.error(f"Error in generate_specification_stream: {e}", exc_info=True)
        raise
