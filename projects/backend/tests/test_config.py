import os
import sys

import pytest
from pydantic import ValidationError


def test_settings_class__if_has_all_required_fields__returns_field_names() -> None:
    # given
    if "app.config" in sys.modules:
        del sys.modules["app.config"]

    os.environ["KIPRIS_SERVICE_KEY"] = "test-key"
    os.environ["GOOGLE_API_KEY"] = "test-key"
    os.environ["PINECONE_API_KEY"] = "test-key"
    os.environ["PINECONE_INDEX_NAME"] = "test-index"
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"

    from app.config import Settings

    # when
    field_names = set(Settings.model_fields.keys())

    # then
    expected_fields = {
        "kipris_service_key",
        "google_api_key",
        "gemini_model",
        "gemini_embedding_model",
        "pinecone_api_key",
        "pinecone_index_name",
        "pinecone_dimension",
        "database_url",
        "debug",
    }
    assert field_names == expected_fields

    del os.environ["KIPRIS_SERVICE_KEY"]
    del os.environ["GOOGLE_API_KEY"]
    del os.environ["PINECONE_API_KEY"]
    del os.environ["PINECONE_INDEX_NAME"]
    del os.environ["DATABASE_URL"]


def test_settings_class__if_default_values__returns_correct_defaults() -> None:
    # given
    os.environ["KIPRIS_SERVICE_KEY"] = "test-kipris-key"
    os.environ["GOOGLE_API_KEY"] = "test-google-key"
    os.environ["PINECONE_API_KEY"] = "test-pinecone-key"
    os.environ["PINECONE_INDEX_NAME"] = "test-index"
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"

    from app.config import Settings

    # when
    settings = Settings()

    # then
    assert settings.gemini_model == "gemini-3-flash-preview"
    assert settings.gemini_embedding_model == "models/embedding-001"
    assert settings.pinecone_dimension == 768
    assert settings.debug is False

    del os.environ["KIPRIS_SERVICE_KEY"]
    del os.environ["GOOGLE_API_KEY"]
    del os.environ["PINECONE_API_KEY"]
    del os.environ["PINECONE_INDEX_NAME"]
    del os.environ["DATABASE_URL"]


def test_settings_class__if_env_vars_set__returns_settings_instance() -> None:
    # given
    os.environ["KIPRIS_SERVICE_KEY"] = "test-kipris-key"
    os.environ["GOOGLE_API_KEY"] = "test-google-key"
    os.environ["GEMINI_MODEL"] = "gemini-custom-model"
    os.environ["GEMINI_EMBEDDING_MODEL"] = "models/custom-embedding"
    os.environ["PINECONE_API_KEY"] = "test-pinecone-key"
    os.environ["PINECONE_INDEX_NAME"] = "test-index"
    os.environ["PINECONE_DIMENSION"] = "1024"
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"
    os.environ["DEBUG"] = "true"

    from app.config import Settings

    # when
    settings = Settings()

    # then
    assert settings.kipris_service_key == "test-kipris-key"
    assert settings.google_api_key == "test-google-key"
    assert settings.gemini_model == "gemini-custom-model"
    assert settings.gemini_embedding_model == "models/custom-embedding"
    assert settings.pinecone_api_key == "test-pinecone-key"
    assert settings.pinecone_index_name == "test-index"
    assert settings.pinecone_dimension == 1024
    assert settings.database_url == "postgresql+asyncpg://test:test@localhost:5432/test"
    assert settings.debug is True

    del os.environ["KIPRIS_SERVICE_KEY"]
    del os.environ["GOOGLE_API_KEY"]
    del os.environ["GEMINI_MODEL"]
    del os.environ["GEMINI_EMBEDDING_MODEL"]
    del os.environ["PINECONE_API_KEY"]
    del os.environ["PINECONE_INDEX_NAME"]
    del os.environ["PINECONE_DIMENSION"]
    del os.environ["DATABASE_URL"]
    del os.environ["DEBUG"]


def test_settings_class__if_missing_required_field__raises_validation_error() -> None:
    # given
    os.environ.pop("KIPRIS_SERVICE_KEY", None)
    os.environ.pop("GOOGLE_API_KEY", None)
    os.environ.pop("PINECONE_API_KEY", None)
    os.environ.pop("PINECONE_INDEX_NAME", None)
    os.environ.pop("DATABASE_URL", None)

    from app.config import Settings

    # when
    with pytest.raises(ValidationError):
        Settings()
