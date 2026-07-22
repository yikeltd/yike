# Platform Responsibilities — Yike

**Status:** Approved architectural baseline  
**Product:** Yike — Stankings Marketplace Platform

## Owns (marketplace)

| Responsibility | Notes |
|----------------|-------|
| Marketplace platform | Multi-vertical listing infrastructure |
| Listings | Create, publish, freshness, expiry, media pipeline |
| Discovery | Feed, browse, hubs |
| Search & filtering | Query, filters, SEO location pages |
| Seller profiles | Public seller presentation & inventory |
| Agency profiles | Agency / developer storefronts |
| Marketplace trust indicators | Badges, safety UX, listing health **presentation** |
| Listing moderation | Queues, reports, duplicates (`/lex`) |
| Marketplace experience | Cards, detail, WhatsApp CTAs, PWA/TWA |
| Vehicle marketplace (core) | Architecture approved — implementation after Passport prep |
| Future vertical capacity | Reserved until founder authorization |

## Does not own (consume / integrate)

See [ECOSYSTEM_ALIGNMENT.md](./ECOSYSTEM_ALIGNMENT.md) — Passport, Identity,
Constitutional Trust, Governance, Consent, Explainability, Payments, Escrow,
Billing, Community, Hospitality ops, Manufacturing, Media.

## Local vs constitutional trust

- **Local marketplace trust** (scores, verification workflows, badges) may exist
  for product UX and moderation.
- **Constitutional Trust Engine** remains Stankings-owned. Over time, Yike
  **contributes signals** to Passport and **displays** explainable outcomes —
  it must not become a competing trust authority.
