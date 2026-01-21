"""Claims section parser for patent documents.

Extracts the claims section from Korean and English patent documents
using multiple heuristic patterns with fallback to full document.
"""

import re
from dataclasses import dataclass
from typing import Literal


@dataclass
class ClaimsResult:
    """Result of claims extraction with source indicator.

    Attributes:
        text: Extracted claims text or full document text
        source: Indicator of extraction source ("claims" or "full_doc")
    """

    text: str
    source: Literal["claims", "full_doc"]


def extract_claims(text: str) -> ClaimsResult:
    """Extract claims section from patent text using multiple heuristic patterns.

    Tries patterns in order from most specific to least specific.
    Falls back to full document if no pattern matches or match is too short.

    The function attempts the following patterns in order:
    1. Standard Korean format with 【brackets】
    2. Whitespace-tolerant Korean format
    3. Numbered claims format (청구항 1. ...)
    4. English patent format (Claims...Description)
    5. Alternative Korean format (특허청구범위)

    Args:
        text: Full patent document text

    Returns:
        ClaimsResult with extracted text and source indicator
    """
    # Minimum length threshold for valid claims section
    MIN_LENGTH = 50

    # Pattern 1: Standard Korean format with 【brackets】
    # Example: 【청구범위】...【발명의 설명】or【요약】
    pattern = r"【청구범위】(.*?)【(?:발명의\s*설명|요\s*약)】"
    match = re.search(pattern, text, re.DOTALL)
    if match and len(match.group(1).strip()) > MIN_LENGTH:
        return ClaimsResult(text=match.group(1).strip(), source="claims")

    # Pattern 2: Whitespace-tolerant Korean format
    # Example: "청 구 범 위" or "청구범위" (with/without spaces)
    pattern = r"청\s*구\s*범\s*위(.*?)(?:발명의\s*설명|요\s*약)"
    match = re.search(pattern, text, re.DOTALL)
    if match and len(match.group(1).strip()) > MIN_LENGTH:
        return ClaimsResult(text=match.group(1).strip(), source="claims")

    # Pattern 3: Numbered claims format
    # Example: "청구항 1. ..." captures from first claim to end of section
    pattern = r"(청구항\s*1[.\s].*?)(?:발명의\s*(?:상세한\s*)?설명|$)"
    match = re.search(pattern, text, re.DOTALL)
    if match and len(match.group(1).strip()) > MIN_LENGTH:
        return ClaimsResult(text=match.group(1).strip(), source="claims")

    # Pattern 4: English patent format
    # Example: "Claims...Description" or "Claims...Abstract"
    pattern = r"Claims(.*?)(?:Description|Abstract)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match and len(match.group(1).strip()) > MIN_LENGTH:
        return ClaimsResult(text=match.group(1).strip(), source="claims")

    # Pattern 5: Alternative Korean format "특허청구범위"
    # Example: "특허청구범위..." captures to end of section or document
    pattern = r"특허청구범위(.*?)(?:발명의\s*(?:상세한\s*)?설명|$)"
    match = re.search(pattern, text, re.DOTALL)
    if match and len(match.group(1).strip()) > MIN_LENGTH:
        return ClaimsResult(text=match.group(1).strip(), source="claims")

    # Fallback: Return full document with source indicator
    return ClaimsResult(text=text, source="full_doc")
