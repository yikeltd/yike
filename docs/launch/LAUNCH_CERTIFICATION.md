# Launch Certification — Yike RC1

**Date:** 2026-07-26  
**Auditor:** Principal engineering release review (Cursor)  
**Companion checklist:** [FINAL_LAUNCH_CHECKLIST.md](./FINAL_LAUNCH_CHECKLIST.md)  
**Hardening audit:** [PRODUCTION_HARDENING_AUDIT.md](./PRODUCTION_HARDENING_AUDIT.md)

---

## Final Verdict

# **NOT READY**

**Reason:** Engineering P0s for routes, vehicles, Edit Profile navigation, seller-verification schema, mobile hero regression, and **profiles PIN hash column exposure** are addressed in code/DB. **Signed-in Founder Acceptance Testing is still BLOCKED** (no live session exercised in this sprint). Launch requires FAT PASS on seller + buyer critical paths.

Re-certify to **READY FOR LAUNCH** only after checklist FAT rows flip to PASS with no P0 FAIL.

---

## Build status

| Check | Result |
|-------|--------|
| Production health | `ok` · commit `135aa972` (pre this push) |
| Feature freeze | ACTIVE — no new features |
| Approved UI freeze | ACTIVE |
| TypeScript | Changed auth/profile paths typecheck clean (filtered); full `tsc` not blocking Coolify historically |

---

## Routes

| Area | Result |
|------|--------|
| Consumer core | **PASS** (200 / redirects) |
| Vehicles | **PASS** |
| Aliases (`/sell` `/account` `/help` `/messages` `/properties` `/swipe`) | **PASS** |
| Admin `/lex` | **PASS** (staff layouts) |
| Soft-404 unknowns | Acceptable catch-all fallback |

---

## Authentication

| Area | Result |
|------|--------|
| Signup readiness (health) | **PASS** |
| Password login API | **PASS** (no longer selects `pin_hash` via user client) |
| PIN login RPC | **PASS** (`yike_pin_login_lookup` SECURITY DEFINER) |
| Session unlock / sensitive confirm | **PASS** (service_role for hash read) |
| Live login/logout FAT | **BLOCKED** (founder) |

---

## Seller flow

| Area | Result |
|------|--------|
| Become / verify routes | **PASS** (redirects) |
| Seller verification API + schema | **PASS** (code); **BLOCKED** live FAT |
| Listing create / media | **PASS** (code + actionable 503s); **BLOCKED** live FAT |
| Publish / Lex approve | **BLOCKED** FAT |

---

## Buyer flow

| Area | Result |
|------|--------|
| Home / search / discover / vehicles | **PASS** |
| Saved / contact WhatsApp | **BLOCKED** FAT |
| Dealer profile | **BLOCKED** FAT |

---

## Admin flow

| Area | Result |
|------|--------|
| Lex console auth helpers | **PASS** (layout gates) |
| Moderation path | **BLOCKED** FAT with staff account |

---

## RLS / Security

| Area | Result |
|------|--------|
| `pin_hash` / `admin_pin_hash` denied to anon + authenticated | **PASS** (verified `has_column_privilege` = false) |
| Public profile fields still readable | **PASS** |
| service_role retains hash access | **PASS** |
| PIN auth path | **PASS** (RPC + admin fallback) |
| Migrations | `launch_revoke_profile_pin_hash_columns` + `launch_profiles_pin_hash_column_grants` applied on `hlpojfurfldvcxfxhveg` |

---

## Performance

| Area | Result |
|------|--------|
| Inventory-first mobile home | **PASS** |
| Media pipeline / upload caps | **PASS** |
| No intentional perf regressions this sprint | **PASS** |

---

## Remaining risks

1. Founder FAT incomplete → unknown prod auth/seller edge cases.  
2. Thin live inventory vs marketplace promise.  
3. Careers CV upload still unauthenticated (P1).  
4. Coolify `version: 0.0.0` metadata.  
5. Large Lex API surface — keep staff-only.

---

## Certification rule

No feature merges until verdict is **READY FOR LAUNCH** and every checklist P0/FAT row is **PASS** (see FEATURE_FREEZE hardening gate).
