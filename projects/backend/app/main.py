import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as search_router
from app.api.patent_routes import router as patent_router
from app.api.formula_routes import router as formula_router

app = FastAPI(
    title="Patent Specification Generator API",
    description="연구 논문/보고서를 분석하여 특허 명세서를 생성하는 API",
    version="0.1.0",
)

# CORS 설정 - 환경 변수로 프론트엔드 URL 추가 가능
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if frontend_url := os.getenv("FRONTEND_URL"):
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


# 기존 특허 검색 API (DB 필요)
app.include_router(search_router, prefix="/api/v1")

# 새로운 특허 명세서 생성 API (DB 불필요)
app.include_router(patent_router, prefix="/api/v1")

# KIPRIS 검색식 생성 API
app.include_router(formula_router, prefix="/api/v1")
