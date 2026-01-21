"""Vector database factory - creates appropriate backend based on config."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.services.vector_db.base import VectorDBError, VectorDBService
from app.services.vector_db.pinecone import PineconeVectorDB
from app.services.vector_db.qdrant import QdrantVectorDB

if TYPE_CHECKING:
    from app.config import Settings


def create_vector_db(settings: Settings) -> VectorDBService:
    mode = settings.vector_db_mode.lower()

    if mode == "pinecone":
        if not settings.pinecone_api_key or not settings.pinecone_index_name:
            raise VectorDBError("Pinecone requires PINECONE_API_KEY and PINECONE_INDEX_NAME")

        return PineconeVectorDB(
            api_key=settings.pinecone_api_key,
            index_name=settings.pinecone_index_name,
        )

    if mode == "qdrant":
        return QdrantVectorDB(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection_name,
            dimension=settings.vector_db_dimension,
        )

    raise VectorDBError(f"Unknown VECTOR_DB_MODE={settings.vector_db_mode!r}")
