#!/usr/bin/env python3
"""Debug IPC search issue."""

import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

import numpy as np
from app.services.embedding import GeminiEmbeddingService


async def main():
    api_key = os.environ.get("GOOGLE_API_KEY")
    service = GeminiEmbeddingService(api_key=api_key)

    # Load embeddings
    data_dir = Path(__file__).parent.parent / "data"
    npz = np.load(data_dir / "ipc_embeddings.npz", allow_pickle=True)
    embeddings = npz["embeddings"]
    codes = npz["codes"].tolist()

    import json

    with open(data_dir / "ipc_codes.json", encoding="utf-8") as f:
        ipc_data = json.load(f)

    # Normalize
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings_norm = embeddings / (norms + 1e-9)

    print("=== Test 1: English query ===")
    query_en = "electric vehicle battery cooling system"
    emb = await service.embed(query_en)
    emb_norm = np.array(emb) / (np.linalg.norm(emb) + 1e-9)
    sims = embeddings_norm @ emb_norm
    top_idx = np.argsort(sims)[::-1][:5]
    print(f"Query: {query_en}")
    for i in top_idx:
        print(
            f"  {codes[i]}: {ipc_data[codes[i]]['description'][:50]}... ({sims[i]:.3f})"
        )

    print()
    print("=== Test 2: Korean query ===")
    query_ko = "전기자동차 배터리 냉각 시스템"
    emb = await service.embed(query_ko)
    emb_norm = np.array(emb) / (np.linalg.norm(emb) + 1e-9)
    sims = embeddings_norm @ emb_norm
    top_idx = np.argsort(sims)[::-1][:5]
    print(f"Query: {query_ko}")
    for i in top_idx:
        print(
            f"  {codes[i]}: {ipc_data[codes[i]]['description'][:50]}... ({sims[i]:.3f})"
        )

    print()
    print("=== Test 3: Check specific IPC codes ===")
    # Find B60L (electric vehicles) and H01M (batteries)
    for code in ["B60L", "H01M", "H01M 10/00", "B60K"]:
        if code in ipc_data:
            idx = codes.index(code)
            print(f"{code}: {ipc_data[code]['description'][:60]}")
            print(f"  Similarity to EN query: {(embeddings_norm[idx] @ emb_norm):.3f}")


if __name__ == "__main__":
    asyncio.run(main())
