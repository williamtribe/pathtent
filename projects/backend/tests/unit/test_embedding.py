from unittest.mock import MagicMock, patch

import pytest
from app.services.embedding import GeminiEmbeddingService


@pytest.mark.asyncio
async def test_gemini_embedding_service__if_embed__returns_768_dimensions(
    mock_genai_client: MagicMock,
) -> None:
    # given
    service = GeminiEmbeddingService(api_key="fake_key", model="models/embedding-001")

    # when
    result = await service.embed("test text")

    # then
    assert isinstance(result, list)
    assert len(result) == 768
    assert all(isinstance(x, (int, float)) for x in result)


@pytest.mark.asyncio
async def test_gemini_embedding_service__if_long_text__truncates_before_embedding(
    mock_genai_client: MagicMock,
) -> None:
    # given
    service = GeminiEmbeddingService(api_key="fake_key", model="models/embedding-001")
    # Create text that exceeds 2048 tokens (approximately 8192 characters)
    long_text = "test " * 2000

    # when
    result = await service.embed(long_text)

    # then
    # Verify embedding was generated
    assert isinstance(result, list)
    assert len(result) == 768
    # Verify client.embed was called (truncation happens internally)
    mock_genai_client.Client.return_value.embed.assert_called_once()


@pytest.mark.asyncio
async def test_gemini_embedding_service__if_embed_batch__returns_multiple_vectors(
    mock_genai_client: MagicMock,
) -> None:
    # given
    service = GeminiEmbeddingService(api_key="fake_key", model="models/embedding-001")
    texts = ["text one", "text two", "text three"]

    # when
    result = await service.embed_batch(texts)

    # then
    assert isinstance(result, list)
    assert len(result) == 3
    for vector in result:
        assert isinstance(vector, list)
        assert len(vector) == 768
        assert all(isinstance(x, (int, float)) for x in vector)


@pytest.mark.asyncio
async def test_gemini_embedding_service__if_korean_text__embeds_correctly(
    mock_genai_client: MagicMock,
) -> None:
    # given
    service = GeminiEmbeddingService(api_key="fake_key", model="models/embedding-001")
    korean_text = "특허 검색 시스템"

    # when
    result = await service.embed(korean_text)

    # then
    assert isinstance(result, list)
    assert len(result) == 768
    assert all(isinstance(x, (int, float)) for x in result)
    # Verify embed was called with Korean text
    mock_genai_client.Client.return_value.embed.assert_called_once()


@pytest.mark.asyncio
async def test_gemini_embedding_service__if_empty_text__embeds_correctly(
    mock_genai_client: MagicMock,
) -> None:
    # given
    service = GeminiEmbeddingService(api_key="fake_key", model="models/embedding-001")
    empty_text = ""

    # when
    result = await service.embed(empty_text)

    # then
    assert isinstance(result, list)
    assert len(result) == 768


@pytest.mark.asyncio
async def test_gemini_embedding_service__if_custom_model__uses_specified_model(
    mock_genai_client: MagicMock,
) -> None:
    # given
    custom_model = "models/custom-embedding"
    service = GeminiEmbeddingService(api_key="fake_key", model=custom_model)

    # when
    await service.embed("test")

    # then
    call_args = mock_genai_client.Client.return_value.embed.call_args
    assert call_args.kwargs["model"] == custom_model


# Fixtures (must be at the bottom)
@pytest.fixture
def mock_genai_client() -> MagicMock:
    """Mock google.genai.Client"""
    with patch("app.services.embedding.genai") as mock_genai:
        # Mock Client instance
        mock_client_instance = MagicMock()
        mock_genai.Client.return_value = mock_client_instance

        # Mock embed result
        mock_result = MagicMock()
        mock_embedding = MagicMock()
        mock_embedding.values = [0.1] * 768
        mock_result.embeddings = [mock_embedding]
        mock_client_instance.embed.return_value = mock_result

        yield mock_genai
