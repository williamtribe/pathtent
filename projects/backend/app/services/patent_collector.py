"""Patent collection service for gathering patents from KIPRIS."""

import asyncio

from kipris.client import KIPRISClient
from kipris.models import FreeSearchParams

from app.config import Settings
from app.schemas.collection import CollectRequest, CollectResponse, PatentItem


class PatentCollector:
    """
    Service for collecting patents from KIPRIS using search formulas.

    Uses the free_search API which supports complex search expressions.
    Handles pagination automatically up to max_results limit.
    """

    def __init__(self, service_key: str | None = None) -> None:
        """
        Initialize patent collector.

        Args:
            service_key: KIPRIS API key. If None, loads from Settings.
        """
        settings = Settings()
        self._service_key = service_key or settings.kipris_service_key
        if not self._service_key:
            raise ValueError("KIPRIS service key is required")
        self._semaphore = asyncio.Semaphore(5)  # Rate limit: max 5 concurrent

    async def collect(self, request: CollectRequest) -> CollectResponse:
        """
        Collect patents matching the search formula.

        Args:
            request: CollectRequest with formula and max_results

        Returns:
            CollectResponse with collected patents and metadata
        """
        patents: list[PatentItem] = []
        total_count = 0
        docs_start = 1
        page_size = 500  # KIPRIS free_search max per page

        async with KIPRISClient(self._service_key) as client:
            while len(patents) < request.max_results:
                async with self._semaphore:
                    params = FreeSearchParams(
                        word=request.formula,
                        docs_start=docs_start,
                        docs_count=page_size,
                        patent=True,
                        utility=True,
                    )

                    response = await client.free_search(params)

                    if docs_start == 1:
                        total_count = response.total_count

                    if not response.results:
                        break

                    for result in response.results:
                        if len(patents) >= request.max_results:
                            break

                        # Extract IPC codes (may be semicolon-separated)
                        ipc_codes: list[str] = []
                        if result.ipc_number:
                            ipc_codes = [
                                code.strip()
                                for code in result.ipc_number.split(";")
                                if code.strip()
                            ]

                        patent_item = PatentItem(
                            application_number=result.application_number or "",
                            title=result.invention_name or "",
                            abstract=result.abstract,
                            ipc_codes=ipc_codes,
                            applicant=result.applicant,
                            application_date=result.application_date,
                            publication_number=result.public_number,
                            register_number=result.registration_number,
                        )
                        patents.append(patent_item)

                    if len(response.results) < page_size:
                        break  # Last page

                    docs_start += page_size

        return CollectResponse(
            patents=patents,
            total=total_count,
            collected=len(patents),
            formula=request.formula,
        )


async def collect_patents(
    request: CollectRequest,
    service_key: str | None = None,
) -> CollectResponse:
    """
    Convenience function for collecting patents.

    Args:
        request: CollectRequest with formula and max_results
        service_key: Optional KIPRIS API key (uses Settings if not provided)

    Returns:
        CollectResponse with collected patents
    """
    collector = PatentCollector(service_key)
    return await collector.collect(request)
