"""
API dependencies for authentication and rate limiting.
"""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import APIKeyHeader
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import Settings

logger = logging.getLogger(__name__)

# Rate limiter instance
limiter = Limiter(key_func=get_remote_address)

# API Key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_settings() -> Settings:
    """Get application settings."""
    return Settings()


def verify_api_key(
    api_key: Annotated[str | None, Security(api_key_header)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> bool:
    """
    Verify API key for protected endpoints.

    If API_KEY is not configured in settings, all requests are allowed.
    This enables development without auth while requiring it in production.
    """
    # If no API key is configured, allow all requests (dev mode)
    if not settings.api_key:
        return True

    # If API key is configured, require it
    if not api_key:
        logger.warning("Missing API key in request")
        raise HTTPException(
            status_code=401,
            detail="API 키가 필요합니다",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    if api_key != settings.api_key:
        logger.warning("Invalid API key provided")
        raise HTTPException(
            status_code=403,
            detail="유효하지 않은 API 키입니다",
        )

    return True


# Type alias for dependency injection
RequireAPIKey = Annotated[bool, Depends(verify_api_key)]
