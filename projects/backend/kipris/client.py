import xml.etree.ElementTree as ET
from pathlib import Path
from types import TracebackType
from typing import Self

import httpx

from kipris.models import PatentSearchResult, PDFInfo, SearchParams


class KIPRISClient:
    def __init__(self, service_key: str, timeout: float = 30.0) -> None:
        self._service_key = service_key
        self._base_url = "http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice"
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(timeout, connect=10.0))

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self._client.aclose()

    async def search(self, params: SearchParams) -> list[PatentSearchResult]:
        query_params = params.model_dump(by_alias=True, exclude_none=True)
        query_params["ServiceKey"] = self._service_key

        url = f"{self._base_url}/getAdvancedSearch"
        response = await self._client.get(url, params=query_params)
        response.raise_for_status()

        root = ET.fromstring(response.text)
        items = root.findall(".//item")

        if not items:
            return []

        results = []
        for item in items:
            data = {}
            for field in item:
                data[field.tag] = field.text

            result = PatentSearchResult(**data)
            results.append(result)

        return results

    async def get_publication_pdf_info(self, application_number: str) -> PDFInfo | None:
        query_params = {
            "applicationNumber": application_number,
            "ServiceKey": self._service_key,
        }

        url = f"{self._base_url}/getPubFullTextInfoSearch"
        response = await self._client.get(url, params=query_params)
        response.raise_for_status()

        root = ET.fromstring(response.text)
        item = root.find(".//item")

        if item is None:
            return None

        doc_name = item.findtext("docName")
        path = item.findtext("path")

        if not doc_name or not path:
            return None

        return PDFInfo(docName=doc_name, path=path)

    async def download_pdf(self, pdf_path: str, save_path: Path) -> Path:
        async with self._client.stream("GET", pdf_path) as response:
            response.raise_for_status()

            save_path.parent.mkdir(parents=True, exist_ok=True)

            with save_path.open("wb") as f:
                async for chunk in response.aiter_bytes():
                    f.write(chunk)

        return save_path

    async def get_announcement_pdf_info(self, application_number: str) -> PDFInfo | None:
        query_params = {
            "applicationNumber": application_number,
            "ServiceKey": self._service_key,
        }

        url = f"{self._base_url}/getAnnFullTextInfoSearch"
        response = await self._client.get(url, params=query_params)
        response.raise_for_status()

        root = ET.fromstring(response.text)
        item = root.find(".//item")

        if item is None:
            return None

        doc_name = item.findtext("docName")
        path = item.findtext("path")

        if not doc_name or not path:
            return None

        return PDFInfo(docName=doc_name, path=path)
