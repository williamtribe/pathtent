#!/usr/bin/env python3
"""
Upload IPC embeddings to Qdrant vector database.

Reads pre-computed embeddings from ipc_embeddings.npz and uploads them
to a dedicated Qdrant collection for semantic IPC code search.

Usage:
    uv run python scripts/upload_ipc_to_qdrant.py

Environment variables:
    QDRANT_URL: Qdrant server URL (default: http://localhost:6333)
    QDRANT_API_KEY: Optional API key for Qdrant Cloud
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import Distance, PointStruct, VectorParams

load_dotenv(Path(__file__).parent.parent / ".env")

# Configuration
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY")
IPC_COLLECTION_NAME = "ipc_codes"
EMBEDDING_DIMENSION = 768
BATCH_SIZE = 100  # Qdrant upsert batch size


async def main() -> None:
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data"
    embeddings_path = data_dir / "ipc_embeddings.npz"
    ipc_json_path = data_dir / "ipc_codes.json"

    # Validate files exist
    if not embeddings_path.exists():
        print(f"Error: {embeddings_path} not found")
        print("Run build_ipc_embeddings.py first to generate embeddings")
        sys.exit(1)

    if not ipc_json_path.exists():
        print(f"Error: {ipc_json_path} not found")
        sys.exit(1)

    # Load embeddings
    print(f"Loading embeddings from {embeddings_path}...")
    npz_data = np.load(embeddings_path, allow_pickle=True)
    embeddings: np.ndarray = npz_data["embeddings"]
    codes: list[str] = npz_data["codes"].tolist()

    # Validate dimensions
    if embeddings.shape[1] != EMBEDDING_DIMENSION:
        print(f"Error: Embedding dimension mismatch!")
        print(f"  Expected: {EMBEDDING_DIMENSION}")
        print(f"  Got: {embeddings.shape[1]}")
        print("Re-run build_ipc_embeddings.py to regenerate 768-dim embeddings")
        sys.exit(1)

    print(f"  Shape: {embeddings.shape}")
    print(f"  Codes: {len(codes)}")

    # Load IPC metadata
    print(f"Loading IPC metadata from {ipc_json_path}...")
    with open(ipc_json_path, encoding="utf-8") as f:
        ipc_data: dict = json.load(f)

    # Connect to Qdrant
    print(f"Connecting to Qdrant at {QDRANT_URL}...")
    client = AsyncQdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    # Create or recreate collection
    print(f"Creating collection '{IPC_COLLECTION_NAME}'...")
    try:
        # Check if collection exists
        existing = await client.get_collection(IPC_COLLECTION_NAME)
        if existing:
            print(f"  Collection exists with {existing.points_count} points")
            response = input("  Delete and recreate? [y/N]: ")
            if response.lower() != "y":
                print("Aborted.")
                return
            await client.delete_collection(IPC_COLLECTION_NAME)
            print("  Deleted existing collection")
    except (UnexpectedResponse, Exception):
        pass  # Collection doesn't exist

    await client.create_collection(
        collection_name=IPC_COLLECTION_NAME,
        vectors_config=VectorParams(
            size=EMBEDDING_DIMENSION,
            distance=Distance.COSINE,
        ),
    )
    print(
        f"  Created collection with {EMBEDDING_DIMENSION}-dim vectors, cosine distance"
    )

    # Upload embeddings in batches
    total = len(codes)
    print(f"Uploading {total} embeddings in batches of {BATCH_SIZE}...")

    for batch_start in range(0, total, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total)
        batch_codes = codes[batch_start:batch_end]
        batch_embeddings = embeddings[batch_start:batch_end]

        points = []
        for i, (code, embedding) in enumerate(zip(batch_codes, batch_embeddings)):
            # Get metadata from IPC data
            ipc_info = ipc_data.get(code, {})

            points.append(
                PointStruct(
                    id=batch_start + i,  # Sequential integer ID
                    vector=embedding.tolist(),
                    payload={
                        "code": code,
                        "description": ipc_info.get("description", ""),
                        "level": ipc_info.get("level", "unknown"),
                        "parent_code": ipc_info.get("parent_code"),
                    },
                )
            )

        await client.upsert(
            collection_name=IPC_COLLECTION_NAME,
            points=points,
        )

        pct = batch_end / total * 100
        print(f"  {batch_end}/{total} ({pct:.1f}%)")

    # Verify
    collection_info = await client.get_collection(IPC_COLLECTION_NAME)
    print(
        f"\nDone! Collection '{IPC_COLLECTION_NAME}' has {collection_info.points_count} points"
    )

    # Test query
    print("\nTesting similarity search...")
    test_embedding = embeddings[0].tolist()
    results = await client.query_points(
        collection_name=IPC_COLLECTION_NAME,
        query=test_embedding,
        limit=3,
        with_payload=True,
    )
    print(f"  Query for '{codes[0]}' returned:")
    for point in results.points:
        payload = point.payload or {}
        print(
            f"    - {payload.get('code')}: {payload.get('description', '')[:50]}... (score: {point.score:.4f})"
        )

    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
