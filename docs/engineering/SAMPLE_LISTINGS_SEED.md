# Sample listings seed (30 items)

Handcrafted **10 property · 10 vehicle · 10 electronics** listings for local dev and safe sandbox demos.

## Seed to Supabase (idempotent)

```bash
# Plan only (no writes)
npm run seed:sample-listings:dry

# Writes (sandbox/local service role only)
npx tsx --env-file=.env.local scripts/seed-sample-listings.ts

# Remove stable sample rows
npx tsx --env-file=.env.local scripts/seed-sample-listings.ts --purge
```

**Safety:** Refuses production project `hlpojfurfldvcxfxhveg` unless `ALLOW_PRODUCTION_SEED=1`.

**Markers:** `attributes.is_demo`, `attributes.is_sample`, `attributes.seed_namespace=yike-sample-listings-v1`, stable UUIDs under `s3000001-…`.

## Offline UI fixture (no database)

In `.env.local` (development only):

```bash
YIKE_SAMPLE_LISTINGS_FIXTURE=1
```

When live inventory is empty, the homepage uses the same 30-item catalog in-memory and shows a **Sample listings (dev fixture)** banner. This is **not** enabled when Supabase fails silently — only when this flag is set.

## Catalog source

`src/lib/sample-listings/catalog.ts` — titles, slugs, prices, locations, Unsplash media URLs.
