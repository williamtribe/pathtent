"""Qdrant vector database implementation."""

from __future__ import annotations

import hashlib
from typing import Any

from qdrant_client import AsyncQdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.services.vector_db.base import VectorDBError


class QdrantVectorDB:
    """Qdrant vector database service for patent embeddings.

    Auto-creates collection on init (idempotent).
    """

    def __init__(
        self,
        url: str,
        collection_name: str,
        dimension: int,
        api_key: str | None = None,
    ) -> None:
        """Initialize Qdrant service.

        Args:
            url: Qdrant server URL (e.g., http://localhost:6333)
            collection_name: Collection name
            dimension: Vector dimension (768 for Gemini)
            api_key: Optional API key for Qdrant Cloud
        """
        self.collection_name = collection_name
        self.dimension = dimension
        self.client = AsyncQdrantClient(url=url, api_key=api_key)
        self._initialized = False

    async def _ensure_collection(self) -> None:
        """Ensure collection exists (idempotent, lazy init)."""
        if self._initialized:
            return

        try:
            await self.client.get_collection(self.collection_name)
        except (UnexpectedResponse, Exception):
            # Collection doesn't exist, create it
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.dimension,
                    distance=Distance.COSINE,
                ),
            )

        self._initialized = True

    def generate_vector_id(self, search_id: str, content: str) -> str:
        """Generate vector ID with search_id scoping.

        Same content in different searches -> different vector IDs.

        Args:
            search_id: Search UUID (for scoping)
            content: Text content

        Returns:
            32-char SHA256 hash
        """
        combined = f"{search_id}:{content}"
        return hashlib.sha256(combined.encode()).hexdigest()[:32]

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
            embedding: 768-dimensional vector
            metadata: Additional metadata

        Returns:
            Vector ID (32-char hash)
        """
        await self._ensure_collection()
        vector_id = self.generate_vector_id(search_id, content)

        try:
            # Check if exists
            existing = await self.client.retrieve(
                collection_name=self.collection_name,
                ids=[vector_id],
            )

            if not existing:
                # Create new - include search_id in payload for filtering
                payload = {
                    "search_id": search_id,
                    **metadata,
                }
                await self.client.upsert(
                    collection_name=self.collection_name,
                    points=[
                        PointStruct(
                            id=vector_id,
                            vector=embedding,
                            payload=payload,
                        )
                    ],
                )
        except Exception as e:
            raise VectorDBError("Qdrant get_or_create failed") from e

        return vector_id

    async def query_similar(
        self,
        embedding: list[float],
        search_id: str,
        *,
        top_k: int = 100,
        min_score: float = 0.7,
    ) -> list[dict[str, Any]]:
        """Query similar vectors filtered by search_id and similarity score.

        Args:
            embedding: Query vector (768 dims)
            search_id: Search UUID (for payload filtering)
            top_k: Maximum results
            min_score: Minimum similarity score

        Returns:
            List of matches with score >= min_score
        """
        await self._ensure_collection()

        try:
            response = await self.client.query_points(
                collection_name=self.collection_name,
                query=embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="search_id",
                            match=MatchValue(value=search_id),
                        )
                    ]
                ),
                limit=top_k,
                with_payload=True,
                score_threshold=min_score,
            )

            return [
                {
                    "id": str(point.id),
                    "score": point.score,
                    "metadata": point.payload or {},
                }
                for point in response.points
            ]
        except Exception as e:
            raise VectorDBError("Qdrant query_similar failed") from e
