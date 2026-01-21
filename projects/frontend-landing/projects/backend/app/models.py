from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


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
