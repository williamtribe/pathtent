import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# @TODO-10 — Register collection and LDA routers
from app.api.routes import router as search_router
from app.api.patent_routes import router as patent_router
from app.api.collection_routes import router as collection_router
from app.api.lda_routes import router as lda_router

app = FastAPI(
    title="Patent Specification Generator API",
    description="API for analyzing research papers and generating patent specifications",
    version="0.1.0",
)

# CORS configuration - frontend URL can be added via environment variable
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


# Existing patent search API (requires DB)
app.include_router(search_router, prefix="/api/v1")

# Patent specification generation API (no DB required)
app.include_router(patent_router, prefix="/api/v1")

# Patent collection API (KIPRIS)
app.include_router(collection_router, prefix="/api/v1")

# LDA topic modeling API
app.include_router(lda_router, prefix="/api/v1")
