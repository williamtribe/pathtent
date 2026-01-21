"""Vector database abstraction layer.

Usage:
    from app.services.vector_db import create_vector_db, VectorDBService

    vector_db = create_vector_db(settings)  # Returns Pinecone or Qdrant based on config
"""

from app.services.vector_db.base import VectorDBError, VectorDBService
from app.services.vector_db.factory import create_vector_db

__all__ = ["VectorDBService", "VectorDBError", "create_vector_db"]
