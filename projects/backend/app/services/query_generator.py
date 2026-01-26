from pydantic import BaseModel, Field
from pydantic_ai import Agent, ModelRetry, RunContext

MULTI_QUERY_SYSTEM_PROMPT = """
<goal>
특허 명세서에서 **다양한 관점**의 검색 쿼리를 생성합니다.
여러 검색을 병합하여 최대한 많은 유사 특허를 찾기 위함입니다.
</goal>

<constraint>
KIPRIS는 AND 검색입니다. 키워드가 많을수록 결과가 줄어듭니다.
- 각 쿼리는 1-2개 키워드만 사용
- 단일 개념어 선호
</constraint>

<query_perspectives>
1. **core**: 발명의 가장 핵심적인 기술 개념 (예: "자율주행", "NFT")
2. **domain**: 기술이 속하는 상위 분야 (예: "인공지능", "블록체인")
3. **method**: 핵심 방법/동작 (예: "객체인식", "암호화")
4. **application**: 주요 적용 대상 (예: "차량", "거래소")
</query_perspectives>

<rules>
- 최소 3개, 최대 5개 쿼리 생성
- 각 쿼리는 서로 다른 관점에서 접근
- 중복되는 검색 결과가 나올 수 있도록 오히려 의도적으로 겹치는 키워드 사용 가능
- IPC는 확실할 때만, 대분류만 (예: G06Q, H01M)
- 쿼리 간 다양성 확보가 핵심
</rules>

<examples>
입력: "NFT의 환불을 위해 스마트계약을 사용하여 소유권을 번복하는 방법"
출력:
[
  {"word": "NFT 환불", "ipc_number": null, "perspective": "core"},
  {"word": "블록체인 거래", "ipc_number": "G06Q", "perspective": "domain"},
  {"word": "스마트계약", "ipc_number": null, "perspective": "method"},
  {"word": "디지털자산 소유권", "ipc_number": null, "perspective": "application"}
]

입력: "자율주행 차량의 라이다 센서를 이용한 보행자 인식 알고리즘"
출력:
[
  {"word": "자율주행 보행자", "ipc_number": "B60W", "perspective": "core"},
  {"word": "라이다 인식", "ipc_number": "G01S", "perspective": "method"},
  {"word": "차량 센서", "ipc_number": null, "perspective": "domain"},
  {"word": "객체 감지", "ipc_number": "G06V", "perspective": "application"}
]
</examples>
"""


class KIPRISSearchQuery(BaseModel):
    """KIPRIS search query structure"""

    word: str = Field(description="핵심 검색 키워드 (필수)")
    ipc_number: str | None = Field(None, description="IPC 분류 코드 (선택)")
    perspective: str | None = Field(
        None, description="쿼리 관점 (core/domain/method/application)"
    )


class KIPRISMultiQuery(BaseModel):
    """Multiple KIPRIS search queries for broader coverage"""

    queries: list[KIPRISSearchQuery] = Field(description="검색 쿼리 목록 (3-5개)")


class _MultiQueryAgentSingleton:
    _instance: Agent[None, KIPRISMultiQuery] | None = None

    @classmethod
    def get(cls) -> Agent[None, KIPRISMultiQuery]:
        if cls._instance is None:
            cls._instance = cls._create()
        return cls._instance

    @classmethod
    def _create(cls) -> Agent[None, KIPRISMultiQuery]:
        from app.services.llm_factory import get_model

        model = get_model()
        agent = Agent(
            model=model,
            output_type=KIPRISMultiQuery,
            system_prompt=MULTI_QUERY_SYSTEM_PROMPT,
        )

        @agent.output_validator
        async def validate_queries(
            ctx: RunContext[None], result: KIPRISMultiQuery
        ) -> KIPRISMultiQuery:
            if len(result.queries) < 3:
                raise ModelRetry(
                    "최소 3개의 검색 쿼리가 필요합니다. 다양한 관점에서 쿼리를 생성하세요."
                )
            if len(result.queries) > 5:
                result.queries = result.queries[:5]
            for query in result.queries:
                if len(query.word) < 2:
                    raise ModelRetry(
                        f"검색어 '{query.word}'가 너무 짧습니다. 핵심 기술 용어를 사용하세요."
                    )
            return result

        return agent


multi_query_agent = _MultiQueryAgentSingleton.get


async def generate_search_queries(text: str) -> list[KIPRISSearchQuery]:
    """
    Generate multiple KIPRIS search queries from patent text.

    Uses different perspectives (core, domain, method, application)
    to maximize recall by running multiple searches.

    Args:
        text: Patent document text or technical description

    Returns:
        List of KIPRISSearchQuery (3-5 queries)
    """
    agent = multi_query_agent()
    result = await agent.run(text)
    return result.output.queries


async def generate_search_query(text: str) -> KIPRISSearchQuery:
    """
    Generate single KIPRIS search query from patent text.

    DEPRECATED: Use generate_search_queries() for better coverage.

    Args:
        text: Patent document text or technical description

    Returns:
        KIPRISSearchQuery with optimized search keywords
    """
    queries = await generate_search_queries(text)
    return (
        queries[0]
        if queries
        else KIPRISSearchQuery(word="", ipc_number=None, perspective=None)
    )
