import hashlib
from collections.abc import Iterator
from unittest.mock import MagicMock, patch

import pytest
from app.services.pinecone_service import PineconeService


@pytest.mark.asyncio
async def test_pinecone_service__if_generate_vector_id__includes_search_id_in_hash(
    mock_pinecone: MagicMock,
) -> None:
    # given
    service = PineconeService(api_key="fake", index_name="test")
    search_id = "search-123"
    content = "test content"

    # when
    vector_id = service.generate_vector_id(search_id, content)

    # then
    expected_hash = hashlib.sha256(f"{search_id}:{content}".encode()).hexdigest()[:32]
    assert vector_id == expected_hash
    assert len(vector_id) == 32


@pytest.mark.asyncio
async def test_pinecone_service__if_get_or_create_new__upserts_vector(
    mock_pinecone: MagicMock,
) -> None:
    # given
    mock_pinecone.fetch.return_value = MagicMock(vectors={})  # Empty - vector doesn't exist
    service = PineconeService(api_key="fake", index_name="test")

    # when
    vector_id = await service.get_or_create(
        search_id="search-123",
        content="test content",
        embedding=[0.1] * 768,
        metadata={"key": "value"},
    )

    # then
    assert vector_id is not None
    assert len(vector_id) == 32  # SHA256 truncated
    mock_pinecone.upsert.assert_called_once()
    # Verify upsert was called with correct format: [(id, values, metadata)]
    call_args = mock_pinecone.upsert.call_args[0][0]
    assert len(call_args) == 1
    assert call_args[0][0] == vector_id
    assert call_args[0][1] == [0.1] * 768
    assert call_args[0][2] == {"key": "value"}


@pytest.mark.asyncio
async def test_pinecone_service__if_get_or_create_existing__skips_upsert(
    mock_pinecone: MagicMock,
) -> None:
    # given
    service = PineconeService(api_key="fake", index_name="test")
    vector_id = service.generate_vector_id("search-123", "test content")

    # Mock existing vector
    mock_pinecone.fetch.return_value = MagicMock(vectors={vector_id: {"id": vector_id, "values": [0.1] * 768}})

    # when
    returned_id = await service.get_or_create(
        search_id="search-123",
        content="test content",
        embedding=[0.1] * 768,
        metadata={"key": "value"},
    )

    # then
    assert returned_id == vector_id
    mock_pinecone.upsert.assert_not_called()


@pytest.mark.asyncio
async def test_pinecone_service__if_query_similar__filters_by_search_id_and_score(
    mock_pinecone: MagicMock,
) -> None:
    # given
    service = PineconeService(api_key="fake", index_name="test")

    # Mock query results with mixed scores
    mock_match_high = MagicMock(id="vec1", score=0.85, metadata={"app_no": "123"})
    mock_match_medium = MagicMock(id="vec2", score=0.75, metadata={"app_no": "456"})
    mock_match_low = MagicMock(id="vec3", score=0.65, metadata={"app_no": "789"})

    mock_pinecone.query.return_value = MagicMock(matches=[mock_match_high, mock_match_medium, mock_match_low])

    # when
    results = await service.query_similar(embedding=[0.1] * 768, search_id="search-123", top_k=100, min_score=0.7)

    # then
    # Should filter out low score (0.65 < 0.7)
    assert len(results) == 2
    assert results[0]["id"] == "vec1"
    assert results[0]["score"] == 0.85
    assert results[0]["metadata"] == {"app_no": "123"}
    assert results[1]["id"] == "vec2"
    assert results[1]["score"] == 0.75

    # Verify query was called with correct filter
    mock_pinecone.query.assert_called_once_with(
        vector=[0.1] * 768,
        filter={"search_id": "search-123"},
        top_k=100,
        include_metadata=True,
    )


@pytest.mark.asyncio
async def test_pinecone_service__if_same_content_different_search__creates_separate_vectors(
    mock_pinecone: MagicMock,
) -> None:
    # given
    service = PineconeService(api_key="fake", index_name="test")
    content = "identical content"

    # when
    vector_id_1 = service.generate_vector_id("search-1", content)
    vector_id_2 = service.generate_vector_id("search-2", content)

    # then
    assert vector_id_1 != vector_id_2
    assert len(vector_id_1) == 32
    assert len(vector_id_2) == 32


# Fixtures


@pytest.fixture
def mock_pinecone() -> Iterator[MagicMock]:
    """Mock Pinecone client and index"""
    with patch("app.services.pinecone_service.Pinecone") as mock_pc:
        mock_index = MagicMock()
        mock_pc_instance = MagicMock()
        mock_pc_instance.Index.return_value = mock_index
        mock_pc.return_value = mock_pc_instance
        yield mock_index
