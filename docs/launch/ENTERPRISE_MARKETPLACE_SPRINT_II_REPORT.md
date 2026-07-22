# Enterprise Marketplace — Launch Readiness Sprint II

**Date:** 2026-07-22  
**Status:** Implemented for review — **Do NOT commit · Do NOT apply migration**  
**Prerequisite:** Sprint I Listings SSOT / Vehicle / Adapters (Approved with amendments)

---

## 1. Vehicle Marketplace Completion Report

| Capability | Status |
|------------|--------|
| Create | Ready (photo upload via ListingPhotoManager) |
| Edit | Ready (`/agent/listings/[id]/edit` branches on asset_type) |
| Draft recovery | Ready (localStorage vehicle drafts + agent list banner) |
| Gallery | Ready (shared media pipeline on create/edit) |
| Search + filters + sort | Ready (category, condition, sort, featured rail) |
| Detail + similar | Ready |
| Save / share / report | Ready |
| Recently viewed | Ready (href-aware tracker) |
| Featured UI | Ready (badge + featured rail) |
| Agent listing management | Ready (vertical badge, correct links, Sold vs Rented) |
| Dealer dashboard | Partial — dealer storefront via `/agents/[slug]` + Lex dealers filter; dedicated `/dealers` route deferred |
| Dealer verification UI | Placeholder messaging for future Passport — no local engine |
| Vehicle analytics | Partial — views still on shared listing; Lex CEO split deferred |

---

## 2. Marketplace Profile Report

| Profile | Status |
|---------|--------|
| Individual / Agent | Existing + vehicle inventory tabs |
| Agency / Developer | Existing sections retained |
| Dealer | Account type + storefront banner + inventory split + Lex `dealers` filter |
| Public listings | PropertyFeed / VehicleCard by `asset_type` via `listingPath` |
| Reviews placeholder | Existing AgentReviewsSection retained |
| Passport prep copy | Dealer storefront notes future Passport consumption |

---

## 3. Marketplace Trust Report

| Item | Status |
|------|--------|
| Safety notice (property/vehicle) | `MarketplaceSafetyNotice` |
| Report workflow on vehicles | Reuses `ReportListingForm` |
| Freshness / moderation messaging | Create form + discovery copy |
| Fraud / WhatsApp guidance | Trust copy module (no Trust Runtime) |
| Passport messaging | Explicit “consume later” language |

---

## 4. Search Excellence Report

| Item | Status |
|------|--------|
| Property ↔ Vehicle switcher | On `/search` and `/vehicles` |
| Vehicle filters / sort | Category, condition, price/featured sorts |
| Featured ranking | Featured-first default + featured rail |
| Empty states | Improved vehicle empty CTA |
| Card href consistency | `listingPath` on PropertyCard + VehicleCard |
| Saved / recent | Asset-aware links |

---

## 5. Lex Operations Report

| Item | Status |
|------|--------|
| Property / Vehicle moderation filter | Sprint I + retained |
| Dealers directory filter | Added (`dealers` in users directory) |
| Bulk actions | Existing property moderate APIs apply to vehicle rows |
| Marketplace analytics split | Still aggregate — debt item |
| Feature flags | `.env.example` documents vehicle gate |

---

## 6. UX Excellence Report

| Item | Status |
|------|--------|
| Mobile discovery | Vertical switcher; bottom nav unchanged (locked) |
| Empty / loading | Vehicle empty + skeletons retained on search |
| Agent UX | Dual CTAs Property / Vehicle; draft banners |
| Accessibility | Save button aria-labels; existing patterns |
| Remaining | Full a11y audit / tablet-specific pass not exhaustive |

---

## 7. Production Readiness Report

| Gate | Status |
|------|--------|
| Typecheck | Run after changes |
| Migration applied | **HOLD** (per instruction) |
| RLS / FKs | Unchanged physical table — migration ready |
| SEO | Vehicle metadata pages present |
| PWA / robots / sitemap | Property sitemap dominant; vehicle URLs need sitemap inclusion before launch |
| Monitoring / backups | Prior launch docs still apply |

---

## 8. Listings Migration Readiness Report

Migration: `supabase/migrations/20260722180232_marketplace_listings_ssot.sql`

| Check | Assessment |
|-------|------------|
| Non-destructive | Additive columns + view + dealer account_type |
| FK preservation | Yes — physical `properties` retained |
| Rollback | Drop view + columns (document in apply runbook) |
| App dependency | Vehicles **require** columns; do not enable traffic before apply |
| Apply order | Commit → apply migration → deploy Coolify → UAT |

**Recommendation:** Migration is **safe to apply after commit approval**, once Sprint II is accepted. Still **do not apply now**.

---

## 9. Remaining Technical Debt

1. Vehicle URLs in `sitemap.ts`  
2. Dedicated `/dealers/[slug]` alias (optional)  
3. Lex analytics split by `asset_type`  
4. Soft-edit without full unpublish (property)  
5. Server-side drafts  
6. Passport/Trust SDK consumption when Stankings ready  
7. Vehicle-specific promote modal copy  

---

## 10. Final GO / NO-GO

### Marketplace product (code): **CONDITIONAL GO**

GO to **commit + apply migration + deploy** after founder approval of this sprint, provided:

1. Migration applied to `hlpojfurfldvcxfxhveg` immediately before/with deploy  
2. Coolify env keeps `ENABLE_VEHICLE_MARKETPLACE` intentional  
3. UAT: create vehicle → Lex approve → public detail → save/share/WhatsApp  
4. Confirm property search still excludes vehicles  

### NO-GO

- Applying migration before commit review  
- Implementing Identity/Passport/Trust engines in Yike  
- Treating Vehicle as production-complete without migration + UAT  

**Overall platform readiness after Sprint II (code):** ≈ **82%** (up from ~76%), with production Vehicle readiness gated on migration apply.
