"""Distributed job worker using pgqueuer.

Implements 3-stage pipeline:
1. search_patents: KIPRIS search -> enqueue process_patent jobs
2. process_patent: PDF download -> text extraction -> embedding -> VectorDB
3. similarity_analysis: Calculate similarity scores -> complete search
"""

import json
from typing import Any
from uuid import UUID

import asyncpg
from pgqueuer import PgQueuer
from pgqueuer.db import AsyncpgDriver
from pgqueuer.models import Context, Job
from pgqueuer.queries import Queries
from sqlalchemy import select

from app.config import Settings
from app.database import async_session_factory
from app.models import SearchResult
from app.repository import (
    create_job_group,
    create_search_result,
    get_job_group,
    get_search,
    increment_job_group,
    update_result_similarity,
    update_search_embedding,
    update_search_status,
)
from app.services.claims_parser import extract_claims
from app.services.embedding import GeminiEmbeddingService, truncate_to_token_limit
from app.services.kipris_service import KIPRISService
from app.services.pdf_extractor import PyMuPDFExtractor
from app.services.query_generator import generate_search_queries
from app.services.vector_db import VectorDBService, create_vector_db


async def create_pgqueuer() -> PgQueuer:
    settings = Settings()

    database_url = settings.database_url.replace("+asyncpg", "")
    conn = await asyncpg.connect(database_url)
    driver = AsyncpgDriver(conn)

    resources: dict[str, Any] = {
        "session_factory": async_session_factory,
        "driver": driver,
        "embedding_service": GeminiEmbeddingService(
            api_key=settings.google_api_key,
            model=settings.gemini_embedding_model,
        ),
        "kipris_service": KIPRISService(service_key=settings.kipris_service_key),
        "pdf_extractor": PyMuPDFExtractor(),
        "vector_db": create_vector_db(settings),
    }

    pgq = PgQueuer(driver, resources=resources)
    _register_entrypoints(pgq)

    return pgq


async def _enqueue_similarity(context: Context, search_id: UUID) -> None:
    driver = context.resources["driver"]
    queries = Queries(driver)
    await queries.enqueue(
        entrypoint="similarity_analysis",
        payload=json.dumps({"search_id": str(search_id)}).encode(),
    )


def _register_entrypoints(pgq: PgQueuer) -> None:
    @pgq.entrypoint("search_patents", accepts_context=True)
    async def search_patents(job: Job, context: Context) -> None:
        session_factory = context.resources["session_factory"]
        kipris: KIPRISService = context.resources["kipris_service"]
        embedding_svc: GeminiEmbeddingService = context.resources["embedding_service"]
        driver = context.resources["driver"]

        if not job.payload:
            return
        payload = json.loads(job.payload.decode())
        search_id = UUID(payload["search_id"])

        async with session_factory() as session:
            search = await get_search(session, search_id)
            if not search:
                return

            original_embedding = await embedding_svc.embed(truncate_to_token_limit(search.original_text))
            await update_search_embedding(session, search_id, original_embedding)

            # Generate multiple queries for broader coverage
            queries = await generate_search_queries(search.original_text)

            patents: list[dict[str, str]] = []
            async for patent in kipris.multi_search_all_pages(queries):
                if patent.application_number and patent.invention_title:
                    patents.append(
                        {
                            "search_id": str(search_id),
                            "application_number": patent.application_number,
                            "invention_title": patent.invention_title,
                        }
                    )

            if len(patents) == 0:
                await update_search_status(session, search_id, "completed")
                await session.commit()
                return

            await create_job_group(session, search_id, total_jobs=len(patents))
            await update_search_status(session, search_id, "processing")
            await session.commit()

        queries = Queries(driver)
        for patent_payload in patents:
            await queries.enqueue(
                entrypoint="process_patent",
                payload=json.dumps(patent_payload).encode(),
            )

    @pgq.entrypoint("process_patent", accepts_context=True)
    async def process_patent(job: Job, context: Context) -> None:
        session_factory = context.resources["session_factory"]
        kipris: KIPRISService = context.resources["kipris_service"]
        pdf_extractor: PyMuPDFExtractor = context.resources["pdf_extractor"]
        embedding_svc: GeminiEmbeddingService = context.resources["embedding_service"]
        vector_db: VectorDBService = context.resources["vector_db"]

        if not job.payload:
            return
        payload = json.loads(job.payload.decode())
        search_id = UUID(payload["search_id"])
        application_number = payload["application_number"]
        invention_title = payload["invention_title"]

        async with session_factory() as session:
            existing = await session.execute(
                select(SearchResult).where(
                    SearchResult.search_id == search_id,
                    SearchResult.application_number == application_number,
                )
            )
            if existing.scalar_one_or_none():
                all_done = await increment_job_group(session, search_id)
                await session.commit()
                if all_done:
                    await _enqueue_similarity(context, search_id)
                return

            try:
                downloaded = await kipris.download_patent_pdf(application_number)
                if not downloaded:
                    all_done = await increment_job_group(session, search_id, failed=True)
                    await session.commit()
                    if all_done:
                        await _enqueue_similarity(context, search_id)
                    return

                text = await pdf_extractor.extract_text(downloaded.pdf_path)

                claims_result = extract_claims(text)
                claims_text = truncate_to_token_limit(claims_result.text)

                embedding = await embedding_svc.embed(claims_text)

                vector_id = await vector_db.get_or_create(
                    search_id=str(search_id),
                    content=claims_text,
                    embedding=embedding,
                    metadata={
                        "search_id": str(search_id),
                        "app_no": application_number,
                    },
                )

                await create_search_result(
                    session,
                    search_id,
                    application_number,
                    invention_title,
                    claims_text,
                    claims_result.source,
                    vector_id,
                )

                all_done = await increment_job_group(session, search_id)
                await session.commit()

                if all_done:
                    await _enqueue_similarity(context, search_id)

            except Exception:
                all_done = await increment_job_group(session, search_id, failed=True)
                await session.commit()
                if all_done:
                    await _enqueue_similarity(context, search_id)
                raise

    @pgq.entrypoint("similarity_analysis", accepts_context=True)
    async def similarity_analysis(job: Job, context: Context) -> None:
        session_factory = context.resources["session_factory"]
        vector_db: VectorDBService = context.resources["vector_db"]

        if not job.payload:
            return
        payload = json.loads(job.payload.decode())
        search_id = UUID(payload["search_id"])

        async with session_factory() as session:
            search = await get_search(session, search_id)
            if not search or not search.original_embedding:
                await update_search_status(session, search_id, "failed", "No embedding")
                await session.commit()
                return

            embedding_values = search.original_embedding.get("values", [])

            similar = await vector_db.query_similar(
                embedding=embedding_values,
                search_id=str(search_id),
                min_score=0.7,
            )

            for match in similar:
                await update_result_similarity(
                    session,
                    search_id,
                    match["metadata"]["app_no"],
                    match["score"],
                )

            job_group = await get_job_group(session, search_id)
            if job_group and job_group.completed_jobs == 0:
                await update_search_status(session, search_id, "failed", "All patents failed")
            else:
                await update_search_status(session, search_id, "completed")

            await session.commit()
