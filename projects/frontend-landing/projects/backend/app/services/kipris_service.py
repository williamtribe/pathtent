import asyncio
from collections.abc import AsyncGenerator
from pathlib import Path
from tempfile import TemporaryDirectory

from kipris.client import KIPRISClient
from kipris.models import PatentSearchResult, SearchParams
from pydantic import BaseModel

from app.services.query_generator import KIPRISSearchQuery


class DownloadedPatent(BaseModel):
    """Downloaded patent PDF information"""

    application_number: str
    invention_title: str
    pdf_path: Path

    model_config = {"arbitrary_types_allowed": True}


class KIPRISService:
    """
    CRITICAL: No result limit - fetch ALL pages via pagination.

    Contract:
    - __init__(service_key: str) - Wraps KIPRISClient
    - search_all_pages(search_query: str) - String search term → yields all results
    - multi_search_all_pages(queries: list[KIPRISSearchQuery]) - Multiple queries → merged deduplicated results
    - download_patent_pdf(application_number: str) - String app number → DownloadedPatent | None
    """

    def __init__(self, service_key: str) -> None:
        """
        Initialize KIPRIS service.

        Args:
            service_key: KIPRIS API service key
        """
        self.client = KIPRISClient(service_key=service_key)
        self._semaphore = asyncio.Semaphore(5)  # Rate limit: max 5 concurrent
        self._temp_dir = TemporaryDirectory()  # PDF temporary storage
        self._download_dir = Path(self._temp_dir.name)

    async def multi_search_all_pages(
        self,
        queries: list[KIPRISSearchQuery],
    ) -> AsyncGenerator[PatentSearchResult]:
        """
        Run multiple KIPRIS searches in parallel and merge results.

        Deduplicates by application_number to avoid processing same patent twice.

        Args:
            queries: List of KIPRISSearchQuery objects from generate_search_queries()

        Yields:
            PatentSearchResult objects (deduplicated across all queries)
        """
        seen_application_numbers: set[str] = set()

        async def collect_results(query: KIPRISSearchQuery) -> list[PatentSearchResult]:
            """Collect all results for a single query."""
            results: list[PatentSearchResult] = []
            search_term = query.word
            if query.ipc_number:
                search_term = f"{query.word} {query.ipc_number}"

            async for result in self.search_all_pages(search_term):
                results.append(result)
            return results

        tasks = [collect_results(query) for query in queries]
        all_results = await asyncio.gather(*tasks)

        for query_results in all_results:
            for result in query_results:
                if result.application_number and result.application_number not in seen_application_numbers:
                    seen_application_numbers.add(result.application_number)
                    yield result

    async def search_all_pages(
        self,
        search_query: str,
    ) -> AsyncGenerator[PatentSearchResult]:
        """
        Fetch ALL search results via pagination. NO LIMIT.

        Args:
            search_query: Search term string (from Search.search_query)

        Yields:
            PatentSearchResult objects (all pages)
        """
        page = 1
        page_size = 100  # KIPRIS max per page

        while True:
            params = SearchParams(
                word=search_query,
                page_no=page,
                num_of_rows=page_size,
            )
            results = await self.client.search(params)

            if not results:
                break  # No more results

            for result in results:
                yield result

            if len(results) < page_size:
                break  # Last page

            page += 1

    async def download_patent_pdf(
        self,
        application_number: str,
    ) -> DownloadedPatent | None:
        """
        Download single patent PDF. Atomic operation - failure safe.

        Args:
            application_number: Patent application number (string)

        Returns:
            DownloadedPatent or None if failed/not found
        """
        async with self._semaphore:  # Rate limiting
            try:
                # Use get_announcement_pdf_info (registered patents only)
                pdf_info = await self.client.get_announcement_pdf_info(application_number)
                if not pdf_info:
                    return None  # No PDF available

                save_path = self._download_dir / f"{application_number}.pdf"
                await self.client.download_pdf(pdf_info.path, save_path)

                return DownloadedPatent(
                    application_number=application_number,
                    invention_title="",  # Not needed - title comes from search result
                    pdf_path=save_path,
                )
            except Exception:
                return None  # Fail gracefully - don't break other downloads
