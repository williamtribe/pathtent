# syntax=docker/dockerfile:1
FROM python:3.13-slim-bookworm

WORKDIR /app

# System dependencies for:
# - gensim/scikit-learn: BLAS/LAPACK for numerical computation
# - pymupdf: PDF processing
# - asyncpg: PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first (better layer caching)
# Note: Railway builds from repo root, so use full path
COPY projects/backend/pyproject.toml projects/backend/uv.lock ./

# Install dependencies (no dev dependencies for production)
RUN uv sync --frozen --no-dev

# Copy application code
COPY projects/backend/app ./app
COPY projects/backend/kipris ./kipris
COPY projects/backend/alembic ./alembic
COPY projects/backend/alembic.ini ./

# Copy data files (IPC embeddings)
COPY projects/backend/data ./data

# Expose port (Railway uses $PORT)
EXPOSE 8080

# Run the application with Railway's PORT
CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
