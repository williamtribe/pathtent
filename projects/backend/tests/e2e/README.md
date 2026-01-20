# E2E Integration Tests

Requires real API keys and running services.

## Setup

1. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

2. Initialize pgqueuer tables:
   ```bash
   export DATABASE_URL=postgresql+asyncpg://pathtent:pathtent@localhost:5432/pathtent
   uv run python init_pgqueuer.py
   ```

3. Set API keys (see local-ignore/resources/api-credentials.md):
   ```bash
   export KIPRIS_SERVICE_KEY=your_key
   export GOOGLE_API_KEY=your_key
   export PINECONE_API_KEY=your_key
   export PINECONE_INDEX_NAME=pathtent
   ```

4. Start worker in separate terminal:
   ```bash
   cd projects/backend
   uv run python -m app.run_worker
   ```

5. Run E2E tests:
   ```bash
   uv run pytest tests/e2e/ -v -s --run-integration
   ```

## Expected Duration
- Full pipeline test: 30-120 seconds
- Depends on KIPRIS search results count
