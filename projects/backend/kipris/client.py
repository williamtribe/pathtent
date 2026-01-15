import xml.etree.ElementTree as ET
from types import TracebackType
from typing import Self

import httpx

from kipris.models import PatentSearchResult, SearchParams


class KIPRISClient:
    def __init__(self, service_key: str) -> None:
        self._service_key = service_key
        self._base_url = "http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice"
        self._client = httpx.AsyncClient()

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
