"""Vector database abstraction layer.

Supports multiple backends: Pinecone (cloud), Qdrant (local/cloud).
"""

from __future__ import annotations

from typing import Any, Protocol


class VectorDBError(RuntimeError):
    """Unified error for all vector database operations."""

    pass


class VectorDBService(Protocol):
    """Abstract interface for vector database operations.

    All implementations must match this structural interface.
    """

    def generate_vector_id(self, search_id: str, content: str) -> str:
        """Generate deterministic vector ID.

        Args:
            search_id: Search UUID (for scoping)
            content: Text content

        Returns:
            Unique vector ID (32-char hash)
        """
        ...

    async def get_or_create(
        self,
        search_id: str,
        content: str,
        embedding: list[float],
        metadata: dict[str, Any],
    ) -> str:
        """Get existing vector or create new one (deduplication).

        Args:
            search_id: Search UUID (for vector ID scoping)
            content: Text content
            embedding: Vector embedding (768 dims for Gemini)
            metadata: Additional metadata

        Returns:
            Vector ID
        """
        ...

    async def query_similar(
        self,
        embedding: list[float],
        search_id: str,
        *,
        top_k: int = 100,
        min_score: float = 0.7,
    ) -> list[dict[str, Any]]:
        """Query similar vectors filtered by search_id.

        Args:
            embedding: Query vector
            search_id: Search UUID (for metadata filtering)
            top_k: Maximum results
            min_score: Minimum similarity score (0-1)

        Returns:
            List of matches: [{"id": str, "score": float, "metadata": dict}, ...]
            Sorted by similarity descending.
        """
        ...
