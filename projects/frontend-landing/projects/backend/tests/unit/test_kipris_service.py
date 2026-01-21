import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.services.kipris_service import KIPRISService
from kipris.models import PatentSearchResult, PDFInfo


@pytest.mark.asyncio
async def test_search_all_pages__if_multiple_pages__yields_all_results_via_pagination(
    mock_kipris_client: MagicMock,
) -> None:
    # given
    page1_results = [
        PatentSearchResult(
            applicationNumber=f"APP{i}",
            inventionTitle=f"Title{i}",
        )
        for i in range(100)
    ]
    page2_results = [
        PatentSearchResult(
            applicationNumber=f"APP{i}",
            inventionTitle=f"Title{i}",
        )
        for i in range(100, 150)
    ]

    mock_kipris_client.search = AsyncMock(side_effect=[page1_results, page2_results])
    service = KIPRISService(service_key="fake")

    # when
    results = []
    async for result in service.search_all_pages("test query"):
        results.append(result)

    # then
    assert len(results) == 150
    assert mock_kipris_client.search.call_count == 2


@pytest.mark.asyncio
async def test_search_all_pages__if_empty_results__stops_immediately(
    mock_kipris_client: MagicMock,
) -> None:
    # given
    mock_kipris_client.search = AsyncMock(return_value=[])
    service = KIPRISService(service_key="fake")

    # when
    results = []
    async for result in service.search_all_pages("test query"):
        results.append(result)

    # then
    assert len(results) == 0
    assert mock_kipris_client.search.call_count == 1


@pytest.mark.asyncio
async def test_search_all_pages__if_single_page__stops_after_first_page(
    mock_kipris_client: MagicMock,
) -> None:
    # given
    page1_results = [
        PatentSearchResult(
            applicationNumber=f"APP{i}",
            inventionTitle=f"Title{i}",
        )
        for i in range(50)
    ]

    mock_kipris_client.search = AsyncMock(return_value=page1_results)
    service = KIPRISService(service_key="fake")

    # when
    results = []
    async for result in service.search_all_pages("test query"):
        results.append(result)

    # then
    assert len(results) == 50
    assert mock_kipris_client.search.call_count == 1


@pytest.mark.asyncio
async def test_download_patent_pdf__if_pdf_available__uses_announcement_endpoint(
    mock_kipris_client: MagicMock,
) -> None:
    # given
    mock_pdf_info = PDFInfo(docName="test.pdf", path="http://example.com/test.pdf")
    mock_kipris_client.get_announcement_pdf_info = AsyncMock(return_value=mock_pdf_info)
    mock_kipris_client.download_pdf = AsyncMock(return_value=Path("/tmp/test.pdf"))

    service = KIPRISService(service_key="fake")

    # when
    result = await service.download_patent_pdf("APP123")

    # then
    assert result is not None
    assert result.application_number == "APP123"
    assert mock_kipris_client.get_announcement_pdf_info.call_count == 1
    assert mock_kipris_client.download_pdf.call_count == 1


@pytest.mark.asyncio
async def test_download_patent_pdf__if_pdf_not_found__returns_none(
    mock_kipris_client: MagicMock,
) -> None:
    # given
    mock_kipris_client.get_announcement_pdf_info = AsyncMock(return_value=None)
    service = KIPRISService(service_key="fake")

    # when
    result = await service.download_patent_pdf("APP123")

    # then
    assert result is None
    assert mock_kipris_client.get_announcement_pdf_info.call_count == 1


@pytest.mark.asyncio
async def test_download_patent_pdf__if_download_fails__returns_none(
    mock_kipris_client: MagicMock,
) -> None:
    # given
    mock_kipris_client.get_announcement_pdf_info = AsyncMock(side_effect=Exception("Network error"))
    service = KIPRISService(service_key="fake")

    # when
    result = await service.download_patent_pdf("APP123")

    # then
    assert result is None


@pytest.mark.asyncio
async def test_download_patent_pdf__if_rate_limiting__max_5_concurrent(
    mock_kipris_client: MagicMock,
) -> None:
    # given
    concurrent_count = 0
    max_concurrent = 0

    async def mock_get_pdf_info(application_number: str) -> PDFInfo:
        nonlocal concurrent_count, max_concurrent
        concurrent_count += 1
        max_concurrent = max(max_concurrent, concurrent_count)
        await asyncio.sleep(0.1)  # Simulate network delay
        concurrent_count -= 1
        return PDFInfo(
            docName=f"{application_number}.pdf",
            path=f"http://example.com/{application_number}.pdf",
        )

    mock_kipris_client.get_announcement_pdf_info = mock_get_pdf_info
    mock_kipris_client.download_pdf = AsyncMock(return_value=Path("/tmp/test.pdf"))

    service = KIPRISService(service_key="fake")

    # when
    tasks = [service.download_patent_pdf(f"APP{i}") for i in range(10)]
    await asyncio.gather(*tasks)

    # then
    assert max_concurrent <= 5


# Fixtures at the bottom
@pytest.fixture
def mock_kipris_client() -> MagicMock:
    """Mock KIPRISClient"""
    with patch("app.services.kipris_service.KIPRISClient") as mock_client_class:
        mock_instance = MagicMock()
        mock_client_class.return_value = mock_instance
        yield mock_instance
