"""LDA topic modeling service for patent analysis."""

import asyncio
import re
from pathlib import Path

import numpy as np
from gensim import corpora
from gensim.models import CoherenceModel, LdaModel
from scipy.spatial.distance import jensenshannon
from sklearn.manifold import MDS

from app.schemas.lda import (
    DocumentTopic,
    LDARequest,
    LDAResponse,
    PatentForLDA,
    Topic,
    TopicCoordinate,
)


def _get_patent_text(patent: PatentForLDA | dict[str, str]) -> str:
    """Extract text from patent (handles both dict and PatentForLDA)."""
    if isinstance(patent, dict):
        if "text" not in patent:
            raise ValueError("Patent dict missing required 'text' field")
        return patent["text"]
    return patent.text


def _get_patent_id(patent: PatentForLDA | dict[str, str]) -> str:
    """Extract id from patent (handles both dict and PatentForLDA)."""
    if isinstance(patent, dict):
        if "id" not in patent:
            raise ValueError("Patent dict missing required 'id' field")
        return patent["id"]
    return patent.id


# Path to stopwords file (Korean language stopwords loaded at runtime)
STOPWORDS_FILE = Path(__file__).parent.parent / "data" / "korean_stopwords.txt"

# Minimal patent-specific stopwords (common function words in patent claims)
# TODO: Remove when KorPatBERT + MeCab morphological analysis is implemented
PATENT_STOPWORDS = {
    "포함하는",
    "이용한",
    "위한",
    "관한",
    "의한",
    "통한",
    "따른",
    "구비하는",
    "형성된",
    "구성된",
    "제공하는",
    "갖는",
    "가지는",
    "이루어진",
    "되어있는",
    "있는",
    "없는",
    "하는",
    "되는",
    "복수의",
    "하나의",
    "상기",
    "본",
    "그",
    "이",
    "저",
}


def _load_stopwords() -> set[str]:
    """Load Korean stopwords from external file + patent-specific stopwords."""
    stopwords: set[str] = set(PATENT_STOPWORDS)
    if STOPWORDS_FILE.exists():
        with STOPWORDS_FILE.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    stopwords.add(line)
    return stopwords


class LDAAnalyzer:
    """
    LDA topic modeling service for Korean patent texts.

    Uses regex-based tokenization (temporary) and gensim for LDA.
    Supports automatic topic number selection via coherence optimization.

    TODO: Replace with KorPatBERT tokenizer for better quality.
    """

    def __init__(self) -> None:
        """Initialize LDA analyzer with stopwords and semaphore."""
        self._stopwords = _load_stopwords()
        self._semaphore = asyncio.Semaphore(
            1
        )  # Single LDA model at a time (CPU-intensive)

    def _tokenize(self, text: str) -> list[str]:
        """
        Tokenize Korean text using regex (temporary solution).

        Extracts Korean words with 2+ characters, filters stopwords.

        TODO: Replace with KorPatBERT/MeCab for proper morphological analysis.

        Args:
            text: Korean text to tokenize

        Returns:
            List of tokens
        """
        # Extract Korean words (2+ chars) and English words
        korean_tokens = re.findall(r"[가-힣]{2,}", text)
        english_tokens = re.findall(r"[a-zA-Z]{3,}", text.lower())

        # Filter stopwords
        tokens = [t for t in korean_tokens + english_tokens if t not in self._stopwords]

        return tokens

    def _prepare_corpus(
        self,
        documents: list[PatentForLDA | dict[str, str]],
        min_df: int = 2,
        max_df: float = 0.95,
    ) -> tuple[list[list[str]], corpora.Dictionary, list[list[tuple[int, int]]]]:
        """
        Prepare corpus for LDA training.

        Args:
            documents: List of patents (PatentForLDA or dict with 'id' and 'text')
            min_df: Minimum document frequency for term inclusion
            max_df: Maximum document frequency ratio for term exclusion

        Returns:
            Tuple of (tokenized_docs, dictionary, corpus)
        """
        # Tokenize all documents (handle both dict and PatentForLDA)
        tokenized_docs = [self._tokenize(_get_patent_text(doc)) for doc in documents]

        # Create dictionary
        dictionary = corpora.Dictionary(tokenized_docs)

        # Filter extremes
        num_docs = len(tokenized_docs)
        dictionary.filter_extremes(
            no_below=min_df,
            no_above=max_df,
            keep_n=None,
        )

        # Create bag-of-words corpus
        corpus = [dictionary.doc2bow(doc) for doc in tokenized_docs]

        return tokenized_docs, dictionary, corpus

    def _find_optimal_topics(
        self,
        tokenized_docs: list[list[str]],
        dictionary: corpora.Dictionary,
        corpus: list[list[tuple[int, int]]],
        min_topics: int = 3,
        max_topics: int = 15,
    ) -> int:
        """
        Find optimal number of topics using coherence score.

        Args:
            tokenized_docs: Tokenized documents
            dictionary: Gensim dictionary
            corpus: Bag-of-words corpus
            min_topics: Minimum number of topics to try
            max_topics: Maximum number of topics to try

        Returns:
            Optimal number of topics
        """
        best_coherence = -1.0
        best_num_topics = min_topics

        for num_topics in range(min_topics, max_topics + 1):
            model = LdaModel(
                corpus=corpus,
                id2word=dictionary,
                num_topics=num_topics,
                random_state=42,
                passes=5,
                alpha="auto",
                eta="auto",
            )

            coherence_model = CoherenceModel(
                model=model,
                texts=tokenized_docs,
                dictionary=dictionary,
                coherence="c_v",
            )
            coherence = coherence_model.get_coherence()

            if coherence > best_coherence:
                best_coherence = coherence
                best_num_topics = num_topics

        return best_num_topics

    async def analyze(self, request: LDARequest) -> LDAResponse:
        """
        Perform LDA topic modeling on patent texts.

        Args:
            request: LDA request with patents and parameters

        Returns:
            LDAResponse with topics and document assignments

        Raises:
            ValueError: If corpus is empty after preprocessing
        """
        async with self._semaphore:
            # Prepare corpus
            tokenized_docs, dictionary, corpus = self._prepare_corpus(
                request.patents,
                min_df=request.min_df,
                max_df=request.max_df,
            )

            # Guard against empty corpus
            if len(dictionary) == 0 or all(len(doc) == 0 for doc in corpus):
                raise ValueError(
                    "Corpus is empty after preprocessing. "
                    "Try lowering min_df or providing more documents."
                )

            # Determine number of topics
            if request.num_topics == "auto":
                num_topics = self._find_optimal_topics(
                    tokenized_docs, dictionary, corpus
                )
            else:
                num_topics = int(request.num_topics)
                num_topics = max(2, min(50, num_topics))  # Clamp to valid range

            # Train LDA model
            model = LdaModel(
                corpus=corpus,
                id2word=dictionary,
                num_topics=num_topics,
                random_state=42,
                passes=10,
                alpha="auto",
                eta="auto",
            )

            # Calculate coherence score
            coherence_model = CoherenceModel(
                model=model,
                texts=tokenized_docs,
                dictionary=dictionary,
                coherence="c_v",
            )
            coherence_score = coherence_model.get_coherence()

            # Extract topic-word distribution matrix
            topic_word_matrix = model.get_topics()  # shape: (num_topics, vocab_size)

            # Compute 2D coordinates using Jensen-Shannon Divergence + MDS
            # This is the same method used by pyLDAvis
            if num_topics >= 2:
                # Compute pairwise Jensen-Shannon divergence matrix
                n_topics = topic_word_matrix.shape[0]
                js_distances = np.zeros((n_topics, n_topics))
                for i in range(n_topics):
                    for j in range(i + 1, n_topics):
                        # Jensen-Shannon divergence (symmetric, bounded 0-1)
                        js_dist = jensenshannon(
                            topic_word_matrix[i], topic_word_matrix[j]
                        )
                        js_distances[i, j] = js_dist
                        js_distances[j, i] = js_dist

                # Apply MDS to project to 2D while preserving distances
                mds = MDS(
                    n_components=2,
                    dissimilarity="precomputed",
                    random_state=42,
                    normalized_stress="auto",
                )
                topic_coords_2d = mds.fit_transform(js_distances)
                # MDS output is centered at origin - keep it that way for truthful viz
            else:
                topic_coords_2d = np.array([[0.0, 0.0]])

            # Extract topics with keywords, coordinates, and labels
            topics: list[Topic] = []
            for topic_id in range(num_topics):
                # Get top 10 words for this topic with their probabilities
                topic_terms = model.show_topic(topic_id, topn=10)
                keywords = [word for word, _ in topic_terms]
                keyword_weights = [float(prob) for _, prob in topic_terms]
                weight = sum(keyword_weights)

                # Create coordinate from MDS projection (preserves JS divergence distances)
                coord = TopicCoordinate(
                    x=float(topic_coords_2d[topic_id, 0]),
                    y=float(topic_coords_2d[topic_id, 1]),
                )

                # Generate label from top 3 keywords
                label = ", ".join(keywords[:3])

                topics.append(
                    Topic(
                        id=topic_id,
                        keywords=keywords,
                        keyword_weights=keyword_weights,
                        weight=weight,
                        coordinate=coord,
                        label=label,
                    )
                )

            # Assign documents to topics
            documents: list[DocumentTopic] = []
            for i, (doc, bow) in enumerate(zip(request.patents, corpus)):
                topic_dist = model.get_document_topics(bow, minimum_probability=0.0)
                topic_probs = [0.0] * num_topics
                for tid, prob in topic_dist:
                    topic_probs[tid] = prob

                # Find dominant topic
                dominant_topic = max(
                    range(len(topic_probs)), key=lambda x: topic_probs[x]
                )
                dominant_prob = topic_probs[dominant_topic]

                documents.append(
                    DocumentTopic(
                        patent_id=_get_patent_id(doc),
                        topic_id=dominant_topic,
                        probability=dominant_prob,
                        topic_distribution=topic_probs,
                    )
                )

            return LDAResponse(
                topics=topics,
                documents=documents,
                coherence_score=coherence_score,
                num_topics=num_topics,
                vocabulary_size=len(dictionary),
            )


async def analyze_lda(request: LDARequest) -> LDAResponse:
    """
    Convenience function for LDA analysis.

    Args:
        request: LDA request with patents and parameters

    Returns:
        LDAResponse with topics and document assignments
    """
    analyzer = LDAAnalyzer()
    return await analyzer.analyze(request)
