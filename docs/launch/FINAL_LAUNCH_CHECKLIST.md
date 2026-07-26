# Final Launch Checklist — RC1

**Date:** 2026-07-26  
**Build under test:** `135aa972`+ (this sprint)  
**Method:** Code review + production HTTP probes + Supabase privilege checks.  
**Founder FAT (signed-in journeys):** required for PASS on seller/buyer auth flows.

Legend: **PASS** · **FAIL** · **BLOCKED** (needs founder session / ops)

---

## Platform health

| Item | Status | Evidence |
|------|--------|----------|
| `/api/public-health` status ok | **PASS** | `signupReady`, `vehicleMarketplace` true |
| Vehicles flagship on | **PASS** | `diagnostics.vehicleMarketplace: true` |
| Production commit reported | **PASS** | `135aa972…` (version still `0.0.0` — ops polish) |

---

## Routes (guest HTTP)

| Route | Status | Notes |
|-------|--------|-------|
| `/` Home | **PASS** | 200, no soft-404 |
| `/discover` | **PASS** | 200 |
| `/vehicles` | **PASS** | 200 browse UI |
| `/search` (properties browse) | **PASS** | 200 |
| `/properties` index | **PASS** | → `/search` |
| `/saved` | **PASS** | 200 |
| `/safety` Help | **PASS** | 200 |
| `/messages` | **PASS** | → `/contact` |
| `/sell` / Seller entry | **PASS** | → login or `/agent/verify` |
| `/account` / Profile | **PASS** | → `/agent` (login) |
| `/agent/edit-profile` | **PASS** | → login with next |
| `/agent/verify` | **PASS** | → login with next |
| `/lex` Admin | **PASS** | Staff gate (layout) |
| Listing detail `/properties/:slug` | **PASS** | Route exists; sample depends on inventory |
| Dealer `/agents/:slug` | **PASS** | Route exists |

---

## Founder Acceptance Test (signed-in)

| Flow | Status | Notes |
|------|--------|-------|
| Seller Verification | **BLOCKED** | Code+schema fixed (`cacbbd22`); needs live Complete Verification |
| Edit Profile | **BLOCKED** | Route `/agent/edit-profile` shipped; needs live save |
| Profile persistence | **BLOCKED** | Depends on Edit Profile FAT |
| Create Vehicle Listing | **BLOCKED** | Needs seller session + media |
| Create Property Listing | **BLOCKED** | Needs seller session + media |
| Upload Images | **BLOCKED** | Media pipeline in place; needs live upload |
| Publish Listing | **BLOCKED** | Needs Lex approve or auto path |
| Saved Listings | **BLOCKED** | Guest `/saved` loads; signed-in save needs FAT |
| Contact Seller (WhatsApp) | **BLOCKED** | CTA present; needs live listing |
| Dealer Profile | **BLOCKED** | Needs live agent slug |
| Logout/Login persistence | **BLOCKED** | PIN login RPC intact; needs FAT |

---

## Security / RLS

| Item | Status | Evidence |
|------|--------|----------|
| `pin_hash` not selectable by anon | **PASS** | `has_column_privilege(..., false)` |
| `admin_pin_hash` not selectable by anon/authenticated | **PASS** | same |
| `full_name` / `has_pin_set` still readable | **PASS** | privileges true |
| `service_role` retains pin_hash SELECT | **PASS** | true |
| PIN login RPC `yike_pin_login_lookup` | **PASS** | SECURITY DEFINER present |
| Unlock / sensitive confirm use admin for hash | **PASS** | code updated this sprint |

---

## Interactions / UI

| Item | Status | Notes |
|------|--------|-------|
| Edit Profile dead tap | **PASS** | Fixed earlier |
| `/vehicles` soft-404 | **PASS** | Fixed earlier |
| Mobile inventory-first home | **PASS** | Restored; no HomeMobileHero on `/` |
| Footer Vehicles gated | **PASS** | Matches flag |
| Dead `href="#"` consumer | **PASS** | Audit: none live |

---

## Mobile / errors / performance

| Item | Status | Notes |
|------|--------|-------|
| ScrollRetention popstate-only | **PASS** | Prior fix |
| Sticky Vehicles\|Properties | **PASS** | Inventory-first chrome |
| Global error copy actionable | **PASS** | Updated this sprint |
| Critical API 503 copy | **PASS** | Seller verify, listing create, avatar |
| Image / media pipeline | **PASS** | Existing; no regression introduced |
| Avatar/cover 15MB cap | **PASS** | Prior hardening |

---

## Open blockers to READY FOR LAUNCH

1. **Founder FAT** on all signed-in rows above → change BLOCKED → PASS/FAIL.  
2. Coolify `version: 0.0.0` hygiene (non-blocking).  
3. Careers CV unauthenticated upload (P1 — post-launch acceptable if freeze holds).

When FAT rows are PASS, update [LAUNCH_CERTIFICATION.md](./LAUNCH_CERTIFICATION.md) verdict to **READY FOR LAUNCH**.
