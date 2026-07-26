# Sample Marketplace Data Report

**Date:** 2026-07-26 (updated)  
**Production inventory:** small handcrafted sample on `hlpojfurfldvcxfxhveg` (founder-approved earlier)  
**Full validation catalog:** built, dry-run verified, **not applied to production**

## Verdict

**Production still has the small sample set (~32 approved listings).** A launch-scale idempotent catalog (~300 properties + ~134 vehicles) is ready for **staging** stress tests. Expanding production with hundreds of fakes is **not recommended** for soft-launch — prioritize real agencies/dealers.

See [LAUNCH_VALIDATION_DATASET.md](./LAUNCH_VALIDATION_DATASET.md).

## Production counts (live)

| Kind | Approved | Notes |
|------|--------:|-------|
| Sellers (demo) | 4 | Handcrafted |
| Properties | ~18 | Handcrafted sample |
| Vehicles | ~14 | Gated / mostly unused if vehicles OFF |
| **Total listings** | **~32** | Thin for launch trust |

## Catalog ready (dry-run, not written to prod)

| Kind | Count |
|------|------:|
| Sellers | 12 |
| Properties | 300 |
| Vehicles | 134 |
| **Total listings** | **434** |

Tagged: `attributes.is_sample` + `is_demo` + `seed_namespace=yike-demo-marketplace-v1`  
Public UI: **no** Sample / DEMO badges.

## Path

| Layer | Behavior |
|-------|----------|
| Production DB | Keep thin sample + real inventory growth |
| Staging DB | Preferred target for full catalog |
| Public labels | **No** “Sample” / “DEMO” |
| Admin | “Sample Listing” badge; remove one / bulk purge |
| UI fixtures | Fallback only if live rails empty |

## Purge

```bash
# Staging
npx tsx scripts/seed-demo-marketplace.ts --purge-demo

# Production (if needed)
ALLOW_PRODUCTION_SEED=1 npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts --purge-demo
# or Admin → Moderate listings → Remove all sample listings
```
