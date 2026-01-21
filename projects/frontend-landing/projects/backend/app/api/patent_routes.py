"""Patent specification generation API routes."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pathlib import Path
import tempfile

from app.api.patent_schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    Question,
    GenerateRequest,
    GenerateResponse,
    Claim,
    PatentSpecification,
    SessionStatusResponse,
)
from app.services.patent_generator import analyze_document, generate_specification
from app.services.session_store import session_store
from app.services.pdf_extractor import PyMuPDFExtractor

router = APIRouter(tags=["patent"])


@router.post("/patent/analyze", response_model=AnalyzeResponse)
async def analyze_research_document(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    연구 논문/보고서 분석 및 질문 생성.

    연구 내용을 분석하고 특허 명세서 작성에 필요한 질문들을 생성합니다.
    반환되는 session_id를 후속 요청에 사용하세요.

    Args:
        request: 연구 논문/보고서 텍스트

    Returns:
        세션 ID, 요약, 질문 목록
    """
    # Create session
    session = session_store.create(request.text)

    try:
        # Analyze document and generate questions
        result = await analyze_document(request.text)

        # Update session with analysis results
        questions_data = [
            {
                "id": q.id,
                "question": q.question,
                "category": q.category,
                "hint": q.hint,
            }
            for q in result.questions
        ]

        session_store.update(
            session.id,
            summary=result.summary,
            questions=questions_data,
            status="analyzed",
        )

        # Convert to response format
        questions = [
            Question(
                id=q.id,
                question=q.question,
                category=q.category,
                hint=q.hint,
            )
            for q in result.questions
        ]

        return AnalyzeResponse(
            session_id=session.id,
            summary=result.summary,
            questions=questions,
        )

    except Exception as e:
        session_store.delete(session.id)
        raise HTTPException(status_code=500, detail=f"분석 중 오류 발생: {str(e)}")


@router.post("/patent/analyze/pdf", response_model=AnalyzeResponse)
async def analyze_pdf_document(file: UploadFile = File(...)) -> AnalyzeResponse:
    """
    PDF 파일 업로드 및 분석.

    PDF 연구 논문/보고서를 업로드하면 텍스트를 추출하고 분석합니다.

    Args:
        file: PDF 파일

    Returns:
        세션 ID, 요약, 질문 목록
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다.")

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        # Extract text from PDF
        extractor = PyMuPDFExtractor()
        text = await extractor.extract_text(tmp_path)

        if len(text.strip()) < 100:
            raise HTTPException(
                status_code=400, detail="PDF에서 충분한 텍스트를 추출할 수 없습니다."
            )

        # Analyze the extracted text
        request = AnalyzeRequest(text=text)
        return await analyze_research_document(request)

    finally:
        # Cleanup temp file
        tmp_path.unlink(missing_ok=True)


@router.post("/patent/generate", response_model=GenerateResponse)
async def generate_patent_specification(request: GenerateRequest) -> GenerateResponse:
    """
    특허 명세서 생성.

    분석 단계에서 받은 질문에 대한 답변을 제출하면
    완전한 특허 명세서를 생성합니다.

    Args:
        request: 세션 ID와 질문 답변 목록

    Returns:
        생성된 특허 명세서
    """
    # Get session
    session = session_store.get(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404, detail="세션을 찾을 수 없거나 만료되었습니다."
        )

    if session.status not in ("analyzed", "completed"):
        raise HTTPException(
            status_code=400,
            detail=f"현재 상태에서는 명세서를 생성할 수 없습니다. 상태: {session.status}",
        )

    # Update session status
    session_store.update(request.session_id, status="generating")

    try:
        # Convert answers to dict
        answers_dict = {a.question_id: a.answer for a in request.answers}

        # Store answers
        session_store.update(request.session_id, answers=answers_dict)

        # Generate specification
        result = await generate_specification(
            original_text=session.original_text,
            summary=session.summary,
            answers=answers_dict,
        )

        # Convert to response format
        claims = [
            Claim(
                number=c.number,
                text=c.text,
                is_independent=c.is_independent,
                depends_on=c.depends_on,
            )
            for c in result.claims
        ]

        specification = PatentSpecification(
            title=result.title,
            technical_field=result.technical_field,
            background_art=result.background_art,
            problem_to_solve=result.problem_to_solve,
            solution=result.solution,
            advantageous_effects=result.advantageous_effects,
            detailed_description=result.detailed_description,
            claims=claims,
            abstract=result.abstract,
        )

        # Store result and update status
        session_store.update(
            request.session_id,
            specification=specification.model_dump(),
            status="completed",
        )

        return GenerateResponse(
            session_id=request.session_id,
            specification=specification,
        )

    except Exception as e:
        session_store.update(request.session_id, status="analyzed")  # Rollback status
        raise HTTPException(
            status_code=500, detail=f"명세서 생성 중 오류 발생: {str(e)}"
        )


@router.get("/patent/session/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(session_id: str) -> SessionStatusResponse:
    """
    세션 상태 조회.

    현재 세션의 상태와 완료된 경우 생성된 명세서를 반환합니다.

    Args:
        session_id: 세션 ID

    Returns:
        세션 상태 및 명세서 (완료 시)
    """
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404, detail="세션을 찾을 수 없거나 만료되었습니다."
        )

    specification = None
    if session.specification:
        spec_data = session.specification
        claims = [
            Claim(
                number=c["number"],
                text=c["text"],
                is_independent=c["is_independent"],
                depends_on=c.get("depends_on"),
            )
            for c in spec_data["claims"]
        ]
        specification = PatentSpecification(
            title=spec_data["title"],
            technical_field=spec_data["technical_field"],
            background_art=spec_data["background_art"],
            problem_to_solve=spec_data["problem_to_solve"],
            solution=spec_data["solution"],
            advantageous_effects=spec_data["advantageous_effects"],
            detailed_description=spec_data["detailed_description"],
            claims=claims,
            abstract=spec_data["abstract"],
        )

    return SessionStatusResponse(
        session_id=session_id,
        status=session.status,
        created_at=session.created_at.isoformat(),
        specification=specification,
    )
