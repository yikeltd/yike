# Launch Validation Dataset

**Status:** Catalog ready · **not applied to production**  
**Date:** 2026-07-26  
**Feature freeze:** ACTIVE — seed tooling only; no product features  

## Recommendation (locked)

Do **not** flood production with hundreds of fake listings before soft-launch.

| Environment | Action |
|-------------|--------|
| **Staging / sandbox** (`gyxemepnrkwxocgzfbeo`) | Run full seed for load, search, admin, and journey QA |
| **Production** (`hlpojfurfldvcxfxhveg`) | Keep thin real + existing 32 sample rows; onboard real agencies/dealers; expand seed only with **explicit founder approval** |

## What was built

| Asset | Role |
|-------|------|
| `scripts/lib/launch-validation-catalog.ts` | Idempotent generated catalog (~282 props + ~120 vehicles + 8 extra sellers) |
| `scripts/seed-demo-marketplace.ts` | Upserts handcrafted + generated rows; refuses prod unless `ALLOW_PRODUCTION_SEED=1` |
| Tags | `is_sample`, `is_demo`, `seed_namespace=yike-demo-marketplace-v1` (hidden from public UI) |

## Dry-run inventory plan (2026-07-26)

| Kind | Count |
|------|------:|
| Sellers | 12 |
| Properties | **300** (34 boosted) |
| Vehicles | **134** (16 boosted) |
| **Total listings** | **434** |

### Geographic coverage (properties + handcrafted)

Enugu, Aba, Owerri, Port Harcourt, Abuja, Lagos, Benin City, Uyo, Asaba, Ibadan, Kaduna, Kano, Jos (+ a few handcrafted outliers).

### Property types exercised

Apartments/flats, duplexes, terraces, bungalows, shops, offices, warehouses, land, commercial (+ existing handcrafted variants).

### Vehicle makes exercised

Toyota, Lexus, Honda, Mercedes-Benz, BMW, Ford, Kia, Hyundai, Nissan, Peugeot, Mitsubishi (+ existing handcrafted Bajaj/Isuzu).

## Media protection note

Seed images are **external Unsplash URLs** (same as the existing demo seed). They do **not** exercise the Media Protection Pipeline (watermark / fingerprint / private original / `media_assets`).

| Validation | Seed dataset | How to validate for real |
|------------|--------------|--------------------------|
| Listing search / filters / pagination | ✅ | Staging seed |
| Admin moderate / sample purge | ✅ | Staging seed |
| Media protection registry | ❌ | Founder FAT: one real upload → `media_assets` ≥ 1 |

## How to run (staging)

```bash
export SUPABASE_URL="https://gyxemepnrkwxocgzfbeo.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<sandbox-service-role>"

npm run seed:demo:dry
npm run seed:demo
npm run seed:demo -- --validate-only
```

## Production (founder confirm only)

```bash
# Safe
npm run seed:demo:dry

# Writes — founder must set allow flag
ALLOW_PRODUCTION_SEED=1 npm run seed:demo
```

## Cleanup

```bash
# Staging
npm run seed:demo -- --purge-demo

# Production (if ever expanded)
ALLOW_PRODUCTION_SEED=1 npm run seed:demo -- --purge-demo
# or Lex Admin → Remove all sample listings
```

## Search / performance / admin QA (after staging seed)

| Check | Expected |
|-------|----------|
| City / price / bedroom filters | Diverse results across 13 cities |
| Vehicle make / model / year | Coverage across catalog makes |
| Sort + pagination / infinite scroll | No empty holes; latency acceptable on 3G |
| Listing detail | Realistic Nigerian copy/pricing; no Lorem/Test/Sample titles |
| Admin approve/reject/search | Sample badge in Lex only |
| Guest / buyer / seller / agent journeys | Staging FAT with large inventory |

## Launch blockers this work does **not** clear

- Real marketplace supply (C04) — still founder/business
- First live media-protection upload (C12)
- Founder FAT (C10), C07/C08

This dataset is an **ops tooling** deliverable for staging stress tests, not a substitute for real inventory on yike.ng.
