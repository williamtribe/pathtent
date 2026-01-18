import asyncio
import random
import xml.etree.ElementTree as ET
from pathlib import Path
from types import TracebackType
from typing import Self
from urllib.parse import urlparse

import httpx

from kipris.models import PatentSearchResult, PDFInfo, SearchParams
from kipris.pdf import ANNOUNCEMENT_PDF_ENDPOINT, PUBLICATION_PDF_ENDPOINT, build_pdf_query, parse_pdf_info
from kipris.search import SEARCH_ENDPOINT, build_search_query, parse_search_results


class KIPRISAPIError(RuntimeError):
    def __init__(self, result_code: str, result_msg: str | None) -> None:
        message = result_msg or "Unknown KIPRIS API error"
        super().__init__(f"{result_code}: {message}")
        self.result_code = result_code
        self.result_msg = result_msg


class KIPRISResponseParseError(RuntimeError):
    def __init__(self, status_code: int, url: str, snippet: str) -> None:
        message = f"Invalid XML response (HTTP {status_code}) from {url}: {snippet}"
        super().__init__(message)
        self.status_code = status_code
        self.url = url
        self.snippet = snippet


class KIPRISClient:
    _retry_status_codes = {429, 500, 502, 503, 504}

    def __init__(
        self,
        service_key: str,
        *,
        base_url: str | None = None,
        pdf_base_url: str | None = None,
        pdf_service_key: str | None = None,
        search_prefix: str = "/openapi/rest/patUtiModInfoSearchSevice",
        pdf_prefix: str = "/kipo-api/kipi/patUtiModInfoSearchSevice",
        debug: bool = False,
        timeout: float | None = 10.0,
        max_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        self._service_key = service_key
        self._pdf_service_key = pdf_service_key or service_key
        self._debug = debug
        if base_url:
            parsed = urlparse(base_url)
            if parsed.scheme and parsed.netloc:
                root = f"{parsed.scheme}://{parsed.netloc}"
            else:
                root = base_url.rstrip("/")
            self._base_urls = [root]
        else:
            self._base_urls = ["https://plus.kipris.or.kr"]
        self._search_prefix = search_prefix
        self._pdf_prefix = pdf_prefix

        if pdf_base_url:
            parsed_pdf = urlparse(pdf_base_url)
            if parsed_pdf.scheme and parsed_pdf.netloc:
                pdf_root = f"{parsed_pdf.scheme}://{parsed_pdf.netloc}"
            else:
                pdf_root = pdf_base_url.rstrip("/")
            self._pdf_base_urls = [pdf_root]
        else:
            self._pdf_base_urls = self._base_urls
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout) if timeout is not None else None,
            follow_redirects=True,
        )
        self._max_retries = max(0, max_retries)
        self._backoff_factor = max(0.0, backoff_factor)

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self._client.aclose()

    async def _sleep_before_retry(self, attempt: int, response: httpx.Response | None) -> None:
        retry_after = None
        if response is not None:
            header = response.headers.get("Retry-After")
            if header and header.isdigit():
                retry_after = int(header)

        if retry_after is None:
            jitter = random.uniform(0.0, 0.1)
            retry_after = self._backoff_factor * (2**attempt) + jitter

        await asyncio.sleep(retry_after)

    async def _request(self, method: str, url: str, **kwargs: object) -> httpx.Response:
        response = None
        for attempt in range(self._max_retries + 1):
            try:
                if self._debug:
                    params = kwargs.get("params")
                    if isinstance(params, dict):
                        params = self._mask_keys(params)
                    print(f"[KIPRIS] {method} {url} params={params}")
                response = await self._client.request(method, url, **kwargs)
            except httpx.RequestError:
                if attempt >= self._max_retries:
                    raise
                await self._sleep_before_retry(attempt, None)
                continue

            if (
                response.status_code in self._retry_status_codes
                and attempt < self._max_retries
            ):
                await self._sleep_before_retry(attempt, response)
                continue

            return response

        assert response is not None
        return response

    def _mask_keys(self, params: dict[str, object]) -> dict[str, object]:
        masked: dict[str, object] = {}
        for key, value in params.items():
            if key.lower().endswith("key") and isinstance(value, str):
                masked[key] = f"{value[:4]}***{value[-4:]}" if len(value) > 8 else "***"
            else:
                masked[key] = value
        return masked

    async def _request_with_failover(
        self,
        method: str,
        prefix: str,
        endpoint: str,
        base_urls: list[str],
        **kwargs: object,
    ) -> httpx.Response:
        last_response = None
        for index, base_url in enumerate(base_urls):
            base = base_url.rstrip("/")
            path = f"{prefix.rstrip('/')}/{endpoint.lstrip('/')}" if prefix else endpoint
            url = f"{base}/{path.lstrip('/')}"
            response = await self._request(method, url, **kwargs)
            last_response = response

            should_failover = response.status_code in self._retry_status_codes
            is_last = index >= len(base_urls) - 1
            if should_failover and not is_last:
                continue

            return response

        assert last_response is not None
        return last_response

    def _parse_xml(self, response: httpx.Response) -> ET.Element:
        try:
            return ET.fromstring(response.text)
        except ET.ParseError as exc:
            snippet = response.text.strip().replace("\n", " ")[:200]
            raise KIPRISResponseParseError(
                response.status_code,
                str(response.request.url),
                snippet or "<empty response>",
            ) from exc

    def _raise_for_api_error(self, root: ET.Element) -> None:
        header = root.find(".//header")
        if header is None:
            return

        result_code = header.findtext("resultCode")
        result_msg = header.findtext("resultMsg")
        if result_code and result_code != "00":
            raise KIPRISAPIError(result_code, result_msg)

    async def search(self, params: SearchParams) -> list[PatentSearchResult]:
        query_params = build_search_query(params, self._service_key)

        response = await self._request_with_failover(
            "GET",
            self._search_prefix,
            SEARCH_ENDPOINT,
            self._base_urls,
            params=query_params,
        )
        response.raise_for_status()

        root = self._parse_xml(response)
        self._raise_for_api_error(root)
        return parse_search_results(root)

    async def _get_pdf_info(
        self,
        endpoint: str,
        application_number: str,
        key_param: str,
    ) -> PDFInfo | None:
        query_params = build_pdf_query(application_number, self._pdf_service_key, key_param)

        response = await self._request_with_failover(
            "GET",
            self._pdf_prefix,
            endpoint,
            self._pdf_base_urls,
            params=query_params,
        )
        response.raise_for_status()

        root = self._parse_xml(response)
        self._raise_for_api_error(root)
        return parse_pdf_info(root)

    async def get_publication_pdf_info(self, application_number: str) -> PDFInfo | None:
        try:
            return await self._get_pdf_info(
                PUBLICATION_PDF_ENDPOINT,
                application_number,
                "ServiceKey",
            )
        except KIPRISAPIError as exc:
            if exc.result_code.strip() != "10":
                raise
            return await self._get_pdf_info(
                PUBLICATION_PDF_ENDPOINT,
                application_number,
                "accessKey",
            )

    async def download_pdf(self, pdf_path: str, save_path: Path) -> Path:
        async with self._client.stream("GET", pdf_path) as response:
            response.raise_for_status()

            save_path.parent.mkdir(parents=True, exist_ok=True)

            with save_path.open("wb") as f:
                async for chunk in response.aiter_bytes():
                    f.write(chunk)

        return save_path

    async def get_announcement_pdf_info(self, application_number: str) -> PDFInfo | None:
        try:
            return await self._get_pdf_info(
                ANNOUNCEMENT_PDF_ENDPOINT,
                application_number,
                "ServiceKey",
            )
        except KIPRISAPIError as exc:
            if exc.result_code.strip() != "10":
                raise
            return await self._get_pdf_info(
                ANNOUNCEMENT_PDF_ENDPOINT,
                application_number,
                "accessKey",
            )
