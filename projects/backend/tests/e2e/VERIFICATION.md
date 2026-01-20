# System Verification Checklist

Before production deployment:

- [ ] All unit tests pass: `uv run pytest tests/unit/ -v`
- [ ] All integration tests pass: `uv run pytest tests/integration/ -v`
- [ ] E2E test passes: `uv run pytest tests/e2e/ -v --run-integration`
- [ ] Server starts: `uv run uvicorn app.main:app`
- [ ] Health check works: `curl http://localhost:8000/health`
- [ ] OpenAPI docs accessible: http://localhost:8000/docs
- [ ] Worker starts: `uv run python -m app.run_worker`
- [ ] PostgreSQL accessible: `docker compose ps`
- [ ] All LSP diagnostics clean on production code
- [ ] No type errors in codebase
