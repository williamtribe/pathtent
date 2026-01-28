# Backend - Patent Similarity Search API

FastAPI-based backend for PATHTENT, providing semantic patent search using embeddings and vector similarity.

## Quick Start

### Prerequisites

- **Python**: 3.13+
- **UV**: Package manager (install from https://docs.astral.sh/uv/getting-started/)
- **Docker**: For PostgreSQL, Qdrant, and local infrastructure
- **API Keys**: 
  - `GOOGLE_API_KEY` - Google Gemini API
  - `KIPRIS_SERVICE_KEY` - KIPRIS Open API

### Setup (5 minutes)

```bash
# 1. Install dependencies
uv sync

# 2. Start infrastructure (PostgreSQL, Qdrant)
docker compose up -d

# 3. Create database and run migrations
uv run alembic upgrade head

# 4. Generate IPC embeddings (one-time, ~2 minutes)
export GOOGLE_API_KEY=your_google_api_key
uv run python scripts/build_ipc_embeddings.py

# 5. Upload IPC embeddings to Qdrant
uv run python scripts/upload_ipc_to_qdrant.py

# 6. Start API server (in one terminal)
uv run uvicorn app.main:app --reload

# 7. Start background worker (in another terminal)
uv run python -m app.run_worker
```

**Result**: API ready at http://localhost:8000

## Project Structure

```
projects/backend/
├── app/
│   ├── main.py                    # FastAPI app entrypoint
│   ├── config.py                  # Environment configuration
│   ├── database.py                # SQLAlchemy async engine
│   ├── models.py                  # ORM models
│   ├── repository.py              # Database queries
│   ├── worker.py                  # pgqueuer job handlers
│   │
│   ├── api/
│   │   ├── routes.py              # API endpoints
│   │   ├── schemas.py             # Request/response schemas
│   │   └── deps.py                # FastAPI dependencies
│   │
│   └── services/
│       ├── query_generator.py     # LLM-powered query generation
│       ├── kipris_service.py      # KIPRIS API client
│       ├── pdf_extractor.py       # PDF text extraction
│       ├── claims_parser.py       # Patent claims parsing
│       ├── embedding.py           # Gemini embedding service
│       └── vector_db/
│           ├── base.py            # Vector DB protocol
│           ├── factory.py         # Factory pattern
│           ├── pinecone.py        # Pinecone implementation
│           └── qdrant.py          # Qdrant implementation
│
├── scripts/
│   ├── build_ipc_embeddings.py   # Generate IPC embeddings (768-dim)
│   ├── upload_ipc_to_qdrant.py   # Upload embeddings to Qdrant
│
├── alembic/                       # Database migrations
├── tests/                         # Test suites
├── docker-compose.yml             # Local infrastructure
└── pyproject.toml                 # UV project config
```

## Environment Variables

Create a `.env` file in `projects/backend/`:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/pathtent

# KIPRIS API
KIPRIS_SERVICE_KEY=your_kipris_api_key

# Google AI / Gemini
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_EMBEDDING_MODEL=models/embedding-001

# Vector Database
VECTOR_DB_MODE=qdrant              # or "pinecone"
VECTOR_DB_DIMENSION=768

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=                    # Optional, for Qdrant Cloud
QDRANT_COLLECTION_NAME=pathtent
QDRANT_IPC_COLLECTION_NAME=ipc_codes

# Pinecone Configuration (if VECTOR_DB_MODE=pinecone)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=pathtent

# Application
DEBUG=false
LOG_LEVEL=INFO
```

## Key Features

### 1. Semantic Patent Search

- **Query Generation**: AI converts natural language to optimized KIPRIS search queries
- **Patent Retrieval**: Fetches from KIPRIS, parallel processing for efficiency
- **Embeddings**: Converts patent claims to 768-dimensional vectors
- **Similarity**: Finds patents with >0.7 similarity score

### 2. IPC Code Search

- **768-dimensional embeddings**: Standardized, L2-normalized vectors
- **Qdrant vector DB**: Fast semantic search via HNSW index
- **Separate collection**: `ipc_codes` collection for IPC-specific searches
- **Two-stage setup**: Generate embeddings, then upload to Qdrant

### 3. Background Job Processing

- **pgqueuer**: PostgreSQL-based distributed job queue
- **3-stage pipeline**:
  1. `search_patents` - Query KIPRIS, create patent jobs
  2. `process_patent` (parallel) - Extract claims, embed, store vectors
  3. `similarity_analysis` - Calculate final similarity scores
- **Auto-scaling**: Jobs run in parallel, tracked with JobGroup

## IPC Embeddings Setup

### Understanding the Process

1. **Build Phase** (`build_ipc_embeddings.py`):
   - Loads IPC code reference data
   - Generates 768-dimensional embeddings using Gemini
   - Applies L2 normalization (required for reduced dimensions)
   - Saves to `data/ipc_embeddings.npz`

2. **Upload Phase** (`upload_ipc_to_qdrant.py`):
   - Creates `ipc_codes` collection in Qdrant
   - Uploads embeddings with HNSW indexing
   - Configures L2 distance metric

### One-Time Setup

```bash
# Generate embeddings (requires GOOGLE_API_KEY)
uv run python scripts/build_ipc_embeddings.py

# Upload to Qdrant
uv run python scripts/upload_ipc_to_qdrant.py

# Verify collections
curl http://localhost:6333/collections
```

### Vector Collections Reference

| Collection | Purpose | Dimensions | Use Case |
|-----------|---------|-----------|----------|
| `pathtent` | Patent similarity search | 768 | Find similar patents by claims |
| `ipc_codes` | IPC semantic search | 768 | Search/match IPC codes |

## Running Tests

### Unit Tests (Fast, Mocked)

```bash
uv run pytest tests/unit/ -v
```

### Integration Tests (Requires Docker)

```bash
docker compose up -d
uv run pytest tests/integration/ -v
```

### E2E Tests (Real APIs, Slow)

```bash
uv run pytest tests/e2e/ -v --run-integration
```

### Single Test

```bash
uv run pytest -k "test_name" -v
uv run pytest tests/path/file.py -v
```

## Development Commands

### Code Quality

```bash
# Linting
uv run ruff check .
uv run ruff check . --fix

# Type checking
uv run basedpyright

# Format check (auto-fix with)
uv run ruff format .
```

### Database

```bash
# Run migrations
uv run alembic upgrade head

# Create new migration (auto)
uv run alembic revision --autogenerate -m "description"

# Rollback one migration
uv run alembic downgrade -1
```

### Running the Application

```bash
# Start API server (auto-reload)
uv run uvicorn app.main:app --reload

# Start background worker
uv run python -m app.run_worker

# Both in parallel (recommended)
# Terminal 1:
uv run uvicorn app.main:app --reload

# Terminal 2:
uv run python -m app.run_worker
```

### Infrastructure

```bash
# Start containers (PostgreSQL, Qdrant)
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down

# Full reset (caution!)
docker compose down -v
```

## API Endpoints

### Health Check

```bash
GET /health
```

### Search Configuration

```bash
POST /api/v1/search/configure
Body: { "text": "AI-powered patent search system" }
Response: { "search_query": { "word": "...", "ipc_number": "..." } }
```

### Request Patent Search

```bash
POST /api/v1/search/request
Body: { 
  "search_query": "AI patent search",
  "original_text": "Full patent description"
}
Response: { "search_id": "uuid" }
```

### Get Search Results

```bash
GET /api/v1/search/{search_id}
Response: { 
  "status": "completed",
  "results": [...],
  "progress": { "current": 10, "total": 10 }
}
```

## Troubleshooting

### Qdrant Connection Issues

```bash
# Check if Qdrant is running
curl http://localhost:6333/health

# View container logs
docker compose logs qdrant

# Restart Qdrant
docker compose restart qdrant
```

### Missing IPC Embeddings

```bash
# Check if collection exists
curl http://localhost:6333/collections/ipc_codes

# Regenerate and upload
uv run python scripts/build_ipc_embeddings.py
uv run python scripts/upload_ipc_to_qdrant.py
```

### API Key Issues

```bash
# Verify GOOGLE_API_KEY is set
echo $GOOGLE_API_KEY

# Verify KIPRIS_SERVICE_KEY is set
echo $KIPRIS_SERVICE_KEY

# Re-run with explicit env vars
GOOGLE_API_KEY=your_key uv run python scripts/build_ipc_embeddings.py
```

### Database Migration Fails

```bash
# Check current migration state
uv run alembic current

# View migration history
uv run alembic history

# Downgrade and retry
uv run alembic downgrade -1
uv run alembic upgrade head
```

## Architecture

For detailed system architecture, data flow, and component diagrams, see:

- `docs/ARCHITECTURE.md` - Complete system design
- `../chrome-extension/README.md` - Browser extension
- `../frontend-landing/README.md` - Frontend application

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | FastAPI 0.128+, Uvicorn, Pydantic 2.12+ |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 async, Alembic |
| **Job Queue** | pgqueuer (PostgreSQL-based) |
| **AI/ML** | Pydantic AI, Google Gemini 3 Flash, Gemini embedding-001 |
| **Vector DB** | Qdrant (local/cloud), Pinecone (optional) |
| **PDF Processing** | PyMuPDF |
| **HTTP Client** | httpx (async) |
| **Testing** | pytest, pytest-asyncio, testcontainers |

## Performance Notes

- **Embedding Generation**: ~0.5-1.5s per document (Gemini API)
- **Vector Search**: <100ms (Qdrant with HNSW index)
- **Patent Processing**: Parallel with pgqueuer workers
- **IPC Setup**: ~2-5 minutes (depends on embedding count)

## Contributing

1. Follow code style in `../../AGENTS.md`
2. Write tests for new features
3. Run `uv run ruff check . --fix && uv run basedpyright` before commit

## License

TBD
