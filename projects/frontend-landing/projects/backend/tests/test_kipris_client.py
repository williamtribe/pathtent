from unittest.mock import AsyncMock, Mock

import pytest
from kipris.client import KIPRISClient
from kipris.models import PatentSearchResult, PDFInfo, SearchParams


def test_search_params_model__if_valid_data__returns_model() -> None:
    # given
    params_data = {
        "word": "센서",
        "inventionTitle": "바이오센서",
        "astrtCont": "과산화효소",
        "ipcNumber": "C01B 32/15",
        "applicationNumber": "1020240054471",
        "openNumber": "1020250155726",
        "applicationDate": "2024-04-24",
        "openDate": "2025-10-31",
        "applicant": "가천대학교 산학협력단",
        "patent": True,
        "utility": False,
        "lastvalue": "A",
        "pageNo": 1,
        "numOfRows": 30,
        "sortSpec": "PD",
        "descSort": True,
    }

    # when
    params = SearchParams(**params_data)  # type: ignore

    # then
    assert params.word == "센서"
    assert params.invention_title == "바이오센서"
    assert params.abstract_content == "과산화효소"
    assert params.ipc_number == "C01B 32/15"
    assert params.application_number == "1020240054471"
    assert params.open_number == "1020250155726"
    assert params.application_date == "2024-04-24"
    assert params.open_date == "2025-10-31"
    assert params.applicant == "가천대학교 산학협력단"
    assert params.patent is True
    assert params.utility is False
    assert params.last_value == "A"
    assert params.page_no == 1
    assert params.num_of_rows == 30
    assert params.sort_spec == "PD"
    assert params.desc_sort is True


def test_search_params_model__if_to_query_params__returns_dict_with_aliases() -> None:
    # given
    params = SearchParams(  # type: ignore[call-arg]
        word="센서",
        ipcNumber="C01B 32/15",
        patent=True,
        numOfRows=30,
    )

    # when
    query_params = params.model_dump(by_alias=True, exclude_none=True)

    # then
    assert query_params == {
        "word": "센서",
        "ipcNumber": "C01B 32/15",
        "patent": True,
        "numOfRows": 30,
    }
    assert "ipc_number" not in query_params
    assert "num_of_rows" not in query_params


def test_patent_search_result_model__if_valid_data__returns_model() -> None:
    # given
    result_data = {
        "indexNo": "1",
        "registerStatus": "공개",
        "inventionTitle": "과산화효소 관련 바이오센서",
        "ipcNumber": "C01B 32/15",
        "applicationNumber": "1020240054471",
        "applicationDate": "2024-04-24",
        "openNumber": "1020250155726",
        "openDate": "2025-10-31",
        "applicantName": "가천대학교 산학협력단",
    }

    # when
    result = PatentSearchResult(**result_data)

    # then
    assert result.index_no == "1"
    assert result.register_status == "공개"
    assert result.invention_title == "과산화효소 관련 바이오센서"
    assert result.ipc_number == "C01B 32/15"
    assert result.application_number == "1020240054471"
    assert result.application_date == "2024-04-24"
    assert result.open_number == "1020250155726"
    assert result.open_date == "2025-10-31"
    assert result.applicant_name == "가천대학교 산학협력단"


@pytest.mark.asyncio
async def test_kipris_client_search__if_valid_response__returns_list() -> None:
    # given
    xml_response = """<?xml version="1.0" encoding="UTF-8"?>
<response>
    <header>
        <resultCode>00</resultCode>
        <resultMsg>NORMAL SERVICE.</resultMsg>
    </header>
    <body>
        <items>
            <item>
                <indexNo>1</indexNo>
                <registerStatus>공개</registerStatus>
                <inventionTitle>과산화효소 관련 바이오센서</inventionTitle>
                <ipcNumber>C01B 32/15</ipcNumber>
                <applicationNumber>1020240054471</applicationNumber>
                <applicationDate>2024-04-24</applicationDate>
                <openNumber>1020250155726</openNumber>
                <openDate>2025-10-31</openDate>
                <applicantName>가천대학교 산학협력단</applicantName>
            </item>
            <item>
                <indexNo>2</indexNo>
                <registerStatus>공개</registerStatus>
                <inventionTitle>외장형 부분 방전 진단 센서</inventionTitle>
                <ipcNumber>G01R 31/12</ipcNumber>
                <applicationNumber>1020240083601</applicationNumber>
                <applicationDate>2024-06-26</applicationDate>
                <openNumber>1020260000821</openNumber>
                <openDate>2026-01-05</openDate>
                <applicantName>한국전력공사</applicantName>
            </item>
        </items>
    </body>
</response>"""

    mock_response = Mock()
    mock_response.text = xml_response
    mock_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response

    client = KIPRISClient("test-key")
    client._client = mock_client

    params = SearchParams(word="센서")  # type: ignore[call-arg]

    # when
    results = await client.search(params)

    # then
    assert isinstance(results, list)
    assert len(results) == 2
    assert isinstance(results[0], PatentSearchResult)
    assert results[0].index_no == "1"
    assert results[0].invention_title == "과산화효소 관련 바이오센서"
    assert results[0].applicant_name == "가천대학교 산학협력단"
    assert results[1].index_no == "2"
    assert results[1].invention_title == "외장형 부분 방전 진단 센서"
    assert results[1].applicant_name == "한국전력공사"


@pytest.mark.asyncio
async def test_kipris_client_search__if_empty_response__returns_empty_list() -> None:
    # given
    xml_response = """<?xml version="1.0" encoding="UTF-8"?>
<response>
    <header>
        <resultCode>00</resultCode>
        <resultMsg>NORMAL SERVICE.</resultMsg>
    </header>
    <body>
        <items></items>
    </body>
</response>"""

    mock_response = Mock()
    mock_response.text = xml_response
    mock_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response

    client = KIPRISClient("test-key")
    client._client = mock_client

    params = SearchParams(word="존재하지않는검색어")  # type: ignore[call-arg]

    # when
    results = await client.search(params)

    # then
    assert isinstance(results, list)
    assert len(results) == 0


@pytest.mark.asyncio
async def test_kipris_client_get_pdf_info__if_pdf_exists__returns_pdf_info() -> None:
    # given
    xml_response = """<?xml version="1.0" encoding="UTF-8"?>
<response>
    <header>
        <resultCode>00</resultCode>
        <resultMsg>NORMAL SERVICE.</resultMsg>
    </header>
    <body>
        <item>
            <docName>1020240054471.pdf</docName>
            <path>http://plus.kipris.or.kr/openapi/fileToss.jsp?arg=abc123</path>
        </item>
    </body>
</response>"""

    mock_response = Mock()
    mock_response.text = xml_response
    mock_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response

    client = KIPRISClient("test-key")
    client._client = mock_client

    application_number = "1020240054471"

    # when
    pdf_info = await client.get_publication_pdf_info(application_number)

    # then
    assert pdf_info is not None
    assert isinstance(pdf_info, PDFInfo)
    assert pdf_info.doc_name == "1020240054471.pdf"
    assert pdf_info.path == "http://plus.kipris.or.kr/openapi/fileToss.jsp?arg=abc123"


@pytest.mark.asyncio
async def test_kipris_client_get_pdf_info__if_no_pdf__returns_none() -> None:
    # given
    xml_response = """<?xml version="1.0" encoding="UTF-8"?>
<response>
    <header>
        <resultCode>00</resultCode>
        <resultMsg>NORMAL SERVICE.</resultMsg>
    </header>
    <body></body>
</response>"""

    mock_response = Mock()
    mock_response.text = xml_response
    mock_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response

    client = KIPRISClient("test-key")
    client._client = mock_client

    application_number = "1020999999999"

    # when
    pdf_info = await client.get_announcement_pdf_info(application_number)

    # then
    assert pdf_info is None
