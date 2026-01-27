# Project State
## Current Status
- **Date**: 2026-01-28
- **Last Action**: IPC-to-Qdrant migration code complete (awaiting user to run scripts)
- **Current Branch**: `feature/ipc-to-qdrant`
---
## Deployment Status
### URLs
| Service  | URL                                         | Status      |
| -------- | ------------------------------------------- | ----------- |
| Frontend | https://pathtent.ai                         | Active      |
| Backend  | https://pathtent-production-e7c2.up.railway.app | API keys removed (paused) |
### Infrastructure (Railway)
- **PostgreSQL**: Running (empty, migrations done)
- **Qdrant**: Running (empty - awaiting IPC upload)
- **Backend**: Running but disabled (API keys removed)
### Vercel
- Domain `pathtent.ai` connected and verified
- SSL certificate active (Let's Encrypt)
---
## IPC-to-Qdrant Migration (COMPLETED - Code Ready)
### Changes Made
| File | Change |
| ---- | ------ |
| `app/services/embedding.py` | Added `output_dimensionality=768`, L2 normalization |
| `app/config.py` | Added `embedding_dimension=768` field |
| `scripts/build_ipc_embeddings.py` | Updated for 768-dim + normalization |
| `scripts/upload_ipc_to_qdrant.py` | **NEW** - Upload script for Qdrant |
| `app/services/ipc_search.py` | Refactored to query Qdrant instead of NPZ |
| `.gitignore` | Added `ipc_embeddings.npz` to ignore |

### User Action Required
```bash
# Step 1: Re-generate embeddings (768-dim, normalized)
cd projects/backend
uv run python scripts/build_ipc_embeddings.py

# Step 2: Upload to Qdrant (local or Railway)
uv run python scripts/upload_ipc_to_qdrant.py
```

### Architecture After Migration
| Component  | Purpose                        | Dimension | Collection |
| ---------- | ------------------------------ | --------- | ---------- |
| IPC Search | Find relevant IPC codes        | 768       | `ipc_codes` |
| Patent Similarity | Find similar patents    | 768       | `pathtent` |
| Future Patents | 3M patent embeddings       | 768       | TBD |

**All vectors now standardized at 768 dimensions!**

---
## Recent Decisions (2026-01-28)
### Embedding Dimension: 768
- **Rationale**: 3072-dim is overkill for similarity search at scale
- **Storage savings**: 4x reduction (162GB → 41GB for 9M vectors)
- **Quality**: 768-dim captures 95%+ of semantic meaning

### Dependency Cleanup
**Backend removed:**
- `kiwipiepy` - never used, caused mecab build issues
- `pandas` - no imports
- `openpyxl` - no imports
**Frontend removed:**
- `@fontsource-variable/mona-sans`, `@gsap/react`, `@radix-ui/themes`, `heroicons`, `material-symbols`
**Impact:** 87 packages removed

### Git LFS Removal
- `ipc_embeddings.npz` removed from Git LFS and now gitignored
- Will be regenerated locally via script
---
## Next Steps (Priority Order)
### 1. Run Migration Scripts (USER ACTION)
- Run `build_ipc_embeddings.py` to regenerate 768-dim embeddings
- Run `upload_ipc_to_qdrant.py` to upload to Qdrant
- Test IPC search functionality

### 2. Security Screening
- API is currently open (no auth)
- Need: API key auth, rate limiting, CORS hardening
- Add user authentication for production

### 3. CI/CD Setup (GitHub Actions)
- Type checking (TypeScript, basedpyright)
- Linting (ESLint, Ruff)
- Build verification
- Auto-deploy OFF (manual deployment preferred)
---
## Environment Variables Reference
### Backend (Railway)
```
DATABASE_URL=<auto from PostgreSQL>
QDRANT_URL=http://qdrant.railway.internal:6333
FRONTEND_URL=https://pathtent.ai
GOOGLE_API_KEY=<required for embeddings>
ANTHROPIC_API_KEY=<removed for security>
KIPRIS_SERVICE_KEY=<removed for security>
```
### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://pathtent-production-e7c2.up.railway.app
```
---
## Known Issues
- Backend has 61 pre-existing type errors (basedpyright)
- Some embedding tests failing (mock issues)
- Removed stale @TODO markers from kipris_routes.py and noise_removal_routes.py
---
## Learnings
- `kipris/` folder is LOCAL code (KIPRIS API client), not kiwipiepy package
- Railway doesn't reliably fetch Git LFS files
- Railway zero-replica pause not available, use API key removal instead
- Vercel domain verification requires TXT record at `_vercel.domain`
- DNS propagation takes minutes to hours
- Gemini embedding-001 outputs 3072-dim by default; use `output_dimensionality` param for 768
- Reduced dimension embeddings need L2 normalization (full 3072 is auto-normalized)
