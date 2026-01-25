"""LDA topic modeling API schemas for patent analysis."""

from pydantic import BaseModel, Field


class LDARequest(BaseModel):
    """Request model for LDA topic modeling analysis."""

    patents: list[dict[str, str]] = Field(
        ...,
        min_length=10,
        description="List of patents with 'id' and 'text' (title + abstract) fields",
    )
    num_topics: int | str = Field(
        default="auto",
        description="Number of topics to extract. Use 'auto' for automatic selection or integer (2-50)",
    )
    min_df: int = Field(
        default=2,
        ge=1,
        description="Minimum document frequency for term inclusion",
    )
    max_df: float = Field(
        default=0.4,
        gt=0.0,
        le=1.0,
        description="Maximum document frequency ratio for term exclusion (filters common words)",
    )


class TopicCoordinate(BaseModel):
    """2D coordinate for topic visualization (PCA projection)."""

    x: float = Field(..., description="PC1 coordinate")
    y: float = Field(..., description="PC2 coordinate")


class Topic(BaseModel):
    """Single topic from LDA analysis."""

    id: int = Field(
        ...,
        description="Topic ID (0-indexed)",
    )
    keywords: list[str] = Field(
        ...,
        description="Top keywords representing this topic",
    )
    keyword_weights: list[float] = Field(
        default_factory=list,
        description="Weight/probability for each keyword (same order as keywords)",
    )
    weight: float = Field(
        ...,
        description="Topic weight/importance in the corpus",
    )
    coordinate: TopicCoordinate | None = Field(
        default=None,
        description="2D PCA coordinate for visualization",
    )
    label: str = Field(
        default="",
        description="Auto-generated topic label from top keywords",
    )


class DocumentTopic(BaseModel):
    """Patent-to-topic assignment result."""

    patent_id: str = Field(
        ...,
        description="Patent application number or ID",
    )
    topic_id: int = Field(
        ...,
        description="Dominant topic ID assigned to this patent",
    )
    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Probability of this patent belonging to the assigned topic",
    )
    topic_distribution: list[float] = Field(
        default_factory=list,
        description="Full topic distribution for this document",
    )


class LDAResponse(BaseModel):
    """Response model for LDA topic modeling results."""

    topics: list[Topic] = Field(
        ...,
        description="Extracted topics with keywords",
    )
    documents: list[DocumentTopic] = Field(
        ...,
        description="Patent-to-topic assignments",
    )
    coherence_score: float = Field(
        ...,
        description="Topic coherence score (higher is better, typically 0.3-0.7)",
    )
    num_topics: int = Field(
        ...,
        description="Number of topics used in the model",
    )
    vocabulary_size: int = Field(
        ...,
        description="Number of unique terms in the vocabulary",
    )
