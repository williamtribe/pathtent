#!/usr/bin/env python3
"""
Build IPC database from WIPO XML file.

@TODO-1 — IPC XML parsing and JSON export script

This script parses the WIPO IPC scheme XML file and exports
searchable IPC codes (subclass + main group levels) to JSON.

Usage:
    python scripts/build_ipc_db.py

Output:
    data/ipc_codes.json - IPC codes with descriptions (~8,000 entries)
"""

import json
import os
from pathlib import Path

from ipc_parser.parser import IpcParser


def build_ipc_database(xml_path: str, output_path: str) -> dict:
    """
    Parse WIPO IPC XML and extract searchable codes.

    Args:
        xml_path: Path to WIPO IPC scheme XML file
        output_path: Path to output JSON file

    Returns:
        Statistics about the parsed data
    """
    print(f"Parsing {xml_path}...")
    ipc = IpcParser(ipc_xml=xml_path)
    df = ipc.get_dataframe()

    print(f"Total entries in XML: {len(df)}")

    # Filter for searchable levels:
    # - 'u' = subclass (e.g., A01B, B60T) - ~651 entries
    # - 'm' = main group (e.g., A01B 1/00, B60T 7/00) - ~7,597 entries
    searchable_kinds = ["u", "m"]
    searchable_df = df[df["kind"].isin(searchable_kinds)].copy()

    print(f"Searchable entries (subclass + main group): {len(searchable_df)}")

    # Build structured data
    ipc_codes = {}
    for _, row in searchable_df.iterrows():
        code = row["code"].strip()
        description = row["description"].strip()

        # Get parent code from parent list
        parent_list = row["parent"]
        parent_code = parent_list[-1] if parent_list else None

        # Determine level
        level = "subclass" if row["kind"] == "u" else "main_group"

        ipc_codes[code] = {
            "code": code,
            "description": description,
            "description_ko": None,  # To be filled with Korean translations
            "parent_code": parent_code,
            "level": level,
        }

    # Save to JSON
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(ipc_codes, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(ipc_codes)} IPC codes to {output_path}")

    # Statistics
    stats = {
        "total_entries": len(df),
        "searchable_entries": len(ipc_codes),
        "subclass_count": len(
            [c for c in ipc_codes.values() if c["level"] == "subclass"]
        ),
        "main_group_count": len(
            [c for c in ipc_codes.values() if c["level"] == "main_group"]
        ),
    }

    return stats


def main():
    # Paths
    project_root = Path(__file__).parent.parent.parent.parent  # pathtent/
    xml_path = project_root / "data" / "ipc" / "EN_ipc_scheme_20240101.xml"
    output_path = Path(__file__).parent.parent / "data" / "ipc_codes.json"

    if not xml_path.exists():
        print(f"Error: IPC XML file not found at {xml_path}")
        print(
            "Please download from: https://www.wipo.int/ipc/itos4ipc/ITSupport_and_download_area/"
        )
        return

    stats = build_ipc_database(str(xml_path), str(output_path))

    print("\nStatistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
