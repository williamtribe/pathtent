# PATHTENT

AI 기반 특허 유사도 검색 플랫폼.

## 개요

한국 특허청(KIPRIS) 데이터베이스에서 AI를 활용해 유사 특허를 검색하는 시스템.

### 구성

| 프로젝트 | 스택 | 설명 |
|----------|------|------|
| `projects/frontend-landing` | Next.js 16, React 19, TypeScript | 웹 프론트엔드 |
| `projects/backend` | FastAPI, Python 3.13+, Gemini AI | API 서버 |
| `projects/chrome-extension` | WXT, React | 브라우저 확장 |

### 주요 기능

- **시맨틱 검색**: 키워드가 아닌 의미 기반 특허 검색
- **AI 쿼리 생성**: 자연어 → 최적 검색어 자동 변환 (Gemini)
- **병렬 처리**: 수백 개 특허 동시 처리
- **PDF 자동 분석**: 청구항 추출 및 임베딩
- **KIPRIS 연동**: 한국 특허 DB 완전 통합

## 빠른 시작

### 프론트엔드

```bash
cd projects/frontend-landing
npm install && npm run dev    # http://localhost:3000
```

### 백엔드

```bash
cd projects/backend
uv sync
docker compose up -d          # PostgreSQL, Qdrant

# Database 마이그레이션
uv run alembic upgrade head

# IPC 임베딩 생성 및 업로드 (일회성)
export GOOGLE_API_KEY=your_google_api_key
uv run python scripts/build_ipc_embeddings.py
uv run python scripts/upload_ipc_to_qdrant.py

# API 서버 시작 (터미널 1)
uv run uvicorn app.main:app --reload   # http://localhost:8000

# 백그라운드 워커 시작 (터미널 2)
uv run python -m app.run_worker
```

### 크롬 확장

```bash
cd projects/chrome-extension
npm install && npm run dev
```

## 환경 변수 (백엔드)

```bash
# 데이터베이스
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/pathtent

# KIPRIS API
KIPRIS_SERVICE_KEY=your_kipris_key

# Google Gemini API
GOOGLE_API_KEY=your_google_key

# 벡터 데이터베이스
VECTOR_DB_MODE=qdrant
VECTOR_DB_DIMENSION=768
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=pathtent
QDRANT_IPC_COLLECTION_NAME=ipc_codes
```

## 문서

- `AGENTS.md` - 개발 가이드라인 (에이전트용)
- `docs/ARCHITECTURE.md` - 시스템 아키텍처 및 IPC 임베딩 설정
- `projects/backend/README.md` - 백엔드 API 상세 가이드
- `PROJECT_OVERVIEW_KO.md` - 상세 프로젝트 개요

## 라이선스

TBD
