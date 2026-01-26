"""Noise removal service for patent filtering.

4-step pipeline:
1. Duplicate removal (by application_number)
2. IPC code filtering (include/exclude patterns with wildcard)
3. Keyword matching (OR logic, case-insensitive, partial match)
4. Embedding filtering (optional, reuses sna_filter.py)
"""

import fnmatch
import re
from dataclasses import dataclass, field

from kipris.models import FreeSearchResult

from app.schemas.noise_removal import (
    ExcludedPatent,
    ExcludedSummary,
    NoiseRemovalConfig,
    NoiseRemovalResult,
)

from .embedding import EmbeddingService
from .sna_filter import filter_patents_by_similarity


@dataclass
class StepResult:
    """Result of a single filtering step."""

    kept: list[FreeSearchResult] = field(default_factory=list)
    excluded: list[ExcludedPatent] = field(default_factory=list)


class NoiseRemovalService:
    """Service for removing noise from patent search results.

    Implements a 4-step filtering pipeline:
    1. Duplicate removal (by application_number)
    2. IPC code filtering
    3. Keyword matching (flexible OR logic)
    4. Embedding similarity filtering (optional)
    """

    def __init__(self, embedding_service: EmbeddingService | None = None) -> None:
        """Initialize the noise removal service.

        Args:
            embedding_service: Optional embedding service for step 4.
                              Required only if use_embedding_filter=True.
        """
        self.embedding_service = embedding_service

    async def process(
        self,
        patents: list[FreeSearchResult],
        config: NoiseRemovalConfig,
    ) -> tuple[NoiseRemovalResult, list[ExcludedPatent]]:
        """Process patents through the 4-step noise removal pipeline.

        Args:
            patents: List of patents to filter
            config: Filtering configuration

        Returns:
            Tuple of (NoiseRemovalResult, list of excluded patents)
        """
        input_count = len(patents)
        all_excluded: list[ExcludedPatent] = []
        current_patents = patents

        # Step 1: Remove duplicates by application_number
        step1_result = self.step1_remove_duplicates(current_patents)
        current_patents = step1_result.kept
        all_excluded.extend(step1_result.excluded)
        step1_count = len(current_patents)

        # Step 2: Filter by IPC codes
        step2_result = self.step2_filter_by_ipc(current_patents, config)
        current_patents = step2_result.kept
        all_excluded.extend(step2_result.excluded)
        step2_count = len(current_patents)

        # Step 3: Filter by keywords
        step3_result = self.step3_filter_by_keywords(current_patents, config)
        current_patents = step3_result.kept
        all_excluded.extend(step3_result.excluded)
        step3_count = len(current_patents)

        # Step 4: Embedding filtering (optional)
        step4_count: int | None = None
        if config.use_embedding_filter and self.embedding_service is not None:
            step4_result = await self.step4_filter_by_embedding(current_patents, config)
            current_patents = step4_result.kept
            all_excluded.extend(step4_result.excluded)
            step4_count = len(current_patents)

        # Build summary
        excluded_summary = self._build_excluded_summary(all_excluded)

        result = NoiseRemovalResult(
            input_count=input_count,
            step1_count=step1_count,
            step2_count=step2_count,
            step3_count=step3_count,
            step4_count=step4_count,
            final_count=len(current_patents),
            valid_patents=current_patents,
            excluded_summary=excluded_summary,
        )

        return result, all_excluded

    def step1_remove_duplicates(self, patents: list[FreeSearchResult]) -> StepResult:
        """Remove duplicate patents by application_number.

        Args:
            patents: List of patents to deduplicate

        Returns:
            StepResult with kept and excluded patents
        """
        seen: set[str] = set()
        kept: list[FreeSearchResult] = []
        excluded: list[ExcludedPatent] = []

        for patent in patents:
            app_num = patent.application_number
            if app_num is None:
                # Keep patents without application_number (edge case)
                kept.append(patent)
                continue

            if app_num in seen:
                excluded.append(
                    ExcludedPatent(
                        patent=patent,
                        excluded_at_step=1,
                        reason="duplicate",
                        detail=f"Duplicate of application_number: {app_num}",
                    )
                )
            else:
                seen.add(app_num)
                kept.append(patent)

        return StepResult(kept=kept, excluded=excluded)

    def step2_filter_by_ipc(
        self, patents: list[FreeSearchResult], config: NoiseRemovalConfig
    ) -> StepResult:
        """Filter patents by IPC code patterns.

        Uses wildcard matching (fnmatch style):
        - G06F* matches G06F001, G06F003/041, etc.
        - E04* matches E04B, E04C, etc.

        Args:
            patents: List of patents to filter
            config: Configuration with include_ipc and exclude_ipc patterns

        Returns:
            StepResult with kept and excluded patents
        """
        kept: list[FreeSearchResult] = []
        excluded: list[ExcludedPatent] = []

        for patent in patents:
            ipc = patent.ipc_number or ""
            # Normalize IPC: remove spaces, convert to uppercase
            ipc_normalized = ipc.replace(" ", "").upper()

            # Check exclude patterns first
            exclude_match = self._match_ipc_patterns(ipc_normalized, config.exclude_ipc)
            if exclude_match:
                excluded.append(
                    ExcludedPatent(
                        patent=patent,
                        excluded_at_step=2,
                        reason="ipc_excluded",
                        detail=f"Matched exclude pattern: {exclude_match}",
                    )
                )
                continue

            # Check include patterns (if specified)
            if config.include_ipc:
                include_match = self._match_ipc_patterns(
                    ipc_normalized, config.include_ipc
                )
                if not include_match:
                    excluded.append(
                        ExcludedPatent(
                            patent=patent,
                            excluded_at_step=2,
                            reason="ipc_not_included",
                            detail=f"IPC '{ipc}' did not match any include pattern",
                        )
                    )
                    continue

            kept.append(patent)

        return StepResult(kept=kept, excluded=excluded)

    def _match_ipc_patterns(self, ipc: str, patterns: list[str]) -> str | None:
        """Check if IPC matches any pattern.

        Args:
            ipc: Normalized IPC code
            patterns: List of patterns with optional wildcards

        Returns:
            Matched pattern or None
        """
        for pattern in patterns:
            # Normalize pattern
            pattern_normalized = pattern.replace(" ", "").replace("-", "").upper()
            ipc_clean = ipc.replace("-", "")

            # Convert to fnmatch pattern (replace * with *)
            if fnmatch.fnmatch(ipc_clean, pattern_normalized):
                return pattern

            # Also try prefix match for patterns without *
            if not pattern_normalized.endswith("*"):
                if ipc_clean.startswith(pattern_normalized):
                    return pattern

        return None

    def step3_filter_by_keywords(
        self, patents: list[FreeSearchResult], config: NoiseRemovalConfig
    ) -> StepResult:
        """Filter patents by keyword matching.

        Uses flexible OR logic:
        - Patent is KEPT if ANY required keyword is found (case-insensitive, partial match)
        - Patent is EXCLUDED if ANY exclude keyword is found

        Args:
            patents: List of patents to filter
            config: Configuration with required_keywords and exclude_keywords

        Returns:
            StepResult with kept and excluded patents
        """
        kept: list[FreeSearchResult] = []
        excluded: list[ExcludedPatent] = []

        for patent in patents:
            # Build searchable text from title and abstract
            text = self._build_searchable_text(patent)
            text_lower = text.lower()

            # Check exclude keywords first
            exclude_match = self._find_keyword_match(
                text_lower, config.exclude_keywords
            )
            if exclude_match:
                excluded.append(
                    ExcludedPatent(
                        patent=patent,
                        excluded_at_step=3,
                        reason="keyword_excluded",
                        detail=f"Matched exclude keyword: '{exclude_match}'",
                    )
                )
                continue

            # Check required keywords (OR logic - any match keeps)
            if config.required_keywords:
                required_match = self._find_keyword_match(
                    text_lower, config.required_keywords
                )
                if not required_match:
                    excluded.append(
                        ExcludedPatent(
                            patent=patent,
                            excluded_at_step=3,
                            reason="keyword_missing",
                            detail="No required keyword found in title/abstract",
                        )
                    )
                    continue

            kept.append(patent)

        return StepResult(kept=kept, excluded=excluded)

    def _build_searchable_text(self, patent: FreeSearchResult) -> str:
        """Build searchable text from patent fields."""
        parts: list[str] = []
        if patent.invention_name:
            parts.append(patent.invention_name)
        if patent.abstract:
            parts.append(patent.abstract)
        return " ".join(parts)

    def _find_keyword_match(self, text: str, keywords: list[str]) -> str | None:
        """Find first matching keyword in text.

        Uses case-insensitive partial matching.

        Args:
            text: Text to search (should be lowercase)
            keywords: List of keywords to match

        Returns:
            First matched keyword or None
        """
        for keyword in keywords:
            keyword_lower = keyword.lower()
            # Use word boundary matching for more precision
            # But also allow partial matches for compound words
            pattern = re.escape(keyword_lower)
            if re.search(pattern, text):
                return keyword
        return None

    async def step4_filter_by_embedding(
        self, patents: list[FreeSearchResult], config: NoiseRemovalConfig
    ) -> StepResult:
        """Filter patents by embedding similarity.

        Uses the existing filter_patents_by_similarity from sna_filter.py.

        Args:
            patents: List of patents to filter
            config: Configuration with embedding settings

        Returns:
            StepResult with kept and excluded patents
        """
        if self.embedding_service is None:
            # No embedding service, keep all
            return StepResult(kept=patents, excluded=[])

        # Use embedding_query or fall back to main_category
        query = config.embedding_query or config.main_category

        # Use existing filter function
        filtered_results = await filter_patents_by_similarity(
            query=query,
            results=patents,
            embedding_service=self.embedding_service,
            min_similarity=config.embedding_threshold,
        )

        # Convert to kept/excluded using object identity (id) to handle None/duplicate app_numbers
        kept_ids = {id(fr.result) for fr in filtered_results}
        kept: list[FreeSearchResult] = [fr.result for fr in filtered_results]
        excluded: list[ExcludedPatent] = []

        for patent in patents:
            if id(patent) not in kept_ids:
                excluded.append(
                    ExcludedPatent(
                        patent=patent,
                        excluded_at_step=4,
                        reason="low_similarity",
                        detail=f"Below embedding threshold {config.embedding_threshold}",
                    )
                )

        return StepResult(kept=kept, excluded=excluded)

    def _build_excluded_summary(
        self, excluded: list[ExcludedPatent]
    ) -> ExcludedSummary:
        """Build summary of excluded patents by reason."""
        summary = ExcludedSummary()

        for ex in excluded:
            if ex.reason == "duplicate":
                summary.duplicate += 1
            elif ex.reason == "ipc_excluded":
                summary.ipc_excluded += 1
            elif ex.reason == "ipc_not_included":
                summary.ipc_not_included += 1
            elif ex.reason == "keyword_missing":
                summary.keyword_missing += 1
            elif ex.reason == "keyword_excluded":
                summary.keyword_excluded += 1
            elif ex.reason == "low_similarity":
                summary.low_similarity += 1

        return summary
