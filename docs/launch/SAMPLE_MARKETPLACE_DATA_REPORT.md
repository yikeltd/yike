# Sample Marketplace Data Report

**Date:** 2026-07-23  
**Production inventory check:** `published = 0` on `hlpojfurfldvcxfxhveg` (queried via service role)

## Verdict

Homepage will show **realistic NG sample inventory via UI fixtures** (no DB write). DB seed is ready with `is_sample` but **blocked** until founder sets `ALLOW_PRODUCTION_SEED=1`.

## Path chosen

| Layer | Behavior |
|-------|----------|
| UI fixtures | Enabled when live rails empty (`YIKE_EMPTY_INVENTORY_FIXTURES` default on; disable with `=0`) |
| Public labels | **No** “Sample” / “DEMO” |
| Admin | “Sample Listing” badge; remove one / bulk purge API |
| DB seed | `attributes.is_sample` + `is_demo` + namespace; clean titles |

## Fixture coverage (examples)

**Properties:** Lekki apt, Wuse duplex, Calabar bungalow, Enugu shop, PH office, Uyo land, plus existing Enugu/Aba/Owerri/… mix  

**Vehicles:** Camry, Corolla, RX350, Prado, Hilux, Accord, C300, plus existing set  

Nigerian pricing · Unsplash images · verified sellers · realistic copy

## Production seed (founder confirm)

```bash
# Dry-run (safe)
npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts --dry-run

# Write only with explicit allow
ALLOW_PRODUCTION_SEED=1 npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts

# Purge samples
ALLOW_PRODUCTION_SEED=1 npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts --purge-demo
# or Admin → Moderate listings → Remove all sample listings
```

## DB written this sprint?

**No.**
