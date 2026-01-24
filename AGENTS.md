# AGENTS.md

Monorepo: `frontend-landing` (Next.js), `backend` (FastAPI), `chrome-extension` (WXT).

## Commands

### Frontend (`projects/frontend-landing`)

```bash
npm run dev                    # Dev server :3000
npm run build                  # Production build
npm run lint                   # ESLint
npm run lint:fix               # Auto-fix lint
npm run format                 # Prettier format
npm run type-check             # TypeScript check

# E2E Tests
npm run test:e2e               # Run all
npm run test:e2e:headed        # With browser
npx playwright test -g "pattern"   # Single test by name
npx playwright test path/file.ts   # Single test file
```

### Backend (`projects/backend`)

```bash
uv sync                        # Install deps
uv run uvicorn app.main:app --reload   # API server :8000
uv run python -m app.run_worker        # Background worker

# Database
uv run alembic upgrade head    # Run migrations
uv run alembic revision --autogenerate -m "msg"  # New migration

# Tests
uv run pytest tests/ -v                    # All tests
uv run pytest tests/unit/ -v               # Unit only
uv run pytest tests/integration/ -v --run-integration  # Integration
uv run pytest -k "test_name" -v            # Single test by name
uv run pytest tests/path/file.py -v        # Single test file

# Linting
uv run ruff check .            # Lint
uv run ruff check . --fix      # Auto-fix
uv run basedpyright            # Type check
```

### Chrome Extension (`projects/chrome-extension`)

```bash
npm run dev                    # Dev mode
npm run build                  # Build
npm run zip                    # Distributable zip
```

## Code Style

### TypeScript (Frontend)

- **Strict mode**: No `any`, no `@ts-ignore`
- **Imports**: Use `import type { X }` for types
- **Unused vars**: Prefix with `_` (e.g., `_unused`)
- **Formatting**: 2 spaces, no semicolons, double quotes, 100 char lines
- **Files**: kebab-case (`user-card.tsx`)
- **Components**: PascalCase (`UserCard`)
- **Functions/vars**: camelCase (`getUserData`)
- **Booleans**: `is`, `has`, `can`, `should` prefix
- **Console**: `console.log` warns (use `warn`/`error` only)
- **React**: Self-closing tags, no unnecessary braces

### Python (Backend)

- **Python 3.13+** required
- **Type hints**: Required on all functions
- **Formatter**: Ruff (line-length 100)
- **Imports**: stdlib → third-party → local
- **Naming**: snake_case for functions/vars, PascalCase for classes
- **Async**: Use `async/await` for I/O operations
- **Error handling**: Explicit exceptions, no bare `except:`

### Tailwind CSS

- Class ordering auto-sorted by prettier-plugin-tailwindcss
- Prefer Tailwind classes over inline styles

## Testing

### Frontend E2E (Playwright)

- Location: `projects/frontend-landing/e2e/**/*.spec.ts`
- Base URL: `http://127.0.0.1:3000`
- Retries: 2 in CI, 0 locally
- Pattern: Test user workflows, not implementation

### Backend (pytest)

- Location: `projects/backend/tests/`
- Unit: `tests/unit/` - no external deps
- Integration: `tests/integration/` - requires `--run-integration` flag
- E2E: `tests/e2e/` - full pipeline tests
- Fixtures: Use `db_session` for database tests (auto-rollback)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16, React 19, TypeScript 5.9, Tailwind 4 |
| Backend | FastAPI, Python 3.13+, Pydantic 2, SQLAlchemy 2 |
| Extension | WXT 0.20, React 19 |
| Database | PostgreSQL 16, pgqueuer |
| AI | Google Gemini, Pydantic AI |
| Vector DB | Qdrant (local) / Pinecone (cloud) |
| Testing | Playwright, pytest |

## Pre-commit Checklist

```bash
# Frontend
cd projects/frontend-landing
npm run type-check && npm run lint && npm run format

# Backend
cd projects/backend
uv run ruff check . && uv run basedpyright && uv run pytest tests/unit/ -v
```
