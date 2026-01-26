"""Chat-based patent specification refinement service (multi-provider support)."""

from pydantic import BaseModel, Field
from pydantic_ai import Agent

from app.services.patent_generator import (
    ClaimItem,
    PatentSpecificationResult,
)


CHAT_REFINEMENT_PROMPT = """
당신은 가출원 명세서 작성을 돕는 AI 도우미입니다.
사용자와 대화하며 가출원용 특허 명세서 초안을 개선합니다.

<역할>
- 현재 명세서 초안을 분석하고 사용자의 요청에 따라 수정
- 사용자가 원하는 방향으로 명세서 내용 조정
- 가출원에 적합한 수준으로 내용 작성
- 전문 변리사의 검토가 필요한 부분은 안내
</역할>

<대화_규칙>
1. 사용자의 요청을 명확히 이해하고 반영
2. 수정 사항을 자연스럽게 설명
3. 필요시 추가 정보 요청
4. 전문적이면서도 친근한 톤 유지
</대화_규칙>

<수정_가능_영역>
- 발명의 명칭
- 기술분야
- 배경기술 (문제점 강조/약화)
- 해결하려는 과제 (초점 변경)
- 해결 수단 (상세도 조정)
- 발명의 효과 (효과 추가/제거/강조)
- 구체적 내용 (실시예 추가/수정)
- 청구항 (범위 조정, 항목 추가/제거)
- 요약서
</수정_가능_영역>

<출력>
1. 사용자에게 보낼 응답 메시지 (어떤 부분을 어떻게 수정했는지 설명)
2. 업데이트된 전체 명세서
</출력>
"""


class ChatRefinementInput(BaseModel):
    current_specification: PatentSpecificationResult
    user_message: str
    chat_history: list[dict[str, str]]


class ChatRefinementResult(BaseModel):
    assistant_message: str = Field(..., description="AI 응답 메시지")
    updated_specification: PatentSpecificationResult = Field(
        ..., description="업데이트된 명세서"
    )


class _ChatRefinerSingleton:
    _instance: Agent[ChatRefinementInput, ChatRefinementResult] | None = None

    @classmethod
    def get(cls) -> Agent[ChatRefinementInput, ChatRefinementResult]:
        if cls._instance is None:
            cls._instance = cls._create()
        return cls._instance

    @classmethod
    def _create(cls) -> Agent[ChatRefinementInput, ChatRefinementResult]:
        from app.services.llm_factory import get_model

        model = get_model()
        return Agent(
            model=model,
            output_type=ChatRefinementResult,
            system_prompt=CHAT_REFINEMENT_PROMPT,
        )


async def refine_via_chat(
    current_spec: PatentSpecificationResult,
    user_message: str,
    chat_history: list[dict[str, str]],
) -> ChatRefinementResult:
    agent = _ChatRefinerSingleton.get()

    history_text = "\n".join(
        [f"{msg['role']}: {msg['content']}" for msg in chat_history[-5:]]
    )

    prompt = f"""
현재 명세서:
{current_spec.model_dump_json(indent=2)}

최근 대화:
{history_text}

사용자 요청: {user_message}

위 요청에 따라 명세서를 수정하고, 어떤 부분을 어떻게 변경했는지 설명하세요.
"""

    result = await agent.run(prompt)
    return result.output
