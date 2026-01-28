# PATHTENT - Patent Similarity Search System

> **Version**: 0.1.0  
> **Last Updated**: 2026-01-19  
> **Status**: MVP Complete

## Executive Summary

PATHTENT는 KIPRIS(특허정보검색서비스) API를 활용한 **특허 유사도 검색 시스템**입니다.

사용자가 특허 문서나 기술 설명을 입력하면, 시스템이 자동으로:
1. AI로 최적 검색어 생성
2. KIPRIS에서 관련 특허 검색
3. 특허 PDF에서 청구범위 추출
4. 벡터 임베딩으로 유사도 분석
5. 유사도 0.7 이상 결과만 반환

---

## System Architecture

### High-Level Overview

```mermaid
flowchart TB
    subgraph Client["👤 Client"]
        UI[Web/API Client]
    end
    
    subgraph API["🌐 FastAPI Server"]
        direction TB
        Routes[API Routes]
        Schemas[Pydantic Schemas]
        Deps[Dependencies]
    end
    
    subgraph Worker["⚙️ pgqueuer Worker"]
        direction TB
        SearchJob[search_patents]
        PatentJob[process_patent]
        SimilarityJob[similarity_analysis]
    end
    
    subgraph Services["🔧 Services Layer"]
        direction TB
        QueryGen[Query Generator<br/>Pydantic AI]
        KIPRIS[KIPRIS Service]
        PDFExtract[PDF Extractor<br/>PyMuPDF]
        ClaimsParser[Claims Parser]
        Embedding[Embedding Service<br/>Gemini]
        VectorDB[Vector DB<br/>Pinecone/Qdrant]
    end
    
    subgraph Data["💾 Data Layer"]
        direction TB
        Postgres[(PostgreSQL<br/>+ pgqueuer)]
        Vector[(Vector Store<br/>Qdrant/Pinecone)]
    end
    
    subgraph External["🌍 External APIs"]
        direction TB
        KIPRISApi[KIPRIS Open API]
        GeminiApi[Google Gemini API]
    end
    
    UI --> Routes
    Routes --> Postgres
    Routes --> Worker
    
    SearchJob --> KIPRIS
    SearchJob --> Embedding
    SearchJob --> PatentJob
    
    PatentJob --> KIPRIS
    PatentJob --> PDFExtract
    PDFExtract --> ClaimsParser
    PatentJob --> Embedding
    PatentJob --> VectorDB
    PatentJob --> SimilarityJob
    
    SimilarityJob --> VectorDB
    SimilarityJob --> Postgres
    
    KIPRIS --> KIPRISApi
    Embedding --> GeminiApi
    QueryGen --> GeminiApi
    
    VectorDB --> Vector
```

---

## Component Architecture

### Directory Structure

```
projects/backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entrypoint
│   ├── config.py            # pydantic-settings configuration
│   ├── database.py          # SQLAlchemy async engine
│   ├── models.py            # ORM models (Search, SearchResult, JobGroup)
│   ├── repository.py        # Database access functions
│   ├── worker.py            # pgqueuer job handlers
│   ├── run_worker.py        # Worker execution script
│   │
│   ├── api/
│   │   ├── routes.py        # API endpoints
│   │   ├── schemas.py       # Request/Response schemas
│   │   └── deps.py          # FastAPI dependencies
│   │
│   └── services/
│       ├── query_generator.py    # LLM search query generation
│       ├── kipris_service.py     # KIPRIS API wrapper
│       ├── pdf_extractor.py      # PDF text extraction
│       ├── claims_parser.py      # Claims section parser
│       ├── embedding.py          # Gemini embedding service
│       └── vector_db/
│           ├── base.py           # VectorDBService protocol
│           ├── factory.py        # Factory pattern
│           ├── pinecone.py       # Pinecone implementation
│           └── qdrant.py         # Qdrant implementation
│
├── kipris/                  # KIPRIS API client (standalone)
│   ├── client.py
│   └── models.py
│
├── alembic/                 # Database migrations
└── tests/                   # Test suites
```

---

## Data Flow

### Complete Pipeline Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as FastAPI
    participant DB as PostgreSQL
    participant Q as pgqueuer
    participant W1 as search_patents
    participant W2 as process_patent
    participant W3 as similarity_analysis
    participant K as KIPRIS API
    participant G as Gemini API
    participant V as Vector DB

    %% Step 1: Configure Search
    C->>API: POST /search/configure {text}
    API->>G: Generate search query
    G-->>API: KIPRISSearchQuery
    API-->>C: {search_query: {...}}

    %% Step 2: Request Search
    C->>API: POST /search/request {search_query, original_text}
    API->>DB: Create Search (pending)
    API->>Q: Enqueue search_patents
    API-->>C: {search_id: UUID}

    %% Step 3: Search Job
    Q->>W1: Execute search_patents
    W1->>G: Embed original_text
    G-->>W1: embedding[]
    W1->>DB: Save original_embedding
    W1->>K: Search all pages
    K-->>W1: PatentSearchResult[]
    W1->>DB: Create JobGroup (total=N)
    W1->>DB: Update status → processing
    
    loop For each patent
        W1->>Q: Enqueue process_patent
    end

    %% Step 4: Process Patent Jobs (parallel)
    par Process Patent 1
        Q->>W2: Execute process_patent
        W2->>K: Download PDF
        K-->>W2: PDF binary
        W2->>W2: Extract text (PyMuPDF)
        W2->>W2: Parse claims section
        W2->>G: Embed claims text
        G-->>W2: embedding[]
        W2->>V: get_or_create vector
        W2->>DB: Create SearchResult
        W2->>DB: Increment JobGroup
    and Process Patent 2
        Q->>W2: Execute process_patent
        Note over W2: Same flow...
    and Process Patent N
        Q->>W2: Execute process_patent
        Note over W2: Same flow...
    end

    %% Step 5: All done → Similarity
    W2->>Q: Enqueue similarity_analysis (when all done)

    %% Step 6: Similarity Analysis
    Q->>W3: Execute similarity_analysis
    W3->>DB: Get original_embedding
    W3->>V: Query similar (min_score=0.7)
    V-->>W3: Similar matches[]
    W3->>DB: Update similarity scores
    W3->>DB: Update status → completed

    %% Step 7: Poll Results
    C->>API: GET /search/{search_id}
    API->>DB: Get Search with results
    API-->>C: {status, results[], progress}
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    Search ||--o{ SearchResult : "has many"
    Search ||--o| JobGroup : "has one"
    
    Search {
        UUID id PK
        TEXT original_text
        JSON original_embedding
        VARCHAR search_query
        VARCHAR status
        TEXT error_message
        TIMESTAMP created_at
        TIMESTAMP completed_at
    }
    
    JobGroup {
        UUID id PK
        UUID search_id FK
        INT total_jobs
        INT completed_jobs
        INT failed_jobs
        TIMESTAMP created_at
    }
    
    SearchResult {
        UUID id PK
        UUID search_id FK
        VARCHAR application_number
        VARCHAR invention_title
        TEXT claims_text
        VARCHAR claims_source
        VARCHAR pinecone_vector_id
        FLOAT similarity_score
        TIMESTAMP created_at
    }
```

### Status State Machine

```mermaid
stateDiagram-v2
    [*] --> pending: Create Search
    pending --> processing: Start job processing
    processing --> completed: All patents processed
    processing --> failed: All jobs failed OR error
    completed --> [*]
    failed --> [*]
```

---

## Worker Pipeline Architecture

### 3-Stage Distributed Pipeline

```mermaid
flowchart LR
    subgraph Stage1["Stage 1: Search"]
        S1[search_patents<br/>1 job per search]
    end
    
    subgraph Stage2["Stage 2: Process"]
        P1[process_patent]
        P2[process_patent]
        P3[process_patent]
        PN[process_patent<br/>...N jobs parallel]
    end
    
    subgraph Stage3["Stage 3: Analyze"]
        A1[similarity_analysis<br/>1 job per search]
    end
    
    S1 -->|enqueue N jobs| P1
    S1 -->|enqueue N jobs| P2
    S1 -->|enqueue N jobs| P3
    S1 -->|enqueue N jobs| PN
    
    P1 -->|when all done| A1
    P2 -->|when all done| A1
    P3 -->|when all done| A1
    PN -->|when all done| A1
```

### Job Completion Tracking

```mermaid
flowchart TD
    subgraph JobGroup["JobGroup Tracking"]
        Total[total_jobs = N]
        Completed[completed_jobs]
        Failed[failed_jobs]
    end
    
    ProcessJob{process_patent}
    
    ProcessJob -->|Success| IncrCompleted[completed_jobs++]
    ProcessJob -->|Failure| IncrFailed[failed_jobs++]
    
    IncrCompleted --> Check{completed + failed >= total?}
    IncrFailed --> Check
    
    Check -->|Yes| EnqueueSimilarity[Enqueue similarity_analysis]
    Check -->|No| WaitMore[Wait for other jobs]
```

---

## Service Layer Details

### Services Component Diagram

```mermaid
flowchart TB
    subgraph QueryGeneration["Query Generation"]
        QG[QueryGenerator]
        QG --> |Pydantic AI| Gemini1[Gemini LLM]
    end
    
    subgraph PatentSearch["Patent Search"]
        KS[KIPRISService]
        KS --> |httpx async| KIPRIS[KIPRIS API]
        KS --> |rate limit| Semaphore[asyncio.Semaphore<br/>max 5 concurrent]
    end
    
    subgraph TextProcessing["Text Processing"]
        PDF[PyMuPDFExtractor]
        CP[ClaimsParser]
        PDF --> CP
    end
    
    subgraph Embedding["Embedding"]
        ES[GeminiEmbeddingService]
        ES --> |768 dims| Gemini2[Gemini embedding-001]
        ES --> TT[truncate_to_token_limit<br/>max 2048 tokens]
    end
    
    subgraph VectorStorage["Vector Storage"]
        VDB[VectorDBService<br/>Protocol]
        VDB --> Pine[PineconeVectorDB]
        VDB --> Qdrant[QdrantVectorDB]
    end
```

### Claims Parser Heuristics

```mermaid
flowchart TD
    Input[Patent Text] --> P1{Pattern 1<br/>【청구범위】...【발명의 설명】}
    
    P1 -->|Match| Return1[Return claims]
    P1 -->|No match| P2{Pattern 2<br/>청 구 범 위...발명의 설명}
    
    P2 -->|Match| Return2[Return claims]
    P2 -->|No match| P3{Pattern 3<br/>청구항 1. ...}
    
    P3 -->|Match| Return3[Return claims]
    P3 -->|No match| P4{Pattern 4<br/>Claims...Description}
    
    P4 -->|Match| Return4[Return claims]
    P4 -->|No match| P5{Pattern 5<br/>특허청구범위...}
    
    P5 -->|Match| Return5[Return claims]
    P5 -->|No match| Fallback[Return full_doc]
    
    Return1 --> Result[ClaimsResult<br/>source='claims']
    Return2 --> Result
    Return3 --> Result
    Return4 --> Result
    Return5 --> Result
    Fallback --> ResultFull[ClaimsResult<br/>source='full_doc']
```

---

## API Specification

### Endpoints Overview

```mermaid
flowchart LR
    subgraph Endpoints["API Endpoints"]
        E1[GET /health]
        E2[POST /api/v1/search/configure]
        E3[POST /api/v1/search/request]
        E4[GET /api/v1/search/{id}]
    end
    
    E1 --> R1[{"status": "ok"}]
    E2 --> R2[{"search_query": {...}}]
    E3 --> R3[{"search_id": UUID}]
    E4 --> R4[{"status", "results", "progress"}]
```

### API Request/Response Flow

| # | Method | Endpoint | Request | Response | Status |
|---|--------|----------|---------|----------|--------|
| 1 | GET | `/health` | - | `{"status": "ok"}` | 200 |
| 2 | POST | `/api/v1/search/configure` | `{text: str}` | `{search_query: {word, ipc_number?}}` | 200, 422 |
| 3 | POST | `/api/v1/search/request` | `{search_query: str, original_text: str}` | `{search_id: UUID}` | 201, 422 |
| 4 | GET | `/api/v1/search/{search_id}` | - | `{status, results?, error?, progress?}` | 200, 404 |

---

## Technology Stack

### Tech Stack Diagram

```mermaid
mindmap
  root((PATHTENT))
    Framework
      FastAPI 0.128+
      Pydantic 2.12+
      Uvicorn
    Database
      PostgreSQL 16
      SQLAlchemy 2.0 async
      Alembic migrations
    Job Queue
      pgqueuer
      LISTEN/NOTIFY
      SELECT FOR UPDATE SKIP LOCKED
    AI/ML
      Pydantic AI
      Gemini 3 Flash
      Gemini embedding-001 (768-dim)
      tiktoken
    Vector DB
      Pinecone cloud
      Qdrant local/cloud
      pathtent collection
      ipc_codes collection
    PDF Processing
      PyMuPDF fitz
    External API
      KIPRIS Open API
      httpx async
    Testing
      pytest
      pytest-asyncio
      testcontainers
```

### Dependencies Summary

| Category | Package | Purpose |
|----------|---------|---------|
| **Web** | fastapi | API framework |
| **Web** | uvicorn | ASGI server |
| **Config** | pydantic-settings | Environment config |
| **DB** | sqlalchemy[asyncio] | ORM |
| **DB** | asyncpg | PostgreSQL driver |
| **DB** | alembic | Migrations |
| **Queue** | pgqueuer | Job queue |
| **AI** | pydantic-ai-slim[google] | LLM integration |
| **AI** | google-genai | Gemini SDK |
| **AI** | tiktoken | Token counting |
| **Vector** | pinecone | Cloud vector DB |
| **Vector** | qdrant-client | Local vector DB |
| **PDF** | pymupdf | PDF extraction |
| **HTTP** | httpx | Async HTTP client |

---

## Deployment Architecture

### Local Development

```mermaid
flowchart TB
    subgraph Local["Local Development"]
        Dev[Developer]
        
        subgraph Docker["Docker Compose"]
            PG[(PostgreSQL:5432)]
            QD[(Qdrant:6333)]
        end
        
        API[FastAPI<br/>:8000]
        Worker[pgqueuer Worker]
        
        Dev --> API
        API --> PG
        Worker --> PG
        Worker --> QD
    end
    
    subgraph Cloud["External Services"]
        KIPRIS[KIPRIS API]
        Gemini[Gemini API]
    end
    
    Worker --> KIPRIS
    Worker --> Gemini
```

### Production (Railway + Neon)

```mermaid
flowchart TB
    subgraph Railway["Railway"]
        API[FastAPI Service]
        Worker[Worker Service]
    end
    
    subgraph Neon["Neon PostgreSQL"]
        PG[(PostgreSQL<br/>+ pgqueuer tables)]
    end
    
    subgraph Pinecone["Pinecone"]
        Vector[(Vector Index)]
    end
    
    subgraph External["External"]
        KIPRIS[KIPRIS API]
        Gemini[Gemini API]
    end
    
    Client --> API
    API --> PG
    Worker --> PG
    Worker --> Vector
    Worker --> KIPRIS
    Worker --> Gemini
```

---

## Configuration Reference

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/pathtent

# KIPRIS API
KIPRIS_SERVICE_KEY=your_kipris_key

# Google AI
GOOGLE_API_KEY=your_google_key
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_EMBEDDING_MODEL=models/embedding-001

# Vector DB (choose one)
VECTOR_DB_MODE=qdrant  # or "pinecone"
VECTOR_DB_DIMENSION=768

# Qdrant (local/cloud)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional_api_key_for_cloud  # Only needed for Qdrant Cloud
QDRANT_COLLECTION_NAME=pathtent  # Patent similarity search
QDRANT_IPC_COLLECTION_NAME=ipc_codes  # IPC code semantic search

# Pinecone (cloud)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=pathtent

# Debug
DEBUG=false
```

---

## IPC Code Embeddings & Vector Collections

### IPC Codes Overview

IPC (International Patent Classification) codes are standardized hierarchical codes used to classify patent inventions. PATHTENT uses semantic embeddings to enable fast IPC code search and matching.

### Vector Collections

| Collection | Purpose | Dimensions | Indexed | Use Case |
|-----------|---------|-----------|---------|----------|
| `pathtent` | Patent claims semantic similarity | 768 | Yes | Find similar patents based on claims text |
| `ipc_codes` | IPC code semantic search | 768 | Yes | Search IPC codes by description |

### Embedding Standardization

- **Dimension**: 768 (reduced from 3072 for storage efficiency)
- **Model**: Google Gemini `embedding-001`
- **Normalization**: L2 normalization applied to all embeddings
- **Token Limit**: Max 2048 tokens per document

### IPC Setup Process

#### 1. Generate IPC Embeddings (768-dim, L2-normalized)

```bash
cd projects/backend
uv run python scripts/build_ipc_embeddings.py
```

**Output**: `data/ipc_embeddings.npz`
- Contains IPC code descriptions as 768-dimensional normalized vectors
- Auto-generated from KIPRIS IPC reference data

#### 2. Upload to Qdrant

```bash
cd projects/backend
uv run python scripts/upload_ipc_to_qdrant.py
```

**Actions**:
- Creates `ipc_codes` collection in Qdrant if not exists
- Uploads all IPC embeddings from `data/ipc_embeddings.npz`
- Sets up index with HNSW algorithm for fast search
- Configures L2 distance metric

#### 3. Verify Upload

```bash
# Query Qdrant directly
curl http://localhost:6333/collections/ipc_codes

# Expected response: collection info with point count
```

### IPC Search Query Flow

```mermaid
sequenceDiagram
    participant User
    participant API as FastAPI
    participant Gemini
    participant Qdrant

    User->>API: POST /search/ipc {text}
    API->>Gemini: Embed IPC query text
    Gemini-->>API: embedding[] (768-dim, L2-normalized)
    API->>Qdrant: Search collection:ipc_codes
    Qdrant-->>API: Top-K similar IPC codes
    API-->>User: {ipc_matches: [...]}
```

### Local Development: Complete IPC Setup

```bash
# 1. Start Qdrant container
docker run -p 6333:6333 qdrant/qdrant

# 2. Setup backend
cd projects/backend
uv sync
export QDRANT_URL=http://localhost:6333

# 3. Generate embeddings (requires GOOGLE_API_KEY)
export GOOGLE_API_KEY=your_key
uv run python scripts/build_ipc_embeddings.py

# 4. Upload to Qdrant
uv run python scripts/upload_ipc_to_qdrant.py

# 5. Verify collections exist
curl http://localhost:6333/collections
```

---

## Testing Strategy

### Test Pyramid

```mermaid
pyramid
    title Testing Pyramid
    "E2E Tests (Real APIs)" : 10
    "Integration Tests (DB + Services)" : 30
    "Unit Tests (Mocked)" : 60
```

### Test Execution

```bash
# Unit tests (fast, mocked)
uv run pytest tests/unit/ -v

# Integration tests (needs Docker)
docker compose up -d
uv run pytest tests/integration/ -v

# E2E tests (real APIs, slow)
uv run pytest tests/e2e/ -v --run-integration
```

---

## Quick Start

```bash
# 1. Clone & Setup
cd projects/backend
uv sync

# 2. Start infrastructure
docker compose up -d

# 3. Run migrations
uv run alembic upgrade head

# 4. Initialize pgqueuer
uv run pgqueuer install

# 5. Generate & upload IPC embeddings (one-time setup)
export GOOGLE_API_KEY=your_google_api_key
uv run python scripts/build_ipc_embeddings.py
uv run python scripts/upload_ipc_to_qdrant.py

# 6. Start API server
uv run uvicorn app.main:app --reload

# 7. Start worker (separate terminal)
uv run python -m app.run_worker
```

---

## References

- [KIPRIS Open API](https://plus.kipris.or.kr/portal/data/request/apiFsmtmList.do?menuNo=290005)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [pgqueuer Documentation](https://pgqueuer.readthedocs.io/)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
