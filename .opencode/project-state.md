# Project State
## Current Status
- **Date**: 2026-01-28
- **Last Action**: Security Screening COMPLETE, session halted
- **Current Branch**: `feature/ipc-to-qdrant`
- **Last Commit**: `9bd8127` - feat(backend): migrate IPC search from NPZ to Qdrant
---
## Deployment Status
### URLs
| Service  | URL                                         | Status      |
| -------- | ------------------------------------------- | ----------- |
| Frontend | https://pathtent.ai                         | Active      |
| Backend  | https://pathtent-production-e7c2.up.railway.app | API keys removed (paused) |
### Infrastructure (Railway)
- **PostgreSQL**: Running (migrations done, URL secured internally)
- **Qdrant**: Running (local has 8367 IPC vectors, prod empty)
- **Backend**: Running but disabled (API keys removed)
### Vercel
- Domain `pathtent.ai` connected and verified
- SSL certificate active (Let's Encrypt)
---
## IPC-to-Qdrant Migration ✅ COMPLETE
- Embeddings: 8,367 IPC codes @ 768 dimensions
- L2 normalized, uploaded to local Qdrant
- Sanity checked: proper clustering, good diversity
- Backend tested and working
---
## Security Screening ✅ COMPLETE
### Issues Found (for future hardening)
| Issue | Location | Priority |
|-------|----------|----------|
| CORS wildcard (`allow_methods=["*"]`) | `backend/app/main.py:29` | Medium |
| No rate limiting | Backend-wide | Medium |
| No auth on endpoints | Backend-wide | High (before prod) |
| Error details exposed via `str(e)` | 11+ route handlers | Low |
| Hardcoded localhost URLs | `frontend/generate-v2/page.tsx:43,78,107` | Low |
| No security headers (CSP, HSTS) | `next.config.mjs` | Low |
| XSS payloads accepted in forms | Frontend forms | Low (React escapes) |

### Current Mitigation
- API keys manually redacted when not in use
- PostgreSQL URL secured within Railway internal network
- No CRUD/auth implemented yet, so most issues deferred

### Status
Safe for development/testing. Address before restoring API keys for production.
---
## Recent Decisions (2026-01-28)
### Embedding Dimension: 768
- **Rationale**: 3072-dim is overkill for similarity search at scale
- **Storage savings**: 4x reduction (162GB → 41GB for 9M vectors)
- **Quality**: 768-dim captures 95%+ of semantic meaning

### Type Errors
- Reduced from 60 to 53 (fixed critical ones)
- Remaining are non-blocking (str|None, Literal types, test mocks)
- Tracked for future cleanup
---
## Next Steps (Priority Order)
### 1. CI/CD Setup (GitHub Actions)
- Type checking (TypeScript, basedpyright)
- Linting (ESLint, Ruff)
- Build verification
- Auto-deploy OFF (manual deployment preferred)

### 2. Security Hardening (Before Production)
- Tighten CORS to specific origins
- Add rate limiting middleware
- Implement API authentication
- Add security headers to Next.js

### 3. Production IPC Upload
- Run upload script against Railway Qdrant
- Restore API keys after security hardening
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
- Backend has 53 pre-existing type errors (basedpyright) - non-blocking
- LDA coherence ~0.3 (normal for Korean patent text)
---
## Learnings
- `kipris/` folder is LOCAL code (KIPRIS API client), not kiwipiepy package
- Railway doesn't reliably fetch Git LFS files
- Railway zero-replica pause not available, use API key removal instead
- Gemini embedding-001 outputs 3072-dim by default; use `output_dimensionality` param for 768
- Reduced dimension embeddings need L2 normalization (full 3072 is auto-normalized)
- LDA coherence 0.3-0.4 is acceptable for Korean technical text
- React auto-escapes XSS on render, but input validation still recommended
