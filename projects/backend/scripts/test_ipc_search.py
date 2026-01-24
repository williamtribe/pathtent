#!/usr/bin/env python3
"""Quick test for IpcSearchService."""

import asyncio
import os
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from app.services.ipc_search import IpcSearchService


async def main():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not set")
        return

    print("Loading IpcSearchService...")
    service = IpcSearchService(api_key=api_key)
    print(f"Loaded {len(service.codes)} IPC codes")
    print()

    # Test queries
    test_queries = [
        "전기자동차 배터리 냉각 시스템",
        "블록체인 기반 전자투표",
        "인공지능 이미지 인식",
        "자동차 브레이크 제어",
    ]

    for query in test_queries:
        print(f"Query: {query}")
        print("-" * 50)
        results = await service.search(query, top_k=5)
        for r in results:
            print(f"  {r.code}: {r.description[:60]}... (score: {r.score:.3f})")
        print()


if __name__ == "__main__":
    asyncio.run(main())
