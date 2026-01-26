"""
Rule-based KIPRIS search formula builder.

Constructs valid KIPRIS search formulas from structured data,
ensuring syntax correctness without relying on LLM generation.
"""

from dataclasses import dataclass
from enum import Enum


class SearchField(Enum):
    """KIPRIS searchable field codes."""

    TITLE = "TI"  # 발명의 명칭
    ABSTRACT = "AB"  # 요약
    CLAIMS = "CL"  # 청구범위
    DESCRIPTION = "DS"  # 명세서
    ALL = "CT"  # 일괄검색 (Title+Abstract+Claims+Spec)
    MAIN_IPC = "MIPC"  # 국제분류 (Main IPC)
    IPC = "IPC"  # IPC 코드 (all)


class PrecisionLevel(Enum):
    """Formula precision level affects operator choices."""

    HIGH = "high"  # Fewer results, more AND, tighter NEAR
    BALANCED = "balanced"  # Default balance
    RECALL = "recall"  # More results, more OR, looser NEAR


@dataclass
class FormulaComponents:
    """Structured input for formula building."""

    keywords: list[str]
    synonyms: dict[str, list[str]]
    excluded_terms: list[str]
    ipc_codes: list[str]
    precision: PrecisionLevel = PrecisionLevel.BALANCED
    search_fields: list[SearchField] | None = None


class FormulaBuilder:
    """
    Rule-based KIPRIS search formula builder.

    Converts structured keyword data into valid KIPRIS syntax.
    Follows expert patent attorney patterns:
    - Group synonyms with OR (+)
    - Connect concept groups with AND (*)
    - Append exclusions with NOT (!)
    - Add IPC codes with MIPC:()

    Example output:
        ((전기차+EV+전기자동차)*(배터리+축전지+이차전지))*!(가전+스마트폰)*MIPC:(B60L+H01M)
    """

    # KIPRIS operators
    AND = "*"
    OR = "+"
    NOT = "!"
    NEAR_TEMPLATE = "^{n}"

    @classmethod
    def build(
        cls,
        keywords: list[str],
        synonyms: dict[str, list[str]],
        excluded_terms: list[str] | None = None,
        ipc_codes: list[str] | None = None,
        precision: PrecisionLevel = PrecisionLevel.BALANCED,
        search_fields: list[SearchField] | None = None,
    ) -> str:
        """
        Build a KIPRIS search formula from structured components.

        Args:
            keywords: Core technical keywords (3-5 recommended)
            synonyms: Mapping of keywords to their synonyms
            excluded_terms: Terms to exclude with NOT operator
            ipc_codes: IPC classification codes (e.g., ["B60L", "H01M"])
            precision: Precision level (high/balanced/recall)
            search_fields: Fields to search (default: TI + AB)

        Returns:
            Valid KIPRIS search formula string

        Example:
            >>> FormulaBuilder.build(
            ...     keywords=["전기차", "배터리", "냉각"],
            ...     synonyms={
            ...         "전기차": ["EV", "전기자동차", "electric vehicle"],
            ...         "배터리": ["축전지", "이차전지", "battery"],
            ...         "냉각": ["방열", "cooling", "thermal management"],
            ...     },
            ...     excluded_terms=["가전", "스마트폰"],
            ...     ipc_codes=["B60L", "H01M"],
            ... )
            '((전기차+EV+전기자동차+electric vehicle)*(배터리+축전지+이차전지+battery)*(냉각+방열+cooling+thermal management))*!(가전+스마트폰)*MIPC:(B60L+H01M)'
        """
        if not keywords:
            raise ValueError("At least one keyword is required")

        # Set default search fields
        if search_fields is None:
            search_fields = [SearchField.TITLE, SearchField.ABSTRACT]

        # Build keyword groups (each keyword + its synonyms)
        keyword_groups = cls._build_keyword_groups(keywords, synonyms, precision)

        # Combine keyword groups with AND
        keyword_section = cls._combine_groups(keyword_groups, precision)

        # Add field restriction if not searching all fields
        if SearchField.ALL not in search_fields:
            keyword_section = cls._add_field_restriction(keyword_section, search_fields)

        # Add exclusions (KIPRIS requires AND NOT: *!)
        if excluded_terms:
            exclusion_section = cls._build_exclusion_section(excluded_terms)
            formula = f"({keyword_section}){cls.AND}{cls.NOT}{exclusion_section}"
        else:
            formula = keyword_section

        # Add IPC codes
        if ipc_codes:
            ipc_section = cls._build_ipc_section(ipc_codes)
            formula = f"({formula}){cls.AND}{ipc_section}"

        return formula

    @classmethod
    def build_from_components(cls, components: FormulaComponents) -> str:
        """Build formula from FormulaComponents dataclass."""
        return cls.build(
            keywords=components.keywords,
            synonyms=components.synonyms,
            excluded_terms=components.excluded_terms,
            ipc_codes=components.ipc_codes,
            precision=components.precision,
            search_fields=components.search_fields,
        )

    @classmethod
    def build_from_blocks(
        cls,
        blocks: list[dict],
        block_operators: list[str],
        ipc_codes: list[str] | None = None,
        excluded_terms: list[str] | None = None,
    ) -> str:
        """
        Build a KIPRIS freeSearchInfo formula from category-based blocks.

        Each block represents a technical category with keywords and IPC codes.
        Uses KIPRIS freeSearchInfo syntax: TAC:(...) AND IPC:(...)

        Args:
            blocks: List of block dicts with keys: id, name, field, keywords, operator, ipc_codes
            block_operators: Operators between blocks (AND/OR). Length = len(blocks) - 1
            ipc_codes: Optional global IPC codes (fallback if blocks don't have ipc_codes)
            excluded_terms: Optional terms to exclude with NOT

        Returns:
            Valid KIPRIS freeSearchInfo formula string

        Example:
            >>> blocks = [
            ...     {"id": "b1", "name": "Touch Sensor", "field": "TAC", "keywords": ["터치*", "touchscreen*"], "operator": "OR", "ipc_codes": ["G06F-003*"]},
            ...     {"id": "b2", "name": "Fingerprint", "field": "TAC", "keywords": ["지문*", "fingerprint*"], "operator": "OR", "ipc_codes": ["G06V-040*"]},
            ... ]
            >>> FormulaBuilder.build_from_blocks(blocks, ["AND"])
            '(TAC:(터치* touchscreen*) AND IPC:(G06F-003*)) AND (TAC:(지문* fingerprint*) AND IPC:(G06V-040*))'
        """
        if not blocks:
            raise ValueError("At least one block is required")

        # Find valid blocks and track their original indices
        valid_indices = [i for i, b in enumerate(blocks) if b.get("keywords")]
        if not valid_indices:
            raise ValueError("At least one block with keywords is required")

        # Handle flexible block_operators length
        # When enabled blocks are filtered, operators may be shorter
        expected_op_count = len(blocks) - 1
        if len(block_operators) > expected_op_count:
            block_operators = block_operators[:expected_op_count]

        # Extract operators between consecutive valid blocks
        active_operators: list[str] = []
        for i in range(len(valid_indices) - 1):
            op_idx = valid_indices[i]
            if op_idx < len(block_operators):
                active_operators.append(block_operators[op_idx])
            else:
                active_operators.append("AND")  # Default fallback

        # Build each block's formula part
        block_formulas: list[str] = []
        for idx in valid_indices:
            block = blocks[idx]
            keywords = block.get("keywords", [])
            field = block.get("field", "TAC")
            block_ipc_codes = block.get("ipc_codes", [])

            # Build keyword part: space-separated (KIPRIS implicit OR)
            escaped_keywords = [cls._escape_term(k) for k in keywords]
            keyword_part = " ".join(escaped_keywords)

            # Build block formula: TAC:(keywords) AND IPC:(codes)
            # Use TAC for combined Title+Abstract+Claims search
            if field == "TAC" or field == "TI" or field == "AB":
                block_formula = f"TAC:({keyword_part})"
            else:
                block_formula = f"{field}:({keyword_part})"

            # Add per-block IPC codes if available
            if block_ipc_codes:
                cleaned_ipc = [cls._clean_ipc_code(c) for c in block_ipc_codes]
                ipc_part = " ".join(cleaned_ipc)
                block_formula = f"({block_formula} AND IPC:({ipc_part}))"

            block_formulas.append(block_formula)

        if not block_formulas:
            raise ValueError("No valid blocks with keywords found")

        # Combine blocks with operators
        formula = block_formulas[0]
        for i, op in enumerate(active_operators):
            kipris_op = " AND " if op.upper() == "AND" else " OR "
            formula = f"({formula}){kipris_op}{block_formulas[i + 1]}"

        # Add exclusions with NOT
        if excluded_terms:
            escaped_terms = [cls._escape_term(t) for t in excluded_terms]
            exclusion_section = " ".join(escaped_terms)
            if len(escaped_terms) > 1:
                exclusion_section = f"({exclusion_section})"
            formula = f"({formula}) AND NOT {exclusion_section}"

        # Add global IPC codes only if no per-block IPC codes were added
        has_block_ipc = any(b.get("ipc_codes") for b in blocks if b.get("keywords"))
        if ipc_codes and not has_block_ipc:
            cleaned_codes = [cls._clean_ipc_code(c) for c in ipc_codes]
            ipc_section = f"IPC:({' '.join(cleaned_codes)})"
            formula = f"({formula}) AND {ipc_section}"

        return formula

    @classmethod
    def _build_keyword_groups(
        cls,
        keywords: list[str],
        synonyms: dict[str, list[str]],
        precision: PrecisionLevel,
    ) -> list[str]:
        """
        Build OR-grouped keyword+synonym sets.

        Each keyword and its synonyms are grouped: (keyword+syn1+syn2)
        """
        groups = []

        for keyword in keywords:
            # Get synonyms for this keyword
            keyword_synonyms = synonyms.get(keyword, [])

            # Combine keyword with its synonyms
            all_terms = [keyword] + keyword_synonyms

            # Escape special characters and join with OR
            escaped_terms = [cls._escape_term(term) for term in all_terms]
            group = cls.OR.join(escaped_terms)

            # Wrap in parentheses if multiple terms
            if len(escaped_terms) > 1:
                group = f"({group})"

            groups.append(group)

        return groups

    @classmethod
    def _combine_groups(
        cls,
        groups: list[str],
        precision: PrecisionLevel,
    ) -> str:
        """
        Combine keyword groups using AND operator.

        For high precision, uses NEAR operator between related groups.
        """
        if len(groups) == 1:
            return groups[0]

        # Use AND to connect all groups
        return cls.AND.join(groups)

    @classmethod
    def _add_field_restriction(
        cls,
        formula: str,
        fields: list[SearchField],
    ) -> str:
        """
        Add field restrictions to formula.

        Example: TI:(formula) or (TI:(formula)+AB:(formula))
        """
        if len(fields) == 1:
            return f"{fields[0].value}:({formula})"

        # Multiple fields: combine with OR
        field_parts = [f"{field.value}:({formula})" for field in fields]
        return f"({cls.OR.join(field_parts)})"

    @classmethod
    def _build_exclusion_section(cls, excluded_terms: list[str]) -> str:
        """
        Build NOT exclusion section.

        Example: (가전+스마트폰) for excluding multiple terms
        """
        escaped_terms = [cls._escape_term(term) for term in excluded_terms]

        if len(escaped_terms) == 1:
            return escaped_terms[0]

        return f"({cls.OR.join(escaped_terms)})"

    @classmethod
    def _build_ipc_section(cls, ipc_codes: list[str]) -> str:
        """
        Build IPC section with IPC codes for KIPRIS freeSearchInfo.

        Example: IPC:(B60L* H01M*)
        Uses space-separated codes (implicit OR in KIPRIS).
        """
        # Clean IPC codes (remove spaces, standardize format)
        cleaned_codes = [cls._clean_ipc_code(code) for code in ipc_codes]

        # Space-separated for implicit OR in KIPRIS freeSearchInfo
        return f"IPC:({' '.join(cleaned_codes)})"

    @classmethod
    def _escape_term(cls, term: str) -> str:
        """
        Escape special characters in search terms.

        If term contains spaces, wrap in quotes for phrase search.
        """
        term = term.strip()

        # If term contains spaces, it's a phrase - wrap in quotes
        if " " in term:
            return f'"{term}"'

        return term

    @classmethod
    def _clean_ipc_code(cls, code: str) -> str:
        """
        Clean and standardize IPC code format.

        Removes spaces, ensures proper format like "B60L58/00" or "B60L".
        """
        # Remove spaces and standardize
        cleaned = code.replace(" ", "").strip()

        # Remove trailing description if present (e.g., "B60L: Electric...")
        if ":" in cleaned and not cleaned.startswith("MIPC"):
            cleaned = cleaned.split(":")[0]

        return cleaned


class FormulaAdjuster:
    """
    Utility class for adjusting existing formulas based on feedback.

    Provides methods for common adjustments without full regeneration.
    """

    @staticmethod
    def add_exclusions(formula: str, terms: list[str]) -> str:
        """Add NOT exclusions to existing formula (KIPRIS requires AND NOT: *!)."""
        exclusion = FormulaBuilder._build_exclusion_section(terms)
        return f"({formula}){FormulaBuilder.AND}{FormulaBuilder.NOT}{exclusion}"

    @staticmethod
    def add_synonyms_to_group(
        formula: str, keyword: str, new_synonyms: list[str]
    ) -> str:
        """
        Add synonyms to an existing keyword group in formula.

        This is a simple text replacement - for complex cases, rebuild the formula.
        """
        # Find the keyword in formula and add synonyms
        for syn in new_synonyms:
            escaped_syn = FormulaBuilder._escape_term(syn)
            # Try to find keyword group and add synonym
            if f"({keyword}" in formula:
                formula = formula.replace(f"({keyword}", f"({keyword}+{escaped_syn}")
            elif keyword in formula:
                # Keyword exists alone, wrap with synonym
                formula = formula.replace(keyword, f"({keyword}+{escaped_syn})")

        return formula

    @staticmethod
    def restrict_to_title_only(formula: str) -> str:
        """Restrict search to title only for higher precision."""
        # Remove existing field restrictions
        import re

        # Pattern to match field restrictions like TI:(...) or AB:(...)
        field_pattern = r"(TI|AB|CL|DS|CT):\("

        if re.search(field_pattern, formula):
            # Already has field restrictions - replace with TI only
            formula = re.sub(r"(AB|CL|DS|CT):\(", "TI:(", formula)
        else:
            # No field restrictions - add TI:
            formula = f"TI:({formula})"

        return formula

    @staticmethod
    def extract_ipc_codes(formula: str) -> list[str]:
        """Extract IPC codes from existing formula."""
        import re

        pattern = r"MIPC:\(([^)]+)\)"
        match = re.search(pattern, formula)

        if match:
            ipc_str = match.group(1)
            return [code.strip() for code in ipc_str.split("+")]

        return []

    @staticmethod
    def remove_ipc_section(formula: str) -> str:
        """Remove IPC section from formula."""
        import re

        # Remove MIPC:(...) and any preceding operator
        pattern = r"\*?MIPC:\([^)]+\)"
        return re.sub(pattern, "", formula).strip("*")
