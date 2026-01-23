"""SNA 유사도 필터링 서비스

검색어와 특허 초록의 유사도를 계산하여 노이즈를 필터링합니다.
"""

from dataclasses import dataclass

import numpy as np

from kipris.models import FreeSearchResult

from .embedding import EmbeddingService


@dataclass
class FilteredResult:
    """필터링된 특허 결과와 유사도 점수"""

    result: FreeSearchResult
    similarity_score: float


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """두 벡터 간의 코사인 유사도 계산"""
    a = np.array(vec1)
    b = np.array(vec2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def build_patent_text(result: FreeSearchResult) -> str:
    """발명명칭 + 초록을 결합하여 임베딩용 텍스트 생성"""
    title = result.invention_name or ""
    abstract = result.abstract or ""

    if title and abstract:
        return f"제목: {title}\n내용: {abstract}"
    elif title:
        return title
    elif abstract:
        return abstract
    else:
        return ""


async def filter_patents_by_similarity(
    query: str,
    results: list[FreeSearchResult],
    embedding_service: EmbeddingService,
    min_similarity: float = 0.7,
) -> list[FilteredResult]:
    """
    검색어와 특허들의 유사도를 계산하여 필터링합니다.

    Args:
        query: 검색 키워드
        results: KIPRIS 검색 결과 리스트
        embedding_service: 임베딩 서비스
        min_similarity: 최소 유사도 임계값 (기본값: 0.7)

    Returns:
        유사도가 임계값 이상인 특허들 (유사도 점수 포함)
    """
    if not results:
        return []

    # 1. 검색어 임베딩
    query_embedding = await embedding_service.embed(query)

    # 2. 특허 텍스트 생성 (발명명칭 + 초록)
    patent_texts = [build_patent_text(r) for r in results]

    # 텍스트가 없는 특허는 제외
    valid_indices = [i for i, text in enumerate(patent_texts) if text.strip()]
    valid_texts = [patent_texts[i] for i in valid_indices]

    if not valid_texts:
        return []

    # 3. 특허들 배치 임베딩
    patent_embeddings = await embedding_service.embed_batch(valid_texts)

    # 4. 유사도 계산 및 필터링
    if len(patent_embeddings) != len(valid_indices):
        raise ValueError(
            f"임베딩 수({len(patent_embeddings)})와 입력 수({len(valid_indices)}) 불일치"
        )

    filtered_results: list[FilteredResult] = []

    for idx, embedding in zip(valid_indices, patent_embeddings):
        similarity = cosine_similarity(query_embedding, embedding)

        if similarity >= min_similarity:
            filtered_results.append(
                FilteredResult(result=results[idx], similarity_score=similarity)
            )

    # 5. 유사도 내림차순 정렬
    filtered_results.sort(key=lambda x: x.similarity_score, reverse=True)

    return filtered_results
