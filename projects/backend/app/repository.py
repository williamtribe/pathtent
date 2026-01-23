import re
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import JobGroup, Patent, PatentIPC, Search, SearchResult


async def create_search(
    session: AsyncSession,
    original_text: str,
    search_query: str,
) -> Search:
    """Create new Search (pending status)"""
    search = Search(
        original_text=original_text,
        search_query=search_query,
        status="pending",
    )
    session.add(search)
    await session.flush()
    return search


async def get_search(session: AsyncSession, search_id: UUID) -> Search | None:
    """Get single Search"""
    result = await session.execute(select(Search).where(Search.id == search_id))
    return result.scalar_one_or_none()


async def update_search_embedding(
    session: AsyncSession,
    search_id: UUID,
    embedding: list[float],
) -> None:
    """Store original document embedding (JSON format)"""
    await session.execute(
        update(Search)
        .where(Search.id == search_id)
        .values(original_embedding={"values": embedding, "dimension": len(embedding)})
    )


async def update_search_status(
    session: AsyncSession,
    search_id: UUID,
    status: str,
    error_message: str | None = None,
) -> None:
    """Update Search status"""
    values: dict[str, Any] = {"status": status}
    if error_message:
        values["error_message"] = error_message
    if status == "completed":
        values["completed_at"] = func.now()

    await session.execute(update(Search).where(Search.id == search_id).values(**values))


async def create_job_group(
    session: AsyncSession,
    search_id: UUID,
    total_jobs: int,
) -> JobGroup:
    """Create JobGroup - call before process_patent enqueue"""
    job_group = JobGroup(
        search_id=search_id,
        total_jobs=total_jobs,
        completed_jobs=0,
        failed_jobs=0,
    )
    session.add(job_group)
    await session.flush()
    return job_group


async def get_job_group(
    session: AsyncSession,
    search_id: UUID,
) -> JobGroup | None:
    """Get JobGroup"""
    result = await session.execute(select(JobGroup).where(JobGroup.search_id == search_id))
    return result.scalar_one_or_none()


async def increment_job_group(
    session: AsyncSession,
    search_id: UUID,
    failed: bool = False,
) -> bool:
    """
    Increment completed/failed count.
    Returns: True if all jobs are done (completed + failed >= total)
    """
    col = JobGroup.failed_jobs if failed else JobGroup.completed_jobs

    result = await session.execute(
        update(JobGroup)
        .where(JobGroup.search_id == search_id)
        .values({col: col + 1})
        .returning(
            JobGroup.total_jobs,
            JobGroup.completed_jobs,
            JobGroup.failed_jobs,
        )
    )
    row = result.fetchone()
    if row is None:
        return False
    return (row.completed_jobs + row.failed_jobs) >= row.total_jobs


async def create_search_result(
    session: AsyncSession,
    search_id: UUID,
    application_number: str,
    invention_title: str,
    claims_text: str,
    claims_source: str,
    pinecone_vector_id: str,
) -> SearchResult:
    """Create SearchResult"""
    result = SearchResult(
        search_id=search_id,
        application_number=application_number,
        invention_title=invention_title,
        claims_text=claims_text,
        claims_source=claims_source,
        pinecone_vector_id=pinecone_vector_id,
    )
    session.add(result)
    await session.flush()
    return result


async def update_result_similarity(
    session: AsyncSession,
    search_id: UUID,
    application_number: str,
    score: float,
) -> None:
    """Update similarity score"""
    await session.execute(
        update(SearchResult)
        .where(
            SearchResult.search_id == search_id,
            SearchResult.application_number == application_number,
        )
        .values(similarity_score=score)
    )


async def get_search_with_results(
    session: AsyncSession,
    search_id: UUID,
) -> Search | None:
    """Get Search + Results + JobGroup together (for API response)"""
    result = await session.execute(
        select(Search)
        .options(selectinload(Search.results), selectinload(Search.job_group))
        .where(Search.id == search_id)
    )
    return result.scalar_one_or_none()


# ============================================================
# KIPRIS: Patent Cache
# ============================================================
def _parse_ipc_codes(ipc_code: str) -> tuple[str, str | None]:
    """
    IPC 코드에서 4자리/8자리 코드 추출
    예: "A61B 6/00" -> ("A61B", "A61B0006")
    """
    ipc_code_4 = ipc_code[:4] if len(ipc_code) >= 4 else ipc_code
    ipc_code_8 = None

    match = re.match(r"([A-Z]\d{2}[A-Z])[\s-]?(\d+)", ipc_code)
    if match:
        section_class_subclass = match.group(1)
        group = match.group(2)
        ipc_code_8 = f"{section_class_subclass}{group.zfill(4)}"

    return ipc_code_4, ipc_code_8


def _parse_date(date_str: str | None) -> datetime | None:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y%m%d")
    except ValueError:
        return None


async def get_patent_by_application_number(
    session: AsyncSession,
    application_number: str,
) -> Patent | None:
    result = await session.execute(
        select(Patent)
        .options(selectinload(Patent.ipc_codes))
        .where(Patent.application_number == application_number)
    )
    return result.scalar_one_or_none()


async def get_patents_by_application_numbers(
    session: AsyncSession,
    application_numbers: list[str],
) -> list[Patent]:
    if not application_numbers:
        return []
    result = await session.execute(
        select(Patent)
        .options(selectinload(Patent.ipc_codes))
        .where(Patent.application_number.in_(application_numbers))
    )
    return list(result.scalars().all())


async def upsert_patent_from_kipris(
    session: AsyncSession,
    kipris_data: dict[str, Any],
) -> Patent:
    """
    KIPRIS API 응답 데이터로 Patent 생성 또는 업데이트
    kipris_data: FreeSearchResult 또는 IpcSearchResult의 dict 형태
    """
    app_num = kipris_data.get("applicationNumber", "")

    existing = await get_patent_by_application_number(session, app_num)

    if existing:
        existing.invention_title = kipris_data.get("inventionTitle", existing.invention_title)
        existing.invention_title_en = kipris_data.get("inventionTitleEn") or existing.invention_title_en
        existing.applicant_name = kipris_data.get("applicantName") or existing.applicant_name
        existing.application_date = _parse_date(kipris_data.get("applicationDate")) or existing.application_date
        existing.open_number = kipris_data.get("openNumber") or existing.open_number
        existing.open_date = _parse_date(kipris_data.get("openDate")) or existing.open_date
        existing.registration_number = kipris_data.get("registerNumber") or existing.registration_number
        existing.registration_date = _parse_date(kipris_data.get("registerDate")) or existing.registration_date
        existing.registration_status = kipris_data.get("registerStatus") or existing.registration_status
        existing.astrt_cont = kipris_data.get("astrtCont") or existing.astrt_cont
        existing.drawing = kipris_data.get("drawing") or existing.drawing
        existing.big_drawing = kipris_data.get("bigDrawing") or existing.big_drawing
        existing.kipris_doc_url = kipris_data.get("kiprisDocUrl") or existing.kipris_doc_url

        new_ipc_str = kipris_data.get("ipcNumber", "")
        if new_ipc_str:
            existing_ipc_codes = {ipc.ipc_code for ipc in existing.ipc_codes}
            for ipc in new_ipc_str.split("|"):
                ipc = ipc.strip()
                if ipc and ipc not in existing_ipc_codes:
                    ipc_4, ipc_8 = _parse_ipc_codes(ipc)
                    existing.ipc_codes.append(
                        PatentIPC(ipc_code=ipc, ipc_code_4=ipc_4, ipc_code_8=ipc_8)
                    )

        await session.flush()
        return existing

    patent = Patent(
        application_number=app_num,
        invention_title=kipris_data.get("inventionTitle", ""),
        invention_title_en=kipris_data.get("inventionTitleEn"),
        applicant_name=kipris_data.get("applicantName"),
        application_date=_parse_date(kipris_data.get("applicationDate")),
        open_number=kipris_data.get("openNumber"),
        open_date=_parse_date(kipris_data.get("openDate")),
        registration_number=kipris_data.get("registerNumber"),
        registration_date=_parse_date(kipris_data.get("registerDate")),
        registration_status=kipris_data.get("registerStatus"),
        astrt_cont=kipris_data.get("astrtCont"),
        drawing=kipris_data.get("drawing"),
        big_drawing=kipris_data.get("bigDrawing"),
        kipris_doc_url=kipris_data.get("kiprisDocUrl"),
    )

    ipc_str = kipris_data.get("ipcNumber", "")
    if ipc_str:
        for ipc in ipc_str.split("|"):
            ipc = ipc.strip()
            if ipc:
                ipc_4, ipc_8 = _parse_ipc_codes(ipc)
                patent.ipc_codes.append(
                    PatentIPC(ipc_code=ipc, ipc_code_4=ipc_4, ipc_code_8=ipc_8)
                )

    session.add(patent)
    await session.flush()
    return patent


async def bulk_upsert_patents_from_kipris(
    session: AsyncSession,
    kipris_data_list: list[dict[str, Any]],
) -> list[Patent]:
    patents = []
    for data in kipris_data_list:
        patent = await upsert_patent_from_kipris(session, data)
        patents.append(patent)
    return patents


async def search_patents_by_ipc(
    session: AsyncSession,
    ipc_code: str,
    code_length: int = 4,
    start_year: int | None = None,
    end_year: int | None = None,
    limit: int = 100,
) -> list[Patent]:
    """DB에서 IPC 코드로 특허 검색 (캐시된 데이터만)"""
    query = select(Patent).options(selectinload(Patent.ipc_codes)).join(PatentIPC)

    if code_length == 4:
        query = query.where(PatentIPC.ipc_code_4 == ipc_code[:4])
    else:
        query = query.where(PatentIPC.ipc_code_8.like(f"{ipc_code[:8]}%"))

    if start_year:
        query = query.where(func.extract("year", Patent.application_date) >= start_year)
    if end_year:
        query = query.where(func.extract("year", Patent.application_date) <= end_year)

    query = query.order_by(Patent.application_date.desc()).limit(limit)

    result = await session.execute(query)
    return list(result.scalars().unique().all())
