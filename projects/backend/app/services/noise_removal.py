"""Noise removal service for patent filtering.

2-step pipeline:
1. Duplicate removal (by application_number)
2. Embedding similarity filtering (batch processing)
"""

import numpy as np
from dataclasses import dataclass, field

from kipris.models import FreeSearchResult

from app.schemas.noise_removal import (
    ExcludedPatent,
    ExcludedSummary,
    NoiseRemovalConfig,
    NoiseRemovalResult,
)

from .embedding import EmbeddingService


@dataclass
class PatentWithScore:
    """Patent with its similarity score."""

    patent: FreeSearchResult
    score: float


class NoiseRemovalService:
    """Service for removing noise from patent search results.

    Implements a 2-step filtering pipeline:
    1. Duplicate removal (by application_number)
    2. Embedding similarity filtering (batch cosine similarity)
    """

    def __init__(self, embedding_service: EmbeddingService) -> None:
        """Initialize the noise removal service.

        Args:
            embedding_service: Required embedding service for similarity filtering.
        """
        self.embedding_service = embedding_service

    async def process(
        self,
        patents: list[FreeSearchResult],
        config: NoiseRemovalConfig,
    ) -> tuple[NoiseRemovalResult, list[ExcludedPatent]]:
        """Process patents through the 2-step noise removal pipeline.

        Args:
            patents: List of patents to filter
            config: Filtering configuration with embedding_query and threshold

        Returns:
            Tuple of (NoiseRemovalResult, list of excluded patents)
        """
        input_count = len(patents)
        all_excluded: list[ExcludedPatent] = []

        # Step 1: Remove duplicates
        deduplicated, dup_excluded = self._remove_duplicates(patents)
        all_excluded.extend(dup_excluded)
        after_dedup_count = len(deduplicated)

        # Step 2: Embedding similarity filtering
        if deduplicated:
            filtered, sim_excluded = await self._filter_by_embedding(
                deduplicated, config.embedding_query, config.embedding_threshold
            )
            all_excluded.extend(sim_excluded)
        else:
            filtered = []

        # Build summary
        excluded_summary = ExcludedSummary(
            duplicate=len(dup_excluded),
            low_similarity=len(
                [e for e in all_excluded if e.reason == "low_similarity"]
            ),
        )

        result = NoiseRemovalResult(
            input_count=input_count,
            after_dedup_count=after_dedup_count,
            final_count=len(filtered),
            valid_patents=filtered,
            excluded_summary=excluded_summary,
        )

        return result, all_excluded

    def _remove_duplicates(
        self, patents: list[FreeSearchResult]
    ) -> tuple[list[FreeSearchResult], list[ExcludedPatent]]:
        """Remove duplicate patents by application_number.

        Args:
            patents: List of patents to deduplicate

        Returns:
            Tuple of (deduplicated patents, excluded patents)
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
                    )
                )
            else:
                seen.add(app_num)
                kept.append(patent)

        return kept, excluded

    async def _filter_by_embedding(
        self,
        patents: list[FreeSearchResult],
        query: str,
        threshold: float,
    ) -> tuple[list[FreeSearchResult], list[ExcludedPatent]]:
        """Filter patents by embedding similarity.

        Batch processes all patents for efficiency:
        1. Embed query text
        2. Embed all patent texts in batch
        3. Compute cosine similarity
        4. Filter by threshold

        Args:
            patents: List of patents to filter
            query: Query text (user's technology description)
            threshold: Minimum cosine similarity (0.0-1.0)

        Returns:
            Tuple of (filtered patents, excluded patents)
        """
        # Build patent texts
        patent_texts = [self._build_patent_text(p) for p in patents]

        # Batch embed: query + all patents
        all_texts = [query] + patent_texts
        embeddings = await self.embedding_service.embed_batch(all_texts)

        # Split embeddings
        query_embedding = np.array(embeddings[0])
        patent_embeddings = np.array(embeddings[1:])

        # Compute cosine similarities
        similarities = self._cosine_similarity_batch(query_embedding, patent_embeddings)

        # Filter by threshold
        kept: list[FreeSearchResult] = []
        excluded: list[ExcludedPatent] = []

        # Log similarity distribution for debugging
        import logging

        logger = logging.getLogger(__name__)
        logger.info(
            f"Embedding similarities - min: {similarities.min():.3f}, max: {similarities.max():.3f}, mean: {similarities.mean():.3f}, threshold: {threshold}"
        )

        for patent, score in zip(patents, similarities):
            if score >= threshold:
                kept.append(patent)
            else:
                excluded.append(
                    ExcludedPatent(
                        patent=patent,
                        excluded_at_step=2,
                        reason="low_similarity",
                        similarity_score=float(score),
                    )
                )

        logger.info(
            f"Embedding filter: {len(patents)} -> {len(kept)} (excluded {len(excluded)})"
        )

        return kept, excluded

    def _build_patent_text(self, patent: FreeSearchResult) -> str:
        """Build text from patent for embedding."""
        parts: list[str] = []
        if patent.invention_name:
            parts.append(patent.invention_name)
        if patent.abstract:
            parts.append(patent.abstract)
        return " ".join(parts) if parts else "empty"

    def _cosine_similarity_batch(
        self, query_vec: np.ndarray, doc_vecs: np.ndarray
    ) -> np.ndarray:
        """Compute cosine similarity between query and all documents.

        Args:
            query_vec: Query embedding (1D array)
            doc_vecs: Document embeddings (2D array, one row per doc)

        Returns:
            Array of similarity scores
        """
        # Normalize vectors
        query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-10)
        doc_norms = doc_vecs / (np.linalg.norm(doc_vecs, axis=1, keepdims=True) + 1e-10)

        # Dot product = cosine similarity for normalized vectors
        return np.dot(doc_norms, query_norm)
