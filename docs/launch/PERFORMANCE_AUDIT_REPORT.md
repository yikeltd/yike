# Performance Audit Report

**Date:** 2026-07-23  
**Scope:** Light touch — CLS / lazy images / mobile feel

## Verdict

No heavy dependency adds. Existing `next/image` / `ListingImage` lazy loading retained. Homepage section backgrounds are CSS-only (no layout shift from ads — empty slots still collapse).

## Observations

| Item | Status |
|------|--------|
| Listing thumbs | Lazy by default; priority only above-the-fold |
| Location picker portal | Fixed overlay — no document reflow when closed |
| Empty inventory fixtures | Client/server fill without extra network to Supabase |
| Micro hover | Transform-only (`translate` / `scale`) |

## Risks

- Unsplash fixture URLs depend on third-party CDN (acceptable for sample/demo; replace with owned media when seeding for real)
- Large fixture sets truncated to rail limits (6–12)

## Follow-ups (optional, not blocking)

- Prefer owned WebP when DB samples go live
- Lighthouse mobile pass after deploy with fixtures or seeded inventory
