"""
IPC Search Service - Embedding-based IPC code lookup.

This service provides grounded IPC code recommendations
by searching pre-computed Korean embeddings.

Usage:
    service = IpcSearchService(api_key="...")
    results = await service.search("EV battery cooling system", top_k=5)
    # Returns: [IpcSearchResult(code="H01M-010", description="...", score=0.85), ...]
"""

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from app.config import Settings
from app.services.embedding import GeminiEmbeddingService


@dataclass
class IpcSearchResult:
    """Single IPC search result."""

    code: str
    description: str  # Korean description
    level: str  # "subclass" or "main_group"
    score: float  # cosine similarity score


class IpcSearchService:
    """
    Embedding-based IPC code search service.

    Loads pre-computed Korean IPC embeddings and performs cosine similarity
    search to find relevant IPC codes for a given invention description.
    """

    def __init__(
        self,
        api_key: str,
        embeddings_path: str | None = None,
        ipc_json_path: str | None = None,
    ) -> None:
        """
        Initialize IPC search service.

        Args:
            api_key: Google AI API key for embedding queries
            embeddings_path: Path to ipc_embeddings.npz (default: data/ipc_embeddings.npz)
            ipc_json_path: Path to ipc_codes.json (default: data/ipc_codes.json)
        """
        self.api_key = api_key

        # Default paths
        data_dir = Path(__file__).parent.parent.parent / "data"
        if embeddings_path is None:
            embeddings_path = str(data_dir / "ipc_embeddings.npz")
        if ipc_json_path is None:
            ipc_json_path = str(data_dir / "ipc_codes.json")

        # Load embeddings
        npz_data = np.load(embeddings_path, allow_pickle=True)
        self.embeddings: np.ndarray = npz_data["embeddings"]  # (N, 768)
        self.codes: list[str] = npz_data["codes"].tolist()  # N codes

        # Normalize embeddings for cosine similarity (dot product after normalization)
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        self.embeddings_normalized = self.embeddings / (norms + 1e-9)

        # Load IPC metadata
        with open(ipc_json_path, encoding="utf-8") as f:
            self.ipc_data: dict = json.load(f)

        # Embedding service for queries
        self.embedding_service = GeminiEmbeddingService(api_key=api_key)

    async def search(
        self,
        query: str,
        top_k: int = 5,
        level_filter: str | None = None,
    ) -> list[IpcSearchResult]:
        """
        Search for relevant IPC codes.

        Args:
            query: Invention description or technical keywords (Korean)
            top_k: Number of results to return
            level_filter: Optional filter - "subclass" or "main_group"

        Returns:
            List of IpcSearchResult sorted by relevance (highest first)
        """
        # Embed query directly (Korean embeddings)
        query_embedding = await self.embedding_service.embed(query)
        query_vec = np.array(query_embedding, dtype=np.float32)

        # Normalize query
        query_norm = np.linalg.norm(query_vec)
        query_normalized = query_vec / (query_norm + 1e-9)

        # Compute cosine similarities (dot product of normalized vectors)
        similarities = self.embeddings_normalized @ query_normalized

        # Apply level filter if specified
        if level_filter:
            mask = np.array(
                [
                    self.ipc_data.get(code, {}).get("level") == level_filter
                    for code in self.codes
                ]
            )
            similarities = np.where(mask, similarities, -1.0)

        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]

        # Build results
        results: list[IpcSearchResult] = []
        for idx in top_indices:
            code = self.codes[idx]
            score = float(similarities[idx])

            if score < 0:  # Filtered out
                continue

            ipc_info = self.ipc_data.get(code, {})
            results.append(
                IpcSearchResult(
                    code=code,
                    description=ipc_info.get("description", ""),
                    level=ipc_info.get("level", "unknown"),
                    score=score,
                )
            )

        return results

    async def search_by_keywords(
        self,
        keywords: list[str],
        top_k: int = 5,
    ) -> list[IpcSearchResult]:
        """
        Search using multiple keywords (combined query).

        Args:
            keywords: List of technical keywords
            top_k: Number of results to return

        Returns:
            List of IpcSearchResult
        """
        combined_query = " ".join(keywords)
        return await self.search(combined_query, top_k=top_k)


# Singleton instance (lazy initialization)
_ipc_search_service: IpcSearchService | None = None


def get_ipc_search_service(api_key: str) -> IpcSearchService:
    """Get or create singleton IpcSearchService instance."""
    global _ipc_search_service
    if _ipc_search_service is None:
        _ipc_search_service = IpcSearchService(api_key=api_key)
    return _ipc_search_service
