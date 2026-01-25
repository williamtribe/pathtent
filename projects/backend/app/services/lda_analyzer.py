# @TODO-6 — Create LDA topic modeling service with Korean tokenization
"""LDA topic modeling service for patent analysis."""

import asyncio
import re

from gensim import corpora
from gensim.models import CoherenceModel, LdaModel
from kiwipiepy import Kiwi

from app.schemas.lda import DocumentTopic, LDARequest, LDAResponse, Topic

# Korean language stopwords for patent text filtering
# These are common Korean particles, auxiliary verbs, and patent-specific terms
# that add noise to topic modeling results
KOREAN_PATENT_STOPWORDS: set[str] = {
    # Common Korean auxiliary verbs and particles
    "\uc788\ub2e4",  # "itda" (to exist/have)
    "\ud558\ub2e4",  # "hada" (to do)
    "\ub418\ub2e4",  # "doeda" (to become)
    "\uc774\ub2e4",  # "ida" (to be)
    "\uac83",  # "geot" (thing)
    "\uc218",  # "su" (ability/number)
    "\ub4f1",  # "deung" (etc.)
    "\ubc0f",  # "mit" (and)
    "\ub610\ub294",  # "ttoneun" (or)
    # Patent-specific common terms
    "\uc0c1\uae30",  # "sanggi" (the above)
    "\ubcf8",  # "bon" (this/present)
    "\ubc1c\uba85",  # "balmyeong" (invention)
    "\ub530\ub978",  # "ttareun" (according to)
    "\ud1b5\ud574",  # "tonghae" (through)
    "\uc704\ud574",  # "wihae" (for)
    "\ub300\ud55c",  # "daehan" (about/regarding)
    "\uc758\ud55c",  # "uihan" (by means of)
    "\uad6c\uc131",  # "guseong" (composition)
    "\ud3ec\ud568",  # "poham" (including)
    "\uc81c\uacf5",  # "jegong" (providing)
    "\ubc29\ubc95",  # "bangbeop" (method)
    "\uc7a5\uce58",  # "jangchi" (device)
    "\uc2dc\uc2a4\ud15c",  # "siseutem" (system)
    "\uae30\uc220",  # "gisul" (technology)
    # Verb endings
    "\ud558\ub294",  # "haneun" (doing)
    "\ub418\ub294",  # "doeneun" (becoming)
    "\uc788\ub294",  # "inneun" (existing)
    "\uc5c6\ub294",  # "eomneun" (not existing)
    "\uac19\uc740",  # "gateun" (same)
    "\ub2e4\ub978",  # "dareun" (different)
    "\uc774\ub7ec\ud55c",  # "irehan" (such)
}


class LDAAnalyzer:
    """
    LDA topic modeling service for Korean patent texts.

    Uses kiwipiepy for Korean morphological analysis and gensim for LDA.
    Supports automatic topic number selection via coherence optimization.
    """

    def __init__(self) -> None:
        """Initialize LDA analyzer with Korean tokenizer and semaphore."""
        self._kiwi = Kiwi()
        self._stopwords = KOREAN_PATENT_STOPWORDS
        self._semaphore = asyncio.Semaphore(
            1
        )  # Single LDA model at a time (CPU-intensive)

    def _tokenize(self, text: str) -> list[str]:
        """
        Tokenize Korean text using kiwipiepy.

        Extracts nouns and verbs, filters stopwords and short tokens.

        Args:
            text: Korean text to tokenize

        Returns:
            List of tokens (morphemes)
        """
        # Remove special characters but keep Korean/English/numbers
        text = re.sub(r"[^\w\s가-힣a-zA-Z0-9]", " ", text)

        tokens: list[str] = []
        result = self._kiwi.tokenize(text)

        for token in result:
            word = token.form
            tag = token.tag

            # Extract nouns (NN*) and verb stems (VV)
            if tag.startswith("NN") or tag.startswith("VV"):
                # Filter stopwords and short tokens
                if word not in self._stopwords and len(word) > 1:
                    tokens.append(word)

        return tokens

    def _prepare_corpus(
        self,
        documents: list[dict[str, str]],
        min_df: int = 2,
        max_df: float = 0.95,
    ) -> tuple[list[list[str]], corpora.Dictionary, list[list[tuple[int, int]]]]:
        """
        Prepare corpus for LDA training.

        Args:
            documents: List of documents with 'id' and 'text' fields
            min_df: Minimum document frequency for term inclusion
            max_df: Maximum document frequency ratio for term exclusion

        Returns:
            Tuple of (tokenized_docs, dictionary, corpus)
        """
        # Tokenize all documents
        tokenized_docs = [self._tokenize(doc["text"]) for doc in documents]

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

            # Extract topics with keywords
            topics: list[Topic] = []
            for topic_id in range(num_topics):
                # Get top 10 words for this topic
                topic_terms = model.show_topic(topic_id, topn=10)
                keywords = [word for word, _ in topic_terms]
                weight = sum(prob for _, prob in topic_terms)

                topics.append(
                    Topic(
                        id=topic_id,
                        keywords=keywords,
                        weight=weight,
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
                        patent_id=doc["id"],
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
