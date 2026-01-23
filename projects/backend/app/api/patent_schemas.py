"""Patent specification generation API schemas."""

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request to analyze research document and generate questions."""

    text: str = Field(..., description="연구 논문/보고서 텍스트", min_length=100)


class Question(BaseModel):
    """A question for patent specification."""

    id: str = Field(..., description="질문 고유 ID")
    question: str = Field(..., description="질문 내용")
    category: str = Field(
        ..., description="질문 카테고리 (기술, 배경, 효과, 적용분야, 청구항)"
    )
    hint: str | None = Field(None, description="답변 힌트")
    choices: list[str] | None = Field(None, description="객관식 선택지 (없으면 주관식)")


class AnalyzeResponse(BaseModel):
    """Response with session ID and generated questions."""

    session_id: str = Field(..., description="세션 ID (후속 요청에 사용)")
    summary: str = Field(..., description="연구 내용 요약")
    questions: list[Question] = Field(..., description="특허 작성을 위한 질문 목록")


class Answer(BaseModel):
    """User's answer to a question."""

    question_id: str = Field(..., description="질문 ID")
    answer: str = Field(..., description="답변 내용")


class GenerateRequest(BaseModel):
    """Request to generate patent specification."""

    session_id: str = Field(..., description="분석 시 받은 세션 ID")
    answers: list[Answer] = Field(..., description="질문에 대한 답변 목록")


class Claim(BaseModel):
    """Patent claim."""

    number: int = Field(..., description="청구항 번호")
    text: str = Field(..., description="청구항 내용")
    is_independent: bool = Field(..., description="독립항 여부")
    depends_on: int | None = Field(None, description="종속 대상 청구항 번호")


class PatentSpecification(BaseModel):
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
    claims: list[Claim] = Field(..., description="청구항")
    abstract: str = Field(..., description="요약서")


class GenerateResponse(BaseModel):
    """Response with generated patent specification."""

    session_id: str
    specification: PatentSpecification


class SessionStatusResponse(BaseModel):
    """Session status response."""

    session_id: str
    status: str = Field(
        ..., description="pending | analyzed | generating | completed | expired"
    )
    created_at: str
    specification: PatentSpecification | None = None


class ChatMessage(BaseModel):
    """Chat message for patent specification refinement."""

    role: str = Field(..., description="메시지 역할: user 또는 assistant")
    content: str = Field(..., description="메시지 내용")


class ChatRequest(BaseModel):
    """Request to refine patent specification via chat."""

    session_id: str = Field(..., description="세션 ID")
    message: str = Field(..., description="사용자 메시지")


class ChatResponse(BaseModel):
    """Response with updated specification and assistant message."""

    session_id: str
    message: str = Field(..., description="AI 응답 메시지")
    specification: PatentSpecification = Field(..., description="업데이트된 명세서")
