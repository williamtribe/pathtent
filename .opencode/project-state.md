# Project State
## Current Status
- **Date**: 2026-01-28
- **Last Action**: Security Hardening ALL PHASES COMPLETE
- **Current Branch**: `feature/security-hardening` (from `dev`)
- **Pending Commit**: All security changes ready to commit
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
## Security Hardening Progress ✅ ALL COMPLETE
### Phase 1: CORS & Error Handling ✅ COMPLETE
| Change | Files | Status |
|--------|-------|--------|
| CORS tightened | `main.py` - explicit methods/headers | ✅ Done |
| Logging added | 6 route files | ✅ Done |
| Error sanitization | 16 handlers - generic messages | ✅ Done |

**Details:**
- `allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]`
- `allow_headers=["Content-Type", "Authorization", "X-API-Key", "Accept"]`
- All `str(e)` patterns replaced with `logger.exception()` + generic Korean messages

### Phase 2: Rate Limiting & API Auth ✅ COMPLETE
| Change | Files | Status |
|--------|-------|--------|
| slowapi dependency | `pyproject.toml` | ✅ Done |
| Rate limiter middleware | `main.py` | ✅ Done |
| API key auth dependency | `dependencies.py` (NEW) | ✅ Done |
| Config settings | `config.py` - api_key, rate_limit_per_minute | ✅ Done |
| All endpoints protected | 8 route files | ✅ Done |

**Details:**
- New `dependencies.py` with `limiter` instance and `verify_api_key` function
- All endpoints have `@limiter.limit("X/minute")` + `RequireAPIKey` dependency
- Rate limits: 5-60/min depending on endpoint cost
- API key optional in dev (if API_KEY not set), required in prod

### Phase 3: Frontend Fixes ✅ COMPLETE
| Change | Files | Status |
|--------|-------|--------|
| Hardcoded URLs fixed | `generate-v2/page.tsx` | ✅ Done |
| API_BASE_URL exported | `lib/api.ts` | ✅ Done |
| Security headers added | `next.config.mjs` | ✅ Done |
| Middleware → Proxy migration | `middleware.ts` → `proxy.ts` | ✅ Done |

**Details:**
- All fetch calls now use `${API_BASE_URL}/api/v1/...`
- Headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Renamed middleware.ts to proxy.ts per Next.js 16 deprecation

### Current Mitigation
- API keys manually redacted when not in use
- PostgreSQL URL secured within Railway internal network
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
### 1. Commit Security Hardening
- [x] Phase 1: CORS & Error Handling
- [x] Phase 2: Rate Limiting & API Auth
- [x] Phase 3: Frontend Fixes
- [x] Fix slowapi parameter naming (req→request, request body→body)
- [ ] Commit and push to feature/security-hardening
- [ ] Merge to dev when complete

### 2. CI/CD Setup (GitHub Actions)
- Type checking (TypeScript, basedpyright)
- Linting (ESLint, Ruff)
- Build verification
- Auto-deploy OFF (manual deployment preferred)

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
