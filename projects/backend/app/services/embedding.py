import asyncio
import os
from typing import Protocol

import tiktoken
from google import genai

EMBEDDING_MODEL_TOKEN_LIMIT = 2048
TIKTOKEN_ENCODING = "cl100k_base"
DEFAULT_EMBEDDING_MODEL = os.environ.get(
    "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"
)


def truncate_to_token_limit(
    text: str,
    max_tokens: int = EMBEDDING_MODEL_TOKEN_LIMIT,
    encoding_name: str = TIKTOKEN_ENCODING,
) -> str:
    """Truncate text to fit within token limit."""
    try:
        encoding = tiktoken.get_encoding(encoding_name)
        tokens = encoding.encode(text)

        if len(tokens) <= max_tokens:
            return text

        truncated_tokens = tokens[:max_tokens]
        return encoding.decode(truncated_tokens)
    except Exception:
        char_limit = max_tokens * 4
        return text[:char_limit] if len(text) > char_limit else text


class EmbeddingService(Protocol):
    """Protocol for embedding service abstraction"""

    async def embed(self, text: str) -> list[float]: ...
    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...


class GeminiEmbeddingService:
    """Gemini embedding service using gemini-embedding-001 model"""

    def __init__(self, api_key: str, model: str | None = None) -> None:
        """
        Initialize Gemini embedding service.

        Args:
            api_key: Google AI API key
            model: Embedding model name (default: from GEMINI_EMBEDDING_MODEL env var)
        """
        self.client = genai.Client(api_key=api_key)
        self.model = model or DEFAULT_EMBEDDING_MODEL

    async def embed(self, text: str) -> list[float]:
        """
        Generate embedding for single text.

        Args:
            text: Text to embed (will be truncated to token limit)

        Returns:
            3072-dimensional embedding vector
        """
        truncated = truncate_to_token_limit(text)

        def _embed_sync() -> list[float]:
            result = self.client.models.embed_content(
                model=self.model, contents=truncated
            )
            embeddings = result.embeddings
            if not embeddings:
                raise ValueError("No embeddings returned")
            values = embeddings[0].values
            if not values:
                raise ValueError("Embedding values is None")
            return list(values)

        return await asyncio.to_thread(_embed_sync)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed

        Returns:
            List of 3072-dimensional embedding vectors
        """
        truncated_texts = [truncate_to_token_limit(text) for text in texts]

        def _embed_batch_sync() -> list[list[float]]:
            results: list[list[float]] = []
            for text in truncated_texts:
                result = self.client.models.embed_content(
                    model=self.model, contents=text
                )
                embeddings = result.embeddings
                if embeddings is None or len(embeddings) == 0:
                    raise ValueError("No embeddings returned")
                embedding = embeddings[0]
                if embedding.values is None:
                    raise ValueError("Embedding values is None")
                results.append(list(embedding.values))
            return results

        return await asyncio.to_thread(_embed_batch_sync)
