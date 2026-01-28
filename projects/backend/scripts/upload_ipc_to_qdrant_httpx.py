#!/usr/bin/env python3
"""
Upload IPC embeddings to Qdrant using direct HTTP API calls.

Workaround for QdrantClient timeout issues on Windows.
"""

import json
import os
import sys
from pathlib import Path

import httpx
import numpy as np
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Configuration
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY")
IPC_COLLECTION_NAME = "ipc_codes"
EMBEDDING_DIMENSION = 768
BATCH_SIZE = 100


def get_headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if QDRANT_API_KEY:
        headers["api-key"] = QDRANT_API_KEY
    return headers


def main() -> None:
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data"
    embeddings_path = data_dir / "ipc_embeddings.npz"
    ipc_json_path = data_dir / "ipc_codes.json"

    # Validate files exist
    if not embeddings_path.exists():
        print(f"Error: {embeddings_path} not found")
        sys.exit(1)

    if not ipc_json_path.exists():
        print(f"Error: {ipc_json_path} not found")
        sys.exit(1)

    # Load embeddings
    print(f"Loading embeddings from {embeddings_path}...")
    npz_data = np.load(embeddings_path, allow_pickle=True)
    embeddings: np.ndarray = npz_data["embeddings"]
    codes: list[str] = npz_data["codes"].tolist()
    print(f"  Shape: {embeddings.shape}")
    print(f"  Codes: {len(codes)}")

    # Load IPC metadata
    print(f"Loading IPC metadata from {ipc_json_path}...")
    with open(ipc_json_path, encoding="utf-8") as f:
        ipc_data: dict = json.load(f)

    # Create HTTP client with longer timeout
    client = httpx.Client(base_url=QDRANT_URL, headers=get_headers(), timeout=120.0)

    print(f"Connecting to Qdrant at {QDRANT_URL}...")

    # Check if collection exists
    print(f"Checking collection '{IPC_COLLECTION_NAME}'...")
    try:
        r = client.get(f"/collections/{IPC_COLLECTION_NAME}")
        if r.status_code == 200:
            info = r.json()
            points_count = info.get("result", {}).get("points_count", 0)
            print(f"  Collection exists with {points_count} points")
            response = input("  Delete and recreate? [y/N]: ")
            if response.lower() != "y":
                print("Aborted.")
                return
            # Delete collection
            client.delete(f"/collections/{IPC_COLLECTION_NAME}")
            print("  Deleted existing collection")
    except Exception:
        pass  # Collection doesn't exist

    # Create collection
    print(f"Creating collection '{IPC_COLLECTION_NAME}'...")
    create_payload = {"vectors": {"size": EMBEDDING_DIMENSION, "distance": "Cosine"}}
    r = client.put(f"/collections/{IPC_COLLECTION_NAME}", json=create_payload)
    if r.status_code not in (200, 201):
        print(f"Error creating collection: {r.status_code} {r.text}")
        sys.exit(1)
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
            ipc_info = ipc_data.get(code, {})
            points.append(
                {
                    "id": batch_start + i,
                    "vector": embedding.tolist(),
                    "payload": {
                        "code": code,
                        "description": ipc_info.get("description", ""),
                        "level": ipc_info.get("level", "unknown"),
                        "parent_code": ipc_info.get("parent_code"),
                    },
                }
            )

        upsert_payload = {"points": points}
        r = client.put(
            f"/collections/{IPC_COLLECTION_NAME}/points", json=upsert_payload
        )
        if r.status_code not in (200, 201):
            print(f"Error upserting batch: {r.status_code} {r.text}")
            sys.exit(1)

        pct = batch_end / total * 100
        print(f"  {batch_end}/{total} ({pct:.1f}%)")

    # Verify
    r = client.get(f"/collections/{IPC_COLLECTION_NAME}")
    info = r.json()
    points_count = info.get("result", {}).get("points_count", 0)
    print(f"\nDone! Collection '{IPC_COLLECTION_NAME}' has {points_count} points")

    # Test query
    print("\nTesting similarity search...")
    test_embedding = embeddings[0].tolist()
    search_payload = {"vector": test_embedding, "limit": 3, "with_payload": True}
    r = client.post(
        f"/collections/{IPC_COLLECTION_NAME}/points/search", json=search_payload
    )
    if r.status_code == 200:
        results = r.json().get("result", [])
        print(f"  Query for '{codes[0]}' returned:")
        for point in results:
            payload = point.get("payload", {})
            desc = payload.get("description", "")[:50]
            score = point.get("score", 0)
            print(f"    - {payload.get('code')}: {desc}... (score: {score:.4f})")

    client.close()
    print("\nUpload complete!")


if __name__ == "__main__":
    main()
