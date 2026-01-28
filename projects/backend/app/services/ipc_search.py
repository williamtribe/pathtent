"""
IPC Search Service - Embedding-based IPC code lookup.

This service provides grounded IPC code recommendations
by searching pre-computed Korean embeddings stored in Qdrant.

Usage:
    service = IpcSearchService(api_key="...")
    results = await service.search("EV battery cooling system", top_k=5)
    # Returns: [IpcSearchResult(code="H01M-010", description="...", score=0.85), ...]
"""

from dataclasses import dataclass

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.services.embedding import GeminiEmbeddingService

# Qdrant collection name for IPC embeddings
IPC_COLLECTION_NAME = "ipc_codes"


@dataclass
class IpcSearchResult:
    """Single IPC search result."""

    code: str
    description: str  # Korean description
    level: str  # "subclass" or "main_group"
    score: float  # cosine similarity score


class IpcSearchService:
    """
    Embedding-based IPC code search service using Qdrant.

    Queries pre-computed Korean IPC embeddings stored in Qdrant
    to find relevant IPC codes for a given invention description.
    """

    def __init__(
        self,
        api_key: str,
        qdrant_url: str = "http://localhost:6333",
        qdrant_api_key: str | None = None,
    ) -> None:
        """
        Initialize IPC search service.

        Args:
            api_key: Google AI API key for embedding queries
            qdrant_url: Qdrant server URL
            qdrant_api_key: Optional API key for Qdrant Cloud
        """
        self.api_key = api_key
        self.qdrant_client = AsyncQdrantClient(
            url=qdrant_url, api_key=qdrant_api_key, timeout=30
        )
        self.embedding_service = GeminiEmbeddingService(api_key=api_key)

    async def search(
        self,
        query: str,
        top_k: int = 5,
        level_filter: str | None = None,
    ) -> list[IpcSearchResult]:
        """
        Search for relevant IPC codes using Qdrant.

        Args:
            query: Invention description or technical keywords (Korean)
            top_k: Number of results to return
            level_filter: Optional filter - "subclass" or "main_group"

        Returns:
            List of IpcSearchResult sorted by relevance (highest first)
        """
        # Embed query (returns normalized 768-dim vector)
        query_embedding = await self.embedding_service.embed(query)

        # Build filter if level specified
        query_filter = None
        if level_filter:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="level",
                        match=MatchValue(value=level_filter),
                    )
                ]
            )

        # Query Qdrant
        response = await self.qdrant_client.query_points(
            collection_name=IPC_COLLECTION_NAME,
            query=query_embedding,
            query_filter=query_filter,
            limit=top_k,
            with_payload=True,
        )

        # Build results
        results: list[IpcSearchResult] = []
        for point in response.points:
            payload = point.payload or {}
            results.append(
                IpcSearchResult(
                    code=payload.get("code", ""),
                    description=payload.get("description", ""),
                    level=payload.get("level", "unknown"),
                    score=point.score if point.score is not None else 0.0,
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

    async def close(self) -> None:
        """Close Qdrant client connection."""
        await self.qdrant_client.close()


# Singleton instance (lazy initialization)
_ipc_search_service: IpcSearchService | None = None


def get_ipc_search_service(
    api_key: str,
    qdrant_url: str = "http://localhost:6333",
    qdrant_api_key: str | None = None,
) -> IpcSearchService:
    """Get or create singleton IpcSearchService instance."""
    global _ipc_search_service
    if _ipc_search_service is None:
        _ipc_search_service = IpcSearchService(
            api_key=api_key,
            qdrant_url=qdrant_url,
            qdrant_api_key=qdrant_api_key,
        )
    return _ipc_search_service
