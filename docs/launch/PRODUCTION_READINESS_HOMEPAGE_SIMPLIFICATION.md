# Production Readiness Report — Homepage Simplification

**Date:** 2026-07-23  
**Status:** **GO for review** · **HOLD commit/deploy until founder approves**

## Summary

Launch simplification reduces chrome and marketing noise so live inventory and search dominate. No auth/seller API or schema changes. Demo UI cannot surface in production builds.

## Production gates

| Item | Status |
|------|--------|
| Demo fixtures | Off unless `NODE_ENV === "development"` and not production and `YIKE_DISABLE_DEMO_UI` unset |
| `[DEMO]` banners | Client-gated to development only (home + vehicles) |
| Marketing grids | Removed from homepage surface |
| Header location (desktop) | Removed — no duplicate Nigeria chip |
| Empty-state verbosity | Short / silent |
| Migrations | None required for this pass |
| Auth / seller APIs | Untouched |

## Coolify / env

Optional local-only:

```bash
# YIKE_DISABLE_DEMO_UI=1
```

Do **not** need new production env vars for this simplification. Production already has `NODE_ENV=production`.

## GO / HOLD

| Decision | |
|----------|--|
| Code review | **GO** — ready for founder UI review |
| Commit | **HOLD** — explicit founder instruction |
| Deploy | **HOLD** until commit approved |

## Smoke after approve + ship

1. `npx tsc --noEmit` · `npm run build`  
2. Production home: no demo banner, no marketing 4-up, SELL in desktop header  
3. Mobile home: inventory-first, location in header only  
4. Thin city: nearby inventory without long notices  
5. SELL → existing auth / verify / list flow  

## Commit

**None** — confirmed hold.
