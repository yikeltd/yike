# Sample Marketplace Data Report

**Date:** 2026-07-23  
**Production inventory:** seeded on `hlpojfurfldvcxfxhveg` (founder-approved `ALLOW_PRODUCTION_SEED=1`)

## Verdict

**Live DB sample inventory is on production.** Homepage rails use real approved sample rows (not UI-only fixtures). Admin can purge via Sample Listing tools / `--purge-demo`.

## Counts (validated)

| Kind | Approved | Boosted |
|------|--------:|--------:|
| Sellers | 4 | — |
| Properties | 18 | 8 |
| Vehicles | 14 | 6 |
| **Total listings** | **32** | — |

Tagged: `attributes.is_sample` + `is_demo` + `seed_namespace=yike-demo-marketplace-v1`  
Public UI: **no** Sample / DEMO badges.

## Path

| Layer | Behavior |
|-------|----------|
| Production DB | Seeded sample inventory |
| Public labels | **No** “Sample” / “DEMO” |
| Admin | “Sample Listing” badge; remove one / bulk purge |
| UI fixtures | Fallback only if live rails empty |

## Purge

```bash
ALLOW_PRODUCTION_SEED=1 npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts --purge-demo
# or Admin → Moderate listings → Remove all sample listings
```
