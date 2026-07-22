# Known Limitations — Property Launch

**As of:** 2026-07-22  
**Scope:** Property Marketplace launch vertical

These are intentional or accepted gaps — **not** Vehicle/Passport scope creep.

## Launch scope boundaries

| In launch | Out of launch |
|-----------|----------------|
| Property listings (residential, commercial, land, shortlet hubs) | Vehicle Marketplace (Architecture Approved · Implementation Pending) |
| Search, save, WhatsApp contact | Passport UI / SKL bind |
| Seller/agency storefronts (agency thin) | Escrow / BayRight payments deep link |
| Lex moderation for properties | Industrial / Business / Auctions verticals |
| Marketplace trust **indicators** | Constitutional Trust Engine ownership |

## Accepted product / engineering limitations

1. **Edit → re-moderation** — Saving an approved listing sets `pending` and refreshes expiry until staff re-approves.
2. **Drafts** — Client `localStorage` only; not synced across devices.
3. **Agency profiles** — Presented on `/agents/[slug]`; not a separate agency product URL; content thinner than full brand storefront.
4. **Video** — Duration/size validated; H.264 ≤8MB optimization worker deferred.
5. **Maps** — Text location + area guides; no interactive map search.
6. **Launch-mode registry** — Implemented but not yet wired into route guards; vehicles currently absent by lack of UI (wire before any vehicle code ships).
7. **Reports resolve** — Auth console resolve path lacks dedicated audited staff API (PIN/audit gap).
8. **Support moderation queue** — UI/API/nav/RBAC misaligned; prefer `/lex/auth` moderation for launch ops.
9. **Marketplace health** — Some panels are observational; rely on cron + manual recalculate.
10. **Saved searches** — Prefer local/client patterns; not a full account-synced alert product.

## Explicit non-goals at launch

- Do not enable `ENABLE_VEHICLE_MARKETPLACE`
- Do not implement Passport
- Do not rebuild payments/escrow in Yike
- Do not open Industrial / Business / Auction verticals
