# Known Limitations — Launch

**As of:** 2026-07-26  
**Scope:** Day-1 marketplace (Vehicles primary · Property secondary)

These are intentional or accepted gaps — not redesign targets under feature freeze.

Vehicle marketplace is a **Day-1 flagship**. Code default: `ENABLE_VEHICLE_MARKETPLACE=true`. Do **not** disable for launch.

## Launch scope boundaries

| In launch | Out of launch |
|-----------|----------------|
| **Vehicle** listings (cars, SUVs, trucks, commercial, …) | Passport UI / SKL bind |
| Property listings (residential, commercial, land, shortlet hubs) | Escrow / BayRight payments deep link |
| Search, save, WhatsApp contact | Industrial / Business / Auctions verticals |
| Seller/agency/dealer storefronts | Constitutional Trust Engine ownership |
| Lex moderation for both verticals | |

## Accepted product / engineering limitations

1. **Edit → re-moderation** — Saving an approved listing sets `pending` and refreshes expiry until staff re-approves.
2. **Drafts** — Client `localStorage` only; not synced across devices.
3. **Agency profiles** — Presented on `/agents/[slug]`; thinner than full brand storefront.
4. **Video** — Duration/size validated; H.264 ≤8MB optimization worker deferred.
5. **Maps** — Text location + area guides; no interactive map search.
6. **Launch-mode registry** — Vehicles default **ON**; other deferred surfaces stay off unless ENABLE_* set.
7. **Reports resolve** — Auth console resolve path lacks dedicated audited staff API (PIN/audit gap).
8. **Support moderation queue** — Prefer `/lex/auth` moderation for launch ops.
9. **Marketplace health** — Some panels observational; rely on cron + manual recalculate.
10. **Saved searches** — Prefer local/client patterns; not a full account-synced alert product.
11. **Vehicle body-type filter** — Category (SUV/truck/…) approximates; dedicated body_type UI is V2.
12. **Media protection live smoke** — Code live; first production registry row still founder FAT.

## Explicit non-goals at launch

- Do **not** set `ENABLE_VEHICLE_MARKETPLACE=false` for launch
- Do not implement Passport
- Do not rebuild payments/escrow in Yike
- Do not open Industrial / Business / Auction verticals
