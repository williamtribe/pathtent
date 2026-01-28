import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.dependencies import limiter
from app.api.routes import router as search_router
from app.api.patent_routes import router as patent_router
from app.api.formula_routes import router as formula_router
from app.api.collection_routes import router as collection_router
from app.api.lda_routes import router as lda_router
from app.api.noise_removal_routes import router as noise_removal_router
from app.api.pipeline_routes import router as pipeline_router
from app.api.kipris_routes import router as kipris_router

app = FastAPI(
    title="Patent Specification Generator API",
    description="API for analyzing research papers and generating patent specifications",
    version="0.1.0",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key", "Accept"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


# Existing patent search API (requires DB)
app.include_router(search_router, prefix="/api/v1")

# Patent specification generation API (no DB required)
app.include_router(patent_router, prefix="/api/v1")

# Formula generation API
app.include_router(formula_router, prefix="/api/v1")

# Patent collection API (KIPRIS)
app.include_router(collection_router, prefix="/api/v1")

# LDA topic modeling API
app.include_router(lda_router, prefix="/api/v1")

# Noise removal API
app.include_router(noise_removal_router, prefix="/api/v1")

# Unified analysis pipeline API
app.include_router(pipeline_router, prefix="/api/v1")

# KIPRIS direct search API
app.include_router(kipris_router, prefix="/api/v1")
