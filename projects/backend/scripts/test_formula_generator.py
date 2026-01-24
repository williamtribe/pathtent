#!/usr/bin/env python3
"""Test refactored formula generator with grounded IPC codes."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from app.services.formula_generator import generate_formula
from app.schemas.formula import FormulaOptions


async def main():
    print("=== Test: Formula Generation with Grounded IPC ===\n")

    test_cases = [
        "전기자동차 배터리 냉각 시스템",
        "블록체인 기반 전자투표 시스템",
        "인공지능을 활용한 의료 영상 진단",
    ]

    for text in test_cases:
        print(f"Input: {text}")
        print("-" * 60)

        result = await generate_formula(text)

        print(f"Formula: {result.formula[:100]}...")
        print(f"Keywords: {result.keywords}")
        print(f"IPC Codes (Grounded): {result.ipc_codes}")
        print(f"Excluded: {result.excluded_terms}")
        print(f"Explanation: {result.explanation[:100]}...")
        print()


if __name__ == "__main__":
    asyncio.run(main())
