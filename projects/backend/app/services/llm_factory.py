"""LLM Factory for multi-provider support.

Supports Google (Gemini), Anthropic (Claude), and OpenAI (GPT) models.
Provider selection via LLM_PROVIDER environment variable.
"""

from __future__ import annotations

from typing import Any

from app.config import Settings

settings = Settings()


def get_model() -> Any:
    """Get LLM model based on configured provider.

    Returns:
        pydantic_ai Model instance for the configured provider.

    Raises:
        ValueError: If provider is not supported or API key is missing.
    """
    provider = settings.llm_provider

    match provider:
        case "google":
            return _get_google_model()
        case "anthropic":
            return _get_anthropic_model()
        case "openai":
            return _get_openai_model()
        case _:
            raise ValueError(f"Unsupported LLM provider: {provider}")


def _get_google_model() -> Any:
    """Get Google Gemini model."""
    from pydantic_ai.models.google import GoogleModel
    from pydantic_ai.providers.google import GoogleProvider

    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY is required for Google provider")

    provider = GoogleProvider(api_key=settings.google_api_key)
    return GoogleModel(settings.gemini_model, provider=provider)


def _get_anthropic_model() -> Any:
    """Get Anthropic Claude model."""
    from pydantic_ai.models.anthropic import AnthropicModel
    from pydantic_ai.providers.anthropic import AnthropicProvider

    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY is required for Anthropic provider")

    provider = AnthropicProvider(api_key=settings.anthropic_api_key)
    return AnthropicModel(settings.anthropic_model, provider=provider)


def _get_openai_model() -> Any:
    """Get OpenAI GPT model."""
    from pydantic_ai.models.openai import OpenAIChatModel
    from pydantic_ai.providers.openai import OpenAIProvider

    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required for OpenAI provider")

    provider = OpenAIProvider(api_key=settings.openai_api_key)
    return OpenAIChatModel(settings.openai_model, provider=provider)
