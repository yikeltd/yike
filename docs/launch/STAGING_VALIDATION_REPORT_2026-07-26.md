# Staging Validation Report — 2026-07-26

**Feature freeze:** ACTIVE  
**Dataset:** Launch Validation Catalog (idempotent seed)  
**Policy:** Prefer staging/sandbox over production for large fake inventory

---

## Status

| Item | Result |
|------|--------|
| Catalog generator | READY |
| Dry-run inventory | **300** properties · **134** vehicles · **12** sellers |
| Applied to staging DB (`gyxemepnrkwxocgzfbeo`) | ❌ **Not executed** this sprint |
| Search / pagination / filters on large set | ❌ Blocked pending seed |
| Perf / memory / API latency at scale | ❌ Blocked pending seed |
| Regressions found | **None** (no large-set run yet) |

**Correction:** Earlier planning language said “staging contains 300/134.” That describes the **catalog ready to apply**, not a confirmed sandbox write. Production remains at **32** sample listings and was intentionally not expanded.

---

## How to complete staging validation (ops)

```bash
export SUPABASE_URL="https://gyxemepnrkwxocgzfbeo.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<sandbox-service-role>"

npm run seed:demo:dry
npm run seed:demo
npm run seed:demo -- --validate-only
```

Then manually:

| Check | Pass if |
|-------|---------|
| City filter | Results span multiple cities |
| Price / bedrooms | Filters shrink set without empty errors |
| Vehicle make/model | Coverage across catalog makes (if vehicles ON in staging) |
| Sort + pagination / infinite scroll | Stable; no client crashes |
| Listing detail | Realistic titles/prices; no Lorem/Test |
| Admin sample badge + purge | Lex shows Sample; purge removes namespace only |
| Latency | Note p50/p95 for search + detail; flag only if worse than prod baseline ×3 |

Cleanup:

```bash
npm run seed:demo -- --purge-demo
```

Docs: [LAUNCH_VALIDATION_DATASET.md](./LAUNCH_VALIDATION_DATASET.md) · [DEMO_MARKETPLACE_SEED.md](../engineering/DEMO_MARKETPLACE_SEED.md)

---

## Production baseline (for comparison)

| Probe | Latency |
|-------|--------:|
| `/search` | ~1.2s |
| `/search?city=Lagos` | ~1.0s |
| Property detail | ~1.0–1.2s |
| `/rent` `/land` hubs | ~2.2–2.4s |

No redesign. Report only regressions after staging seed.
