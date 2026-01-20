from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.services.query_generator import (
    KIPRISMultiQuery,
    KIPRISSearchQuery,
    generate_search_queries,
    generate_search_query,
)

pytestmark = [pytest.mark.asyncio]


async def test_generate_search_queries__if_battery_patent__returns_multiple_queries() -> None:
    # given
    mock_queries = [
        KIPRISSearchQuery(word="리튬이온 배터리", ipc_number="H01M", perspective="core"),
        KIPRISSearchQuery(word="배터리 양극재", ipc_number=None, perspective="method"),
        KIPRISSearchQuery(word="에너지 저장", ipc_number=None, perspective="domain"),
    ]
    mock_output = KIPRISMultiQuery(queries=mock_queries)
    mock_agent_instance = MagicMock()
    mock_result = MagicMock()
    mock_result.output = mock_output
    mock_agent_instance.run = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.query_generator.multi_query_agent",
        return_value=mock_agent_instance,
    ):
        # when
        result = await generate_search_queries("배터리 관련 기술...")

        # then
        assert len(result) == 3
        assert result[0].word == "리튬이온 배터리"
        assert result[0].ipc_number == "H01M"
        mock_agent_instance.run.assert_called_once()


async def test_generate_search_queries__if_nft_patent__returns_diverse_perspectives() -> None:
    # given
    mock_queries = [
        KIPRISSearchQuery(word="NFT 환불", ipc_number=None, perspective="core"),
        KIPRISSearchQuery(word="블록체인 거래", ipc_number="G06Q", perspective="domain"),
        KIPRISSearchQuery(word="스마트계약", ipc_number=None, perspective="method"),
        KIPRISSearchQuery(word="디지털자산 소유권", ipc_number=None, perspective="application"),
    ]
    mock_output = KIPRISMultiQuery(queries=mock_queries)
    mock_agent_instance = MagicMock()
    mock_result = MagicMock()
    mock_result.output = mock_output
    mock_agent_instance.run = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.query_generator.multi_query_agent",
        return_value=mock_agent_instance,
    ):
        # when
        result = await generate_search_queries("NFT의 환불을 위해 스마트계약을 사용하여 소유권을 번복하는 방법")

        # then
        assert len(result) == 4
        perspectives = {q.perspective for q in result}
        assert "core" in perspectives
        assert "domain" in perspectives


async def test_generate_search_queries__if_valid_input__returns_at_least_3_queries() -> None:
    # given
    mock_queries = [
        KIPRISSearchQuery(word="자율주행", ipc_number="B60W", perspective="core"),
        KIPRISSearchQuery(word="라이다 센서", ipc_number="G01S", perspective="method"),
        KIPRISSearchQuery(word="객체 인식", ipc_number="G06V", perspective="application"),
    ]
    mock_output = KIPRISMultiQuery(queries=mock_queries)
    mock_agent_instance = MagicMock()
    mock_result = MagicMock()
    mock_result.output = mock_output
    mock_agent_instance.run = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.query_generator.multi_query_agent",
        return_value=mock_agent_instance,
    ):
        # when
        result = await generate_search_queries("자율주행 차량의 라이다 센서를 이용한 보행자 인식 알고리즘")

        # then
        assert len(result) >= 3


async def test_generate_search_query__if_called__returns_first_query() -> None:
    # given
    mock_queries = [
        KIPRISSearchQuery(word="인공지능 학습", ipc_number=None, perspective="core"),
        KIPRISSearchQuery(word="머신러닝", ipc_number="G06N", perspective="domain"),
        KIPRISSearchQuery(word="신경망", ipc_number=None, perspective="method"),
    ]
    mock_output = KIPRISMultiQuery(queries=mock_queries)
    mock_agent_instance = MagicMock()
    mock_result = MagicMock()
    mock_result.output = mock_output
    mock_agent_instance.run = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.query_generator.multi_query_agent",
        return_value=mock_agent_instance,
    ):
        # when
        result = await generate_search_query("인공지능 기반 학습 알고리즘...")

        # then
        assert result.word == "인공지능 학습"
        assert result.perspective == "core"


async def test_generate_search_query__if_empty_result__returns_empty_query() -> None:
    # given
    mock_output = KIPRISMultiQuery(queries=[])
    mock_agent_instance = MagicMock()
    mock_result = MagicMock()
    mock_result.output = mock_output
    mock_agent_instance.run = AsyncMock(return_value=mock_result)

    with patch(
        "app.services.query_generator.multi_query_agent",
        return_value=mock_agent_instance,
    ):
        # when
        result = await generate_search_query("some text")

        # then
        assert result.word == ""
        assert result.ipc_number is None
