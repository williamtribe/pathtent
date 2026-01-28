import asyncio
import os
from typing import Protocol

import numpy as np
import tiktoken
from google import genai

EMBEDDING_MODEL_TOKEN_LIMIT = 2048
TIKTOKEN_ENCODING = "cl100k_base"
DEFAULT_EMBEDDING_MODEL = os.environ.get(
    "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"
)
# Standardized dimension for all embeddings (reduced from 3072 for efficiency)
DEFAULT_EMBEDDING_DIMENSION = 768


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


def normalize_embedding(embedding: list[float]) -> list[float]:
    """L2 normalize embedding vector.

    Required for reduced dimensionality embeddings (768) to maintain
    cosine similarity accuracy. Full 3072-dim embeddings from Gemini
    are auto-normalized, but reduced dimensions are not.

    Args:
        embedding: Raw embedding vector

    Returns:
        L2 normalized embedding vector
    """
    vec = np.array(embedding, dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


class EmbeddingService(Protocol):
    """Protocol for embedding service abstraction"""

    async def embed(self, text: str) -> list[float]: ...
    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...


class GeminiEmbeddingService:
    """Gemini embedding service using gemini-embedding-001 model"""

    def __init__(
        self,
        api_key: str,
        model: str | None = None,
        dimension: int = DEFAULT_EMBEDDING_DIMENSION,
    ) -> None:
        """
        Initialize Gemini embedding service.

        Args:
            api_key: Google AI API key
            model: Embedding model name (default: from GEMINI_EMBEDDING_MODEL env var)
            dimension: Output embedding dimension (default: 768)
        """
        self.client = genai.Client(api_key=api_key)
        self.model = model or DEFAULT_EMBEDDING_MODEL
        self.dimension = dimension

    async def embed(self, text: str) -> list[float]:
        """
        Generate embedding for single text.

        Args:
            text: Text to embed (will be truncated to token limit)

        Returns:
            768-dimensional L2-normalized embedding vector
        """
        truncated = truncate_to_token_limit(text)
        dimension = self.dimension

        def _embed_sync() -> list[float]:
            result = self.client.models.embed_content(
                model=self.model,
                contents=truncated,
                config={"output_dimensionality": dimension},
            )
            embeddings = result.embeddings
            if not embeddings:
                raise ValueError("No embeddings returned")
            values = embeddings[0].values
            if not values:
                raise ValueError("Embedding values is None")
            # L2 normalize for reduced dimensionality
            return normalize_embedding(list(values))

        return await asyncio.to_thread(_embed_sync)

    async def embed_batch(
        self, texts: list[str], batch_size: int = 100
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple texts using true batch API calls.

        Processes texts in batches to minimize API calls while staying within limits.
        With RPM=1000, batch_size=100 allows 100k texts/min theoretical max.

        Args:
            texts: List of texts to embed
            batch_size: Number of texts per API call (default 100)

        Returns:
            List of 768-dimensional L2-normalized embedding vectors (same order as input)
        """
        truncated_texts = [truncate_to_token_limit(text) for text in texts]
        dimension = self.dimension

        def _embed_batch_sync() -> list[list[float]]:
            all_results: list[list[float]] = []

            # Process in batches
            for i in range(0, len(truncated_texts), batch_size):
                batch = truncated_texts[i : i + batch_size]

                # Single API call for entire batch
                result = self.client.models.embed_content(
                    model=self.model,
                    contents=batch,
                    config={"output_dimensionality": dimension},
                )

                embeddings = result.embeddings
                if embeddings is None or len(embeddings) != len(batch):
                    raise ValueError(
                        f"Expected {len(batch)} embeddings, got {len(embeddings) if embeddings else 0}"
                    )

                for embedding in embeddings:
                    if embedding.values is None:
                        raise ValueError("Embedding values is None")
                    # L2 normalize for reduced dimensionality
                    all_results.append(normalize_embedding(list(embedding.values)))

            return all_results

        return await asyncio.to_thread(_embed_batch_sync)
