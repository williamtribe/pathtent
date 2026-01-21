import hashlib
from typing import Any

from pinecone import Pinecone


class PineconeService:
    """Vector database service for patent embeddings"""

    def __init__(self, api_key: str, index_name: str) -> None:
        """
        Initialize Pinecone service.

        Args:
            api_key: Pinecone API key
            index_name: Pinecone index name
        """
        self.pc = Pinecone(api_key=api_key)
        self.index = self.pc.Index(index_name)

    def generate_vector_id(self, search_id: str, content: str) -> str:
        """
        Generate vector ID with search_id scoping.

        Same content in different searches → different vector IDs

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
        metadata: dict,
    ) -> str:
        """
        Get existing vector or create new one (deduplication).

        Args:
            search_id: Search UUID (for vector ID scoping)
            content: Text content
            embedding: 768-dimensional vector
            metadata: Additional metadata

        Returns:
            Vector ID (32-char hash)
        """
        vector_id = self.generate_vector_id(search_id, content)

        # Check if exists
        existing = self.index.fetch([vector_id])
        if vector_id not in existing.vectors:
            # Create new
            self.index.upsert([(vector_id, embedding, metadata)])

        return vector_id

    async def query_similar(
        self,
        embedding: list[float],
        search_id: str,
        top_k: int = 100,
        min_score: float = 0.7,
    ) -> list[dict[str, Any]]:
        """
        Query similar vectors filtered by search_id and similarity score.

        Args:
            embedding: Query vector (768 dims)
            search_id: Search UUID (for metadata filtering)
            top_k: Maximum results
            min_score: Minimum similarity score

        Returns:
            List of matches with score >= min_score
        """
        results = self.index.query(
            vector=embedding,
            filter={"search_id": search_id},
            top_k=top_k,
            include_metadata=True,
        )

        # Filter by minimum score
        matches = getattr(results, "matches", [])
        return [
            {
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata,
            }
            for match in matches
            if match.score >= min_score
        ]
