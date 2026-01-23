from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, Date, ForeignKey, Index, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ============================================================
# KIPRIS: Patent Cache
# ============================================================
class Patent(Base):
    """KIPRIS 특허 데이터 캐시"""

    __tablename__ = "patents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    application_number: Mapped[str] = mapped_column(unique=True, index=True)  # 출원번호 (PK 역할)
    invention_title: Mapped[str] = mapped_column(Text)  # 발명의 명칭
    invention_title_en: Mapped[str | None] = mapped_column(Text, nullable=True)  # 영문 명칭
    applicant_name: Mapped[str | None] = mapped_column(nullable=True)  # 출원인
    application_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)  # 출원일
    open_number: Mapped[str | None] = mapped_column(nullable=True)  # 공개번호
    open_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)  # 공개일
    registration_number: Mapped[str | None] = mapped_column(nullable=True)  # 등록번호
    registration_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)  # 등록일
    registration_status: Mapped[str | None] = mapped_column(nullable=True)  # 등록상태
    astrt_cont: Mapped[str | None] = mapped_column(Text, nullable=True)  # 초록
    drawing: Mapped[str | None] = mapped_column(nullable=True)  # 도면 URL
    big_drawing: Mapped[str | None] = mapped_column(nullable=True)  # 대표도면 URL
    kipris_doc_url: Mapped[str | None] = mapped_column(nullable=True)  # KIPRIS 문서 URL

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    # Relationships
    ipc_codes: Mapped[list["PatentIPC"]] = relationship(back_populates="patent", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_patents_application_date", "application_date"),)


class PatentIPC(Base):
    """특허별 IPC 코드 (다대다)"""

    __tablename__ = "patent_ipc_codes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    patent_id: Mapped[UUID] = mapped_column(ForeignKey("patents.id", ondelete="CASCADE"))
    ipc_code: Mapped[str] = mapped_column(index=True)  # 전체 IPC 코드 (예: A61B 6/00)
    ipc_code_4: Mapped[str] = mapped_column(index=True)  # 4자리 코드 (예: A61B)
    ipc_code_8: Mapped[str | None] = mapped_column(index=True, nullable=True)  # 8자리 코드 (예: A61B0006)

    patent: Mapped["Patent"] = relationship(back_populates="ipc_codes")

    __table_args__ = (
        UniqueConstraint("patent_id", "ipc_code", name="uq_patent_ipc"),
        Index("ix_patent_ipc_code_4", "ipc_code_4"),
        Index("ix_patent_ipc_code_8", "ipc_code_8"),
    )


# ============================================================
# CORE: Search Request
# ============================================================
class Search(Base):
    __tablename__ = "searches"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    original_text: Mapped[str] = mapped_column(Text)
    original_embedding: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    search_query: Mapped[str]
    status: Mapped[str] = mapped_column(default="pending")
    error_message: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationships
    results: Mapped[list["SearchResult"]] = relationship(back_populates="search")
    job_group: Mapped["JobGroup | None"] = relationship(back_populates="search", uselist=False)


# ============================================================
# JOB GROUP: PatentJob completion tracking
# ============================================================
class JobGroup(Base):
    """Track completion status of pgqueuer Jobs"""

    __tablename__ = "job_groups"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    search_id: Mapped[UUID] = mapped_column(ForeignKey("searches.id"), unique=True)
    total_jobs: Mapped[int] = mapped_column(default=0)
    completed_jobs: Mapped[int] = mapped_column(default=0)
    failed_jobs: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    search: Mapped["Search"] = relationship(back_populates="job_group")


# ============================================================
# RESULT: Processed patent results
# ============================================================
class SearchResult(Base):
    __tablename__ = "search_results"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    search_id: Mapped[UUID] = mapped_column(ForeignKey("searches.id"))
    application_number: Mapped[str]
    invention_title: Mapped[str]
    claims_text: Mapped[str] = mapped_column(Text)
    claims_source: Mapped[str]  # "claims" | "full_doc"
    pinecone_vector_id: Mapped[str]
    similarity_score: Mapped[float | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    search: Mapped["Search"] = relationship(back_populates="results")

    # UNIQUE constraint: prevent duplicate processing (idempotency)
    __table_args__ = (UniqueConstraint("search_id", "application_number", name="uq_search_result"),)
