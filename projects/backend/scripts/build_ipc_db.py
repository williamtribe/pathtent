#!/usr/bin/env python3
"""
Build IPC database from Korean CSV files.

This script parses Korean IPC CSV files (subclass + main group)
and exports to JSON for embedding-based search.

Usage:
    python scripts/build_ipc_db.py

Output:
    data/ipc_codes.json - IPC codes with Korean descriptions
"""

import csv
import json
import os
from pathlib import Path


def build_ipc_database(
    subclass_csv: str,
    maingroup_csv: str,
    output_path: str,
) -> dict:
    """
    Parse Korean IPC CSV files and build JSON database.

    Args:
        subclass_csv: Path to IPC subclass CSV (4-digit codes)
        maingroup_csv: Path to IPC main group CSV (7-digit codes)
        output_path: Path to output JSON file

    Returns:
        Statistics about the parsed data
    """
    ipc_codes: dict[str, dict] = {}

    # 1. Parse subclass CSV (e.g., A01B -> "Soil-working in agriculture...")
    print("Parsing subclass CSV...")
    with open(subclass_csv, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row["IPC subclass"].strip()
            description = row["Label"].strip()

            ipc_codes[code] = {
                "code": code,
                "description": description,
                "parent_code": None,  # Subclass has no parent in our hierarchy
                "level": "subclass",
            }

    subclass_count = len(ipc_codes)
    print(f"  Loaded {subclass_count} subclasses")

    # 2. Parse main group CSV (e.g., A01B-001 -> "Hand tools for agriculture...")
    print("Parsing main group CSV...")
    with open(maingroup_csv, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row["IPC maingroup"].strip()
            description = row["Label"].strip()

            # Extract parent subclass (A01B-001 -> A01B)
            parent_code = code.split("-")[0] if "-" in code else None

            ipc_codes[code] = {
                "code": code,
                "description": description,
                "parent_code": parent_code,
                "level": "main_group",
            }

    maingroup_count = len(ipc_codes) - subclass_count
    print(f"  Loaded {maingroup_count} main groups")

    # Save to JSON
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(ipc_codes, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(ipc_codes)} IPC codes to {output_path}")

    stats = {
        "total_entries": len(ipc_codes),
        "subclass_count": subclass_count,
        "main_group_count": maingroup_count,
    }

    return stats


def main():
    data_dir = Path(__file__).parent.parent / "data"

    subclass_csv = data_dir / "IPC서브클래스_4자리.csv"
    maingroup_csv = data_dir / "IPC메인그룹_7자리.csv"
    output_path = data_dir / "ipc_codes.json"

    # Check files exist
    if not subclass_csv.exists():
        print("Error: Subclass CSV not found")
        return

    if not maingroup_csv.exists():
        print("Error: Main group CSV not found")
        return

    stats = build_ipc_database(
        str(subclass_csv),
        str(maingroup_csv),
        str(output_path),
    )

    print("\nStatistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
