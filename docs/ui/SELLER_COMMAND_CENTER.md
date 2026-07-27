# Seller Command Center — Account Dashboard Redesign

**Date:** 2026-07-26  
**Type:** Presentation only (no backend / API / business-logic changes)  
**Route:** `/agent` (Account → **Dashboard** for sellers in bottom nav)

## Goal

When a dealer or agent opens Account, it should feel like a **business command center** — Stripe / Linear / Airbnb Host calm — not a stacked settings page.

## Layout (seller / lister)

1. **Business header** — navy premium card: avatar, business name, verification, trust score, plan, location, Upgrade / Manage plan  
2. **Needs attention** — actionable alerts from existing counts (pending, expiring, expired, verification)  
3. **Quick actions** — compact tiles: New vehicle/property, Boost, My listings, Leads, Alerts, Analytics, Payments, Verification, etc.  
4. **Business overview** — horizontal counters: Active · Pending · Sold · Rented · Expired  
5. **Profile completion** — progress ring + trust checklist (existing `getTrustProgressItems`)  
6. **Performance** — redesigned `SellerAnalyticsPanel` (`variant="command"`) with elegant Premium lock  
7. **Listing health** — derived health % from existing pending/expired/expiring/profile progress (display-only)  
8. **Verification** — checklist grid  
9. **Plan & capacity** — redesigned `PlansUpgradeCard` (`variant="command"`)  
10. **Seller insights** — metadata-driven tips from existing counts  
11. **Premium insights** — calm aspirational upsell (no aggressive copy)  
12. **Account actions** — existing `ProfileAccountActions`

Buyers still see the previous activity-oriented Account layout.

## Bottom nav wording

| Audience | Label | Icon |
|----------|-------|------|
| Guest | Account | LogIn |
| Buyer | Account | User |
| Seller / dealer (`canListProperties`) | **Dashboard** | LayoutDashboard |

Href remains `/agent`.

## Components reused

| Component | Role |
|-----------|------|
| `AvatarUpload` | Business logo / avatar |
| `SellerAnalyticsPanel` | Metrics + premium lock (same `/api/agent/seller-analytics`) |
| `PlansUpgradeCard` | Plan usage + renew (same renew API) |
| `ProfileAccountActions` | Sign out / delete / edit |
| Trust helpers (`getTrustProgressItems`, `trustProgressPercent`, …) | Profile & verification sections |
| Existing listing counts from `src/app/agent/page.tsx` | Overview / health / attention |

## Files modified

| File | Change |
|------|--------|
| `src/components/profile/seller-command-center.tsx` | **New** command center UI |
| `src/components/profile/profile-page-client.tsx` | Lister → command center; buyer unchanged path |
| `src/components/subscriptions/seller-analytics-panel.tsx` | `variant="command"` presentation |
| `src/components/subscriptions/plans-upgrade-card.tsx` | `variant="command"` presentation |
| `src/app/agent/page.tsx` | Pass `rentedCount` / `soldCount` from existing listing rows |
| `src/components/layout/primary-bottom-nav.tsx` | Seller label **Dashboard** |
| `docs/ui/SELLER_COMMAND_CENTER.md` | This doc |

## Confirmation — no engine changes

- No database / migration / Listing Engine / Search / Financial / Trust rewrite / YIP  
- Same auth gate, same analytics endpoint, same subscription renew endpoint  
- Sold count = `status === "archived"`; rented = `status === "rented"` (existing statuses only)

## Screenshots

Capture after signed-in seller preview:

1. Mobile — business header + quick actions  
2. Mobile — overview + performance  
3. Desktop — full command center  
4. Bottom nav — **Dashboard** for seller  

Store under `docs/ui/screenshots/` when available (`seller-command-center-mobile.png`, `seller-command-center-desktop.png`).

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```
