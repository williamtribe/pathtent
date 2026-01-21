import asyncio
from typing import Any
from uuid import UUID

import pytest
from app.main import app
from app.worker import create_pgqueuer
from httpx import ASGITransport, AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def test_full_search_pipeline() -> None:
    """
    E2E: Complete search flow with real APIs

    Expected Duration: 30-120s (KIPRIS + Gemini + Pinecone)

    Tests:
    - POST /api/v1/search/configure → Search query generation
    - POST /api/v1/search/request → Search creation & job enqueue
    - GET /api/v1/search/{id} → Status polling until completed
    - Results filtered to similarity >= 0.7
    """
    # given - Sample patent text (Korean battery patent)
    sample_text = """
    본 발명은 리튬이온 배터리의 양극재에 관한 것으로,
    니켈-코발트-망간 삼원계 소재의 합성 방법을 개시한다.
    고용량 및 장수명 특성을 가지는 양극 활물질을 제공한다.
    """

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # when - Step 1: Generate search query
        configure_resp = await client.post("/api/v1/search/configure", json={"text": sample_text})

        # then
        assert configure_resp.status_code == 200
        search_query_data = configure_resp.json()
        assert "search_query" in search_query_data
        assert "word" in search_query_data["search_query"]

        # when - Step 2: Submit search request
        request_resp = await client.post(
            "/api/v1/search/request",
            json={
                "search_query": search_query_data["search_query"]["word"],
                "original_text": sample_text,
            },
        )

        # then
        assert request_resp.status_code == 201
        search_id = UUID(request_resp.json()["search_id"])

        # when - Step 3: Poll for results (max 120s)
        data: dict[str, Any] = {}
        for _ in range(24):  # 24 * 5s = 120s
            status_resp = await client.get(f"/api/v1/search/{search_id}")
            assert status_resp.status_code == 200

            data = status_resp.json()
            if data["status"] in ("completed", "failed"):
                break

            await asyncio.sleep(5)

        # then - Verify results
        assert data["status"] == "completed", f"Search failed: {data.get('error')}"
        assert "results" in data

        # Verify similarity filtering
        if data["results"]:  # May be empty if no similar patents
            for result in data["results"]:
                assert result["similarity_score"] >= 0.7, "Results must be >= 0.7"
                assert "application_number" in result
                assert "invention_title" in result
                assert "claims_source" in result


async def test_worker_can_start() -> None:
    """Verify worker starts without crashing (requires env vars)"""

    # This test just verifies worker initialization doesn't crash
    pgq = await create_pgqueuer()
    assert pgq is not None
    # Don't actually run (would block forever)
