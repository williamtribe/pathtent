"""Patent specification generation API routes."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File

from app.api.dependencies import RequireAPIKey, limiter

logger = logging.getLogger(__name__)
from fastapi.responses import StreamingResponse
from pathlib import Path
import tempfile
from urllib.parse import quote

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.patent_schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    Question,
    GenerateRequest,
    GenerateResponse,
    Claim,
    PatentSpecification,
    SessionStatusResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.patent_generator import (
    analyze_document,
    generate_specification,
    generate_specification_stream,
    PatentSpecificationResult,
    ClaimItem,
)
from app.services.session_store import session_store
from app.services.pdf_extractor import PyMuPDFExtractor
from app.services.word_generator import generate_word_document
from app.services.chat_refiner import refine_via_chat
from kipris import (
    KIPRISClient,
    IPCInfo,
    IPCSearchParams,
    IPCSearchResponse,
    FreeSearchParams,
    FreeSearchResponse,
)
from app.config import Settings
from app.services.sna_excel_generator import generate_sna_excel
from app.services.sna_analyzer import (
    analyze_ipc_cooccurrence,
    SNAResult,
    PatentRecord,
    parse_year,
)
from app.services.sna_filter import filter_patents_by_similarity
from app.services.embedding import GeminiEmbeddingService
from app.repository import bulk_upsert_patents_from_kipris

router = APIRouter(tags=["patent"])


@router.post("/patent/analyze", response_model=GenerateResponse)
@limiter.limit("10/minute")
async def analyze_research_document(
    body: AnalyzeRequest, request: Request, _auth: RequireAPIKey
) -> GenerateResponse:
    """
    연구 논문/보고서 분석 및 초안 명세서 생성.

    연구 내용을 분석하고 즉시 특허 명세서 초안을 생성합니다.
    반환되는 session_id와 초안 명세서로 AI 챗봇과 대화하며 수정할 수 있습니다.

    Args:
        body: 연구 논문/보고서 텍스트

    Returns:
        세션 ID, 초안 명세서
    """
    session = session_store.create(body.text)

    try:
        result = await generate_specification(
            original_text=body.text,
            summary="",
            answers={},
        )

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
            title_en=result.title_en,
            technical_field=result.technical_field,
            background_art=result.background_art,
            problem_to_solve=result.problem_to_solve,
            solution=result.solution,
            advantageous_effects=result.advantageous_effects,
            detailed_description=result.detailed_description,
            claims=claims,
            abstract=result.abstract,
        )

        session_store.update(
            session.id,
            specification=specification.model_dump(),
            status="completed",
        )

        return GenerateResponse(
            session_id=session.id,
            specification=specification,
        )

    except Exception as e:
        logger.exception("문서 분석 중 오류 발생")
        session_store.delete(session.id)
        raise HTTPException(status_code=500, detail="문서 분석 중 오류가 발생했습니다")


@router.post("/patent/analyze/stream")
@limiter.limit("10/minute")
async def analyze_research_document_stream(
    body: AnalyzeRequest, request: Request, _auth: RequireAPIKey
) -> StreamingResponse:
    """
    연구 논문/보고서 분석 및 초안 명세서 생성 (스트리밍).

    SSE(Server-Sent Events)로 생성 진행 상황을 실시간 전송합니다.
    """
    session = session_store.create(body.text)
    logger.info(f"Created session: {session.id}")

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'start', 'session_id': session.id})}\n\n"
            logger.info("Sent start event")

            async for update in generate_specification_stream(
                original_text=body.text,
                summary="",
                answers={},
            ):
                logger.info(f"Received update: {update['type']}")
                if update["type"] == "partial":
                    yield f"data: {json.dumps({'type': 'progress', 'data': update['data']})}\n\n"
                elif update["type"] == "complete":
                    result = update["data"]
                    logger.info(f"Processing complete result: {result.get('title', 'no title')}")
                    claims = [
                        Claim(
                            number=c["number"],
                            text=c["text"],
                            is_independent=c["is_independent"],
                            depends_on=c.get("depends_on"),
                        ).model_dump()
                        for c in result.get("claims", [])
                    ]
                    specification = PatentSpecification(
                        title=result["title"],
                        title_en=result["title_en"],
                        technical_field=result["technical_field"],
                        background_art=result["background_art"],
                        problem_to_solve=result["problem_to_solve"],
                        solution=result["solution"],
                        advantageous_effects=result["advantageous_effects"],
                        detailed_description=result["detailed_description"],
                        claims=[Claim(**c) for c in claims],
                        abstract=result["abstract"],
                    )
                    session_store.update(
                        session.id,
                        specification=specification.model_dump(),
                        status="completed",
                    )
                    logger.info("Sending complete event")
                    yield f"data: {json.dumps({'type': 'complete', 'session_id': session.id, 'specification': specification.model_dump()})}\n\n"

        except Exception as e:
            logger.error(f"Error in event_generator: {e}", exc_info=True)
            session_store.delete(session.id)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/patent/analyze/pdf", response_model=AnalyzeResponse)
@limiter.limit("10/minute")
async def analyze_pdf_document(
    request: Request, _auth: RequireAPIKey, file: UploadFile = File(...)
) -> AnalyzeResponse:
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

        # Analyze the extracted text (pass through req and _auth for rate limiting/auth)
        analyze_request = AnalyzeRequest(text=text)
        return await analyze_research_document(analyze_request, request, _auth)

    finally:
        # Cleanup temp file
        tmp_path.unlink(missing_ok=True)


@router.post("/patent/generate", response_model=GenerateResponse)
@limiter.limit("10/minute")
async def generate_patent_specification(
    body: GenerateRequest, request: Request, _auth: RequireAPIKey
) -> GenerateResponse:
    """
    특허 명세서 생성.

    분석 단계에서 받은 질문에 대한 답변을 제출하면
    완전한 특허 명세서를 생성합니다.

    Args:
        body: 세션 ID와 질문 답변 목록

    Returns:
        생성된 특허 명세서
    """
    # Get session
    session = session_store.get(body.session_id)
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
    session_store.update(body.session_id, status="generating")

    try:
        # Convert answers to dict
        answers_dict = {a.question_id: a.answer for a in body.answers}

        # Store answers
        session_store.update(body.session_id, answers=answers_dict)

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
            title_en=result.title_en,
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
            body.session_id,
            specification=specification.model_dump(),
            status="completed",
        )

        return GenerateResponse(
            session_id=body.session_id,
            specification=specification,
        )

    except Exception as e:
        logger.exception("명세서 생성 중 오류 발생")
        session_store.update(body.session_id, status="analyzed")  # Rollback status
        raise HTTPException(
            status_code=500, detail="명세서 생성 중 오류가 발생했습니다"
        )


@router.get("/patent/session/{session_id}", response_model=SessionStatusResponse)
@limiter.limit("60/minute")
async def get_session_status(
    session_id: str, request: Request, _auth: RequireAPIKey
) -> SessionStatusResponse:
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
            title_en=spec_data.get("title_en", ""),
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


@router.post("/patent/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat_refine_specification(
    body: ChatRequest, request: Request, _auth: RequireAPIKey
) -> ChatResponse:
    """
    AI 챗봇과 대화하며 명세서 수정.

    사용자 메시지를 받아 AI가 명세서를 수정하고 응답합니다.

    Args:
        body: 세션 ID와 사용자 메시지

    Returns:
        AI 응답과 업데이트된 명세서
    """
    session = session_store.get(body.session_id)
    if not session:
        raise HTTPException(
            status_code=404, detail="세션을 찾을 수 없거나 만료되었습니다."
        )

    if not session.specification:
        raise HTTPException(
            status_code=400, detail="명세서가 아직 생성되지 않았습니다."
        )

    spec_data = session.specification
    claims = [
        ClaimItem(
            number=c["number"],
            text=c["text"],
            is_independent=c["is_independent"],
            depends_on=c.get("depends_on"),
        )
        for c in spec_data["claims"]
    ]
    current_spec = PatentSpecificationResult(
        title=spec_data["title"],
        title_en=spec_data.get("title_en", ""),
        technical_field=spec_data["technical_field"],
        background_art=spec_data["background_art"],
        problem_to_solve=spec_data["problem_to_solve"],
        solution=spec_data["solution"],
        advantageous_effects=spec_data["advantageous_effects"],
        detailed_description=spec_data["detailed_description"],
        claims=claims,
        abstract=spec_data["abstract"],
    )

    try:
        result = await refine_via_chat(
            current_spec=current_spec,
            user_message=body.message,
            chat_history=session.chat_history,
        )

        updated_claims = [
            Claim(
                number=c.number,
                text=c.text,
                is_independent=c.is_independent,
                depends_on=c.depends_on,
            )
            for c in result.updated_specification.claims
        ]

        updated_specification = PatentSpecification(
            title=result.updated_specification.title,
            title_en=result.updated_specification.title_en,
            technical_field=result.updated_specification.technical_field,
            background_art=result.updated_specification.background_art,
            problem_to_solve=result.updated_specification.problem_to_solve,
            solution=result.updated_specification.solution,
            advantageous_effects=result.updated_specification.advantageous_effects,
            detailed_description=result.updated_specification.detailed_description,
            claims=updated_claims,
            abstract=result.updated_specification.abstract,
        )

        chat_history = session.chat_history + [
            {"role": "user", "content": body.message},
            {"role": "assistant", "content": result.assistant_message},
        ]

        session_store.update(
            body.session_id,
            specification=updated_specification.model_dump(),
            chat_history=chat_history,
        )

        return ChatResponse(
            session_id=body.session_id,
            message=result.assistant_message,
            specification=updated_specification,
        )

    except Exception as e:
        logger.exception("명세서 수정 중 오류 발생")
        raise HTTPException(
            status_code=500, detail="명세서 수정 중 오류가 발생했습니다"
        )


@router.get("/patent/download/{session_id}")
@limiter.limit("10/minute")
async def download_patent_word(
    session_id: str, request: Request, _auth: RequireAPIKey
) -> StreamingResponse:
    """
    특허 명세서 Word 파일 다운로드.

    완료된 세션의 특허 명세서를 Word 문서(.docx)로 다운로드합니다.

    Args:
        session_id: 세션 ID

    Returns:
        Word 문서 파일
    """
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404, detail="세션을 찾을 수 없거나 만료되었습니다."
        )

    if session.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"명세서가 아직 생성되지 않았습니다. 상태: {session.status}",
        )

    if not session.specification:
        raise HTTPException(status_code=404, detail="생성된 명세서를 찾을 수 없습니다.")

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
        title_en=spec_data.get("title_en", ""),
        technical_field=spec_data["technical_field"],
        background_art=spec_data["background_art"],
        problem_to_solve=spec_data["problem_to_solve"],
        solution=spec_data["solution"],
        advantageous_effects=spec_data["advantageous_effects"],
        detailed_description=spec_data["detailed_description"],
        claims=claims,
        abstract=spec_data["abstract"],
    )

    word_buffer = generate_word_document(specification)

    filename = f"{specification.title.replace(' ', '_')}.docx"
    encoded_filename = quote(filename)

    return StreamingResponse(
        word_buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        },
    )


@router.get("/patent/ipc/{application_number}")
@limiter.limit("30/minute")
async def get_ipc_codes(
    application_number: str, request: Request, _auth: RequireAPIKey
) -> list[IPCInfo]:
    """
    출원번호로 IPC 코드 조회.

    KIPRIS API를 통해 특정 출원번호의 IPC 분류 코드를 조회합니다.

    Args:
        application_number: 출원번호 (예: 1020060118886)

    Returns:
        IPC 코드 목록
    """
    settings = Settings()
    if not settings.kipris_service_key:
        raise HTTPException(
            status_code=500, detail="KIPRIS API 키가 설정되지 않았습니다."
        )

    try:
        async with KIPRISClient(settings.kipris_service_key) as client:
            ipc_list = await client.get_ipc_info(application_number)
            if not ipc_list:
                raise HTTPException(
                    status_code=404,
                    detail="해당 출원번호의 IPC 정보를 찾을 수 없습니다.",
                )
            return ipc_list
    except Exception as e:
        logger.exception("IPC 조회 중 오류 발생")
        raise HTTPException(status_code=500, detail="IPC 조회 중 오류가 발생했습니다")


@router.get("/patent/search/ipc")
@limiter.limit("20/minute")
async def search_patents_by_ipc(
    ipc_number: str,
    request: Request,
    _auth: RequireAPIKey,
    page: int = 1,
    page_size: int = 30,
    patent: bool | None = None,
    utility: bool | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    desc: bool = False,
    db: AsyncSession = Depends(get_db),
) -> IPCSearchResponse:
    """
    IPC 코드로 특허 검색.

    KIPRIS API를 통해 IPC 코드로 특허/실용신안을 검색합니다.

    Args:
        ipc_number: IPC 코드 (예: G06F 3/041)
        page: 페이지 번호 (기본: 1)
        page_size: 페이지당 건수 (기본: 30, 최대: 500)
        patent: 특허 포함 여부
        utility: 실용신안 포함 여부
        status: 행정처분 (A:공개, C:취하, F:소멸, G:포기, I:무효, J:거절, R:등록)
        sort_by: 정렬기준 (PD:공고일자, AD:출원일자, GD:등록일자, OPD:공개일자)
        desc: 내림차순 정렬 여부

    Returns:
        검색 결과 목록
    """
    settings = Settings()
    if not settings.kipris_service_key:
        raise HTTPException(
            status_code=500, detail="KIPRIS API 키가 설정되지 않았습니다."
        )

    if page_size > 500:
        raise HTTPException(
            status_code=400, detail="페이지당 최대 500건까지 조회 가능합니다."
        )

    params = IPCSearchParams(
        ipcNumber=ipc_number,
        docsStart=page,
        docsCount=page_size,
        patent=patent,
        utility=utility,
        lastvalue=status if status in ["", "A", "C", "F", "G", "I", "J", "R"] else None,
        sortSpec=sort_by
        if sort_by in ["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"]
        else None,
        descSort=desc,
    )

    try:
        async with KIPRISClient(settings.kipris_service_key) as client:
            result = await client.search_by_ipc(params)

        if result.results:
            kipris_data = [r.model_dump(by_alias=True) for r in result.results]
            await bulk_upsert_patents_from_kipris(db, kipris_data)
            await db.commit()

        return result
    except Exception as e:
        logger.exception("IPC 검색 중 오류 발생")
        raise HTTPException(status_code=500, detail="IPC 검색 중 오류가 발생했습니다")


@router.get("/patent/search/ipc/excel")
@limiter.limit("10/minute")
async def download_ipc_search_as_excel(
    ipc_number: str,
    request: Request,
    _auth: RequireAPIKey,
    page: int = 1,
    page_size: int = 500,
    patent: bool | None = None,
    utility: bool | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    desc: bool = False,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    IPC 코드로 특허 검색 후 SNA 분석용 엑셀 다운로드.

    Colab SNA 분석 코드의 입력 파일 형식으로 출력합니다.
    컬럼: 출원번호, Original IPC Main, Original IPC All, WINTELIPS KEY
    """
    settings = Settings()
    if not settings.kipris_service_key:
        raise HTTPException(
            status_code=500, detail="KIPRIS API 키가 설정되지 않았습니다."
        )

    if page_size > 500:
        page_size = 500

    params = IPCSearchParams(
        ipcNumber=ipc_number,
        docsStart=page,
        docsCount=page_size,
        patent=patent,
        utility=utility,
        lastvalue=status if status in ["", "A", "C", "F", "G", "I", "J", "R"] else None,
        sortSpec=sort_by
        if sort_by in ["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"]
        else None,
        descSort=desc,
    )

    try:
        async with KIPRISClient(settings.kipris_service_key) as client:
            search_result = await client.search_by_ipc(params)

        if not search_result.results:
            raise HTTPException(status_code=404, detail="검색 결과가 없습니다.")

        kipris_data = [r.model_dump(by_alias=True) for r in search_result.results]
        await bulk_upsert_patents_from_kipris(db, kipris_data)
        await db.commit()

        excel_buffer = generate_sna_excel(search_result.results)

        safe_ipc = ipc_number.replace("/", "-").replace(" ", "_")
        filename = f"sna_data_{safe_ipc}.xlsx"
        encoded_filename = quote(filename)

        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("엑셀 생성 중 오류 발생")
        raise HTTPException(status_code=500, detail="엑셀 생성 중 오류가 발생했습니다")


@router.get("/patent/search/free")
@limiter.limit("20/minute")
async def search_patents_free(
    word: str,
    request: Request,
    _auth: RequireAPIKey,
    page: int = 1,
    page_size: int = 30,
    patent: bool | None = None,
    utility: bool | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    desc: bool = False,
    db: AsyncSession = Depends(get_db),
) -> FreeSearchResponse:
    """
    키워드로 특허 자유검색.

    KIPRIS API를 통해 키워드로 특허/실용신안을 검색합니다.

    Args:
        word: 검색 키워드
        page: 페이지 번호 (기본: 1)
        page_size: 페이지당 건수 (기본: 30, 최대: 500)
        patent: 특허 포함 여부
        utility: 실용신안 포함 여부
        status: 행정처분 (A:공개, C:취하, F:소멸, G:포기, I:무효, J:거절, R:등록)
        sort_by: 정렬기준 (PD:공고일자, AD:출원일자, GD:등록일자, OPD:공개일자)
        desc: 내림차순 정렬 여부

    Returns:
        검색 결과 목록
    """
    settings = Settings()
    if not settings.kipris_service_key:
        raise HTTPException(
            status_code=500, detail="KIPRIS API 키가 설정되지 않았습니다."
        )

    if page_size > 500:
        raise HTTPException(
            status_code=400, detail="페이지당 최대 500건까지 조회 가능합니다."
        )

    params = FreeSearchParams(
        word=word,
        docsStart=page,
        docsCount=page_size,
        patent=patent,
        utility=utility,
        lastvalue=status if status in ["", "A", "C", "F", "G", "I", "J", "R"] else None,
        sortSpec=sort_by
        if sort_by in ["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"]
        else None,
        descSort=desc,
    )

    try:
        async with KIPRISClient(settings.kipris_service_key) as client:
            result = await client.free_search(params)

        if result.results:
            kipris_data = [r.model_dump(by_alias=True) for r in result.results]
            await bulk_upsert_patents_from_kipris(db, kipris_data)
            await db.commit()

        return result
    except Exception as e:
        logger.exception("자유검색 중 오류 발생")
        raise HTTPException(status_code=500, detail="자유검색 중 오류가 발생했습니다")


@router.get("/patent/search/free/excel")
@limiter.limit("10/minute")
async def download_free_search_as_excel(
    word: str,
    request: Request,
    _auth: RequireAPIKey,
    page: int = 1,
    page_size: int = 500,
    patent: bool | None = None,
    utility: bool | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    desc: bool = False,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    키워드로 특허 검색 후 SNA 분석용 엑셀 다운로드.

    Colab SNA 분석 코드의 입력 파일 형식으로 출력합니다.
    컬럼: 출원번호, Original IPC Main, Original IPC All, WINTELIPS KEY
    """
    settings = Settings()
    if not settings.kipris_service_key:
        raise HTTPException(
            status_code=500, detail="KIPRIS API 키가 설정되지 않았습니다."
        )

    if page_size > 500:
        page_size = 500

    params = FreeSearchParams(
        word=word,
        docsStart=page,
        docsCount=page_size,
        patent=patent,
        utility=utility,
        lastvalue=status if status in ["", "A", "C", "F", "G", "I", "J", "R"] else None,
        sortSpec=sort_by
        if sort_by in ["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"]
        else None,
        descSort=desc,
    )

    try:
        async with KIPRISClient(settings.kipris_service_key) as client:
            search_result = await client.free_search(params)

        if not search_result.results:
            raise HTTPException(status_code=404, detail="검색 결과가 없습니다.")

        kipris_data = [r.model_dump(by_alias=True) for r in search_result.results]
        await bulk_upsert_patents_from_kipris(db, kipris_data)
        await db.commit()

        excel_buffer = generate_sna_excel(search_result.results)

        safe_word = word.replace("/", "-").replace(" ", "_")[:30]
        filename = f"sna_data_{safe_word}.xlsx"
        encoded_filename = quote(filename)

        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("엑셀 생성 중 오류 발생")
        raise HTTPException(status_code=500, detail="엑셀 생성 중 오류가 발생했습니다")


@router.get("/patent/sna/free")
@limiter.limit("5/minute")
async def analyze_sna_free_search(
    word: str,
    request: Request,
    _auth: RequireAPIKey,
    code_length: int = 4,
    page_size: int = 500,
    patent: bool | None = None,
    utility: bool | None = None,
    start_year: int | None = None,
    end_year: int | None = None,
    include_yearly: bool = True,
    enable_filter: bool = False,
    min_similarity: float = 0.5,
    db: AsyncSession = Depends(get_db),
) -> SNAResult:
    """
    키워드로 특허 검색 후 IPC 동시출현 네트워크 분석.

    KIPRIS에서 특허를 검색하고 IPC 코드 간 동시출현빈도를 계산하여
    네트워크 시각화에 필요한 노드/엣지 데이터를 반환합니다.

    Args:
        word: 검색 키워드
        code_length: IPC 코드 길이 (4: 서브클래스, 8: 메인그룹)
        page_size: 검색할 특허 수 (최대 500)
        patent: 특허 포함 여부
        utility: 실용신안 포함 여부
        start_year: 시작 출원연도 (예: 2015)
        end_year: 종료 출원연도 (예: 2024)
        include_yearly: 연도별 데이터 포함 여부

    Returns:
        nodes: 노드 목록 (IPC 코드)
        edges: 엣지 목록 (동시출현 관계)
        total_patents: 분석된 특허 수
        year_range: 데이터의 연도 범위
        yearly_data: 연도별 누적 네트워크 데이터
    """
    settings = Settings()
    if not settings.kipris_service_key:
        raise HTTPException(
            status_code=500, detail="KIPRIS API 키가 설정되지 않았습니다."
        )

    if code_length not in (4, 8):
        raise HTTPException(
            status_code=400, detail="code_length는 4 또는 8이어야 합니다."
        )

    if page_size > 500:
        page_size = 500

    params = FreeSearchParams(
        word=word,
        docsStart=1,
        docsCount=page_size,
        patent=patent,
        utility=utility,
        sortSpec="AD",
        descSort=True,
    )

    try:
        async with KIPRISClient(settings.kipris_service_key) as client:
            search_result = await client.free_search(params)

        if not search_result.results:
            raise HTTPException(status_code=404, detail="검색 결과가 없습니다.")

        kipris_data = [r.model_dump(by_alias=True) for r in search_result.results]
        await bulk_upsert_patents_from_kipris(db, kipris_data)
        await db.commit()

        # 유사도 필터링 적용
        if enable_filter:
            filter_settings = Settings()
            if not filter_settings.google_api_key:
                raise HTTPException(
                    status_code=500,
                    detail="유사도 필터링을 위한 Google API 키가 설정되지 않았습니다.",
                )
            embedding_service = GeminiEmbeddingService(
                api_key=filter_settings.google_api_key,
                model=filter_settings.gemini_embedding_model,
            )
            filtered = await filter_patents_by_similarity(
                query=word,
                results=search_result.results,
                embedding_service=embedding_service,
                min_similarity=min_similarity,
            )
            results_to_analyze = [f.result for f in filtered]
        else:
            results_to_analyze = search_result.results

        if not results_to_analyze:
            raise HTTPException(
                status_code=404,
                detail="필터링 후 분석할 특허가 없습니다. min_similarity를 낮춰보세요.",
            )

        patent_records = [
            PatentRecord(ipc=r.ipc_number, year=parse_year(r.application_date))
            for r in results_to_analyze
        ]
        sna_result = analyze_ipc_cooccurrence(
            patent_records,
            code_length=code_length,
            start_year=start_year,
            end_year=end_year,
            include_yearly=include_yearly,
        )

        return sna_result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("SNA 분석 중 오류 발생")
        raise HTTPException(status_code=500, detail="SNA 분석 중 오류가 발생했습니다")


@router.get("/patent/sna/ipc")
@limiter.limit("5/minute")
async def analyze_sna_ipc_search(
    ipc_number: str,
    request: Request,
    _auth: RequireAPIKey,
    code_length: int = 4,
    page_size: int = 500,
    patent: bool | None = None,
    utility: bool | None = None,
    start_year: int | None = None,
    end_year: int | None = None,
    include_yearly: bool = True,
    db: AsyncSession = Depends(get_db),
) -> SNAResult:
    """
    IPC 코드로 특허 검색 후 IPC 동시출현 네트워크 분석.

    Args:
        ipc_number: IPC 코드 (예: G06F3/041)
        code_length: IPC 코드 길이 (4: 서브클래스, 8: 메인그룹)
        page_size: 검색할 특허 수 (최대 500)
        patent: 특허 포함 여부
        utility: 실용신안 포함 여부
        start_year: 시작 출원연도
        end_year: 종료 출원연도
        include_yearly: 연도별 데이터 포함 여부

    Returns:
        nodes, edges, total_patents, year_range, yearly_data
    """
    settings = Settings()
    if not settings.kipris_service_key:
        raise HTTPException(
            status_code=500, detail="KIPRIS API 키가 설정되지 않았습니다."
        )

    if code_length not in (4, 8):
        raise HTTPException(
            status_code=400, detail="code_length는 4 또는 8이어야 합니다."
        )

    if page_size > 500:
        page_size = 500

    params = IPCSearchParams(
        ipcNumber=ipc_number,
        docsStart=1,
        docsCount=page_size,
        patent=patent,
        utility=utility,
        sortSpec="AD",
        descSort=True,
    )

    try:
        async with KIPRISClient(settings.kipris_service_key) as client:
            search_result = await client.search_by_ipc(params)

        if not search_result.results:
            raise HTTPException(status_code=404, detail="검색 결과가 없습니다.")

        kipris_data = [r.model_dump(by_alias=True) for r in search_result.results]
        await bulk_upsert_patents_from_kipris(db, kipris_data)
        await db.commit()

        patent_records = [
            PatentRecord(ipc=r.ipc_number, year=parse_year(r.application_date))
            for r in search_result.results
        ]
        sna_result = analyze_ipc_cooccurrence(
            patent_records,
            code_length=code_length,
            start_year=start_year,
            end_year=end_year,
            include_yearly=include_yearly,
        )

        return sna_result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("SNA 분석 중 오류 발생")
        raise HTTPException(status_code=500, detail="SNA 분석 중 오류가 발생했습니다")
