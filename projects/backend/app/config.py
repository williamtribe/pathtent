from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM Provider 선택: "google" | "anthropic" | "openai"
    llm_provider: Literal["google", "anthropic", "openai"] = "anthropic"

    # Google (Gemini)
    google_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash-exp"
    gemini_embedding_model: str = "gemini-embedding-001"

    # Anthropic (Claude) - Default provider
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-haiku-4-5"

    # OpenAI (GPT)
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o"

    # 선택: KIPRIS API (특허 검색 기능 사용 시)
    kipris_service_key: str | None = None

    # 선택: Database (특허 검색 기능 사용 시)
    database_url: str | None = None

    # 선택: Vector DB (특허 검색 기능 사용 시)
    vector_db_mode: str = "qdrant"
    vector_db_dimension: int = 768
    pinecone_api_key: str | None = None
    pinecone_index_name: str | None = None
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
    qdrant_collection_name: str = "pathtent"

    # 기타
    debug: bool = False

    model_config = {"env_file": ".env"}
