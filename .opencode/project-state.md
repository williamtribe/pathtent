# Project State

## Current Status
- **Date**: 2026-01-27
- **Last Action**: Dependency cleanup completed

## Recent Decisions

### Dependency Cleanup (2026-01-27)
**Backend removed (commit fc74405):**
- `kiwipiepy` - Korean NLP, never used. `kipris/` is a LOCAL module (KIPRIS API client), not this package
- `pandas` - no imports found
- `openpyxl` - no imports found

**Frontend removed:**
- `@fontsource-variable/mona-sans` - unused
- `@gsap/react` - using gsap directly
- `@radix-ui/themes` - unused
- `heroicons` - using lucide-react instead
- `material-symbols` - unused

**Impact:** 87 packages removed, Railway deployment should now work (mecab dependency removed)

## Known Issues (Pre-existing)
- Backend has 61 type errors (basedpyright) - existed before cleanup
- Some embedding tests failing (mock issues) - existed before cleanup

## Learnings
- `kipris/` folder is custom code for KIPRIS patent API, NOT the kiwipiepy package
- kiwipiepy required mecab which caused Nixpacks/Railpack build failures

## Next Steps
- Verify Railway deployment works without kiwipiepy
- Fix SSL certificate for pathtent.ai domain
- Consider adding scipy explicitly to pyproject.toml (currently transitive)
