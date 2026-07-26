# Production Hardening Audit — RC1

**Date:** 2026-07-26  
**Role:** Principal engineering release review  
**Scope:** Launch-critical consumer + seller + staff paths  
**Authority:** Feature freeze ACTIVE — no redesign, no features  

**Production probe (this audit):**

| Signal | Value |
|--------|--------|
| Health | `status: ok` · `signupReady: true` · `vehicleMarketplace: true` |
| Deploy commit | `3a694eb0` (inventory-first home restore) |
| `/vehicles` | **200**, real browse UI (no soft-404 digest) |
| Alias redirects | `/sell` `/account` `/help` `/messages` `/properties` `/swipe` `/browse` → valid destinations |

---

## 1. Executive Summary

Yike is past feature build and into **stabilize-for-launch**. Recent P0 UX/integration defects (Edit Profile dead tap, `/vehicles` soft-404, seller verification schema drift, mobile hero regression, footer scroll) are **fixed in code and largely reflected on production**.

This audit did **not** find a new wave of broken consumer routes. Remaining blockers are:

1. **Founder FAT still unchecked** on seller verification, edit profile, and full journey smoke.  
2. **Security hardening** (profiles column exposure; unauthenticated CV upload).  
3. **Ops discipline** (Coolify commit/version injection still flaky — `version: 0.0.0`).  
4. **Inventory / supply** (business launch risk — not an engineering defect).

**Recommendation: READY AFTER P0 FIXES** (security + completed founder FAT).  
Do **not** merge new features until this report says **READY FOR LAUNCH**.

---

## 2. Launch Readiness Score: **74 / 100**

| Area | Score | Notes |
|------|------:|-------|
| Routes / navigation | 16/20 | Aliases fixed; catch-all soft-404 remains for unknowns |
| Interactions / account | 14/20 | Edit Profile fixed; FAT unchecked |
| Seller / listings | 12/20 | Schema fix shipped; e2e FAT unchecked; supply thin |
| Security | 10/20 | Strong recent migrations; profiles pin columns + CV upload remain |
| Performance / mobile | 12/15 | Inventory-first restored; ScrollRetention fixed |
| Observability / ops | 5/10 | Health useful; deploy metadata incomplete |
| Docs / freeze discipline | 5/5 | Freeze + approved UI freeze active |

---

## 3. P0 — Must fix before launch

| ID | Finding | Evidence | Action |
|----|---------|----------|--------|
| P0-1 | **Founder FAT incomplete** on seller verification → list → publish | `SELLER_VERIFICATION_FIX.md` checklist open | Run Complete Verification + create listing on prod |
| P0-2 | **Founder FAT incomplete** on Account → Edit Profile → save/avatar | `INTERACTION_AUDIT.md` checklist open | Buyer + complete seller paths |
| P0-3 | **`profiles` SELECT may expose `pin_hash` / `admin_pin_hash`** to clients | Broad RLS “non-banned profiles”; hashes used by login | **CLOSED 2026-07-26** — column grants exclude hashes for anon/authenticated; verified `has_column_privilege=false`; PIN via RPC/service_role |
| P0-4 | **Live supply / soft-launch framing** | Launch command center: thin approved inventory | Ops/founder — not a code bug |

---

## 4. P1 — Fix if time permits

| ID | Finding | Action |
|----|---------|--------|
| P1-1 | Unauthenticated `POST /api/careers/upload-cv` (DoS / abuse) | Auth, captcha, or strict rate limit |
| P1-2 | `/lex` and `/agent` not middleware-gated (layout/page auth only) | Optional middleware staff/auth gate except login |
| P1-3 | `verification_control_config` SELECT for any authenticated user | Restrict to staff/service |
| P1-4 | `/agent/verification` client-only redirect page | Server `requireAuth` in layout or page |
| P1-5 | Coolify `version: 0.0.0` / intermittent null commit | Ensure build-args injected every deploy |
| P1-6 | Schema-drift watch: columns marked applied but missing historically | Keep seller-verification retry; smoke after deploys |

---

## 5. P2 — Safe after launch

| ID | Finding | Action |
|----|---------|--------|
| P2-1 | Public catch-all soft-404 (HTTP 200 + fallback UI) | Accept for SEO unknowns; expand alias table as needed |
| P2-2 | Listing create / seller-verification lack outer try/catch | Harden to JSON 500 |
| P2-3 | Public ad impression/click + contact-click (service role) | Rate limit / abuse monitoring |
| P2-4 | Avatar/cover raw size (partially fixed this audit) | Already aligned to 15MB pre-buffer |
| P2-5 | Unreachable `browse/page.tsx` / `post-property/page.tsx` behind redirects | Delete or document as intentional landings |
| P2-6 | Bottom nav = Home·Saved·Discover·Sell·Account (not Search/Swipe labels) | Product decision — keep |

---

## 6. P3 — Technical debt

| ID | Finding | Classification |
|----|---------|----------------|
| P3-1 | ~20 orphaned `src/components/home/*` legacy modules | **SAFE TO REMOVE** (batch PR) |
| P3-2 | `home-search-hero` / `HomeMobileHero` chain unused on `/` | **SAFE TO REMOVE** (keep until freeze ends if rollback desired) |
| P3-3 | `app-shell.tsx` / alias bottom-nav wrappers unused | **REVIEW** |
| P3-4 | 127 admin API routes — large surface | **KEEP** (staff Lex) |
| P3-5 | MIME trust on CAC/seller docs | **REVIEW** magic-byte check |

---

## 7. Dead code removed

**This audit:** none deleted (conservative).  

**Documented SAFE TO REMOVE:** orphaned home hero/search/hotspot cluster (~20 files). Tree-shaken if unimported — low runtime risk; cleanup PR post-FAT.

---

## 8. Broken links fixed (prior + this sprint)

| Issue | Fix |
|-------|-----|
| Account → Edit Profile dead tap | `/agent/edit-profile` (`a0d7ddac`) |
| Footer `/vehicles` → soft-404 | Flagship always on (`4d13d931`) |
| Aliases `/sell` `/account` `/help` `/messages` `/properties` | Redirects (`4d13d931`) |
| `/swipe` config → `/browse` vs middleware → `/discover` | **Aligned to `/discover` this audit** |

---

## 9. Broken routes fixed

| Route | Status on prod (2026-07-26) |
|-------|------------------------------|
| `/vehicles` | 200 browse UI |
| `/sell` | → login?next=/agent/verify or verify |
| `/account` | → `/agent` (login if needed) |
| `/help` | → `/safety` |
| `/messages` | → `/contact` |
| `/properties` | → `/search` |
| `/browse` `/swipe` | → `/discover` |
| `/agent/edit-profile` | 307 → login with next (expected unauth) |

---

## 10. UI regressions restored

| Regression | Commit | Status |
|------------|--------|--------|
| Mobile `HomeMobileHero` remounted in `8cafa761` | Restored inventory-first `3a694eb0` | Prod HTML: no `HomeMobileHero`; Featured present |
| Popular cities oversized cards | `618f2d2f` | Kept |
| Footer scroll jump | `8cafa761` ScrollRetention | Kept |
| Approved UI freeze | `docs/launch/APPROVED_UI_FREEZE.md` | Active |

---

## 11. Security findings

**Solid:** project ref match; recent deny-by-default RLS; RPC revoke; privileged profile column trigger; private media archive; admin API helpers; cron/webhook fail-closed; no secrets in git.

**Open:**

- **P0-3** pin hash / sensitive profile columns via broad SELECT  
- **P1-1** careers CV upload unauthenticated  
- **P1-2/3** middleware / config exposure  

**Fixed this audit:** avatar + cover **15MB raw upload cap** before buffering.

---

## 12. Performance findings

| Item | Status |
|------|--------|
| Inventory-first mobile (less hero JS on `/`) | Restored |
| Listing media pipeline / WebP | In place |
| SW `/_next/` network-only | Shipped earlier |
| Bundle of orphaned home components | Not in graph if unused — cleanup optional |
| Soft N+1 / rail query cost | Monitor with real inventory growth (P2) |

---

## 13. Database findings

| Item | Status |
|------|--------|
| Seller `listing_rules_accepted_at` drift | Fixed + API retry (`cacbbd22`) |
| Launch privileged column trigger | Present |
| Media protection assets | Present |
| Full index/N+1 audit | Not exhaustively re-run — no new migration proposed here |
| Profiles public SELECT breadth | **P0-3** |

---

## 14. Accessibility findings

| Item | Status |
|------|--------|
| Focus / 44px targets (YDS) | Generally followed on primary CTAs |
| Reduced motion | Prefer existing tokens |
| Systematic a11y pass | **P2** — sample primary flows in FAT |
| Disabled settings rows | “Soon” non-interactive (Account) |

---

## 15. Remaining risks

1. Shipping features before FAT completes reintroduces regressions.  
2. PIN column exposure if PostgREST allows `select *` on profiles.  
3. Careers CV abuse.  
4. Thin live inventory vs marketing promise.  
5. Deploy metadata incomplete → harder incident response.  
6. Large Lex surface — keep staff-only; don’t expose consumer Command Center.

---

## 16. Journey trace (Phase 1)

| Journey | Route / system | Status |
|---------|----------------|--------|
| Guest → Home | `/` | OK — inventory-first mobile |
| Search | `/search` + header search | OK |
| Discover | `/discover` | OK |
| Vehicles browse / detail | `/vehicles`, `/vehicles/[slug]` | OK when flagship on |
| Property detail | `/properties/[slug]` | OK |
| Registration / Login | `/auth/signup`, `/auth/login` | Health signupReady true |
| Profile / Account | `/agent`, Edit Profile | Code OK — **FAT open** |
| Seller verification | `/agent/verify`, API | Code OK — **FAT open** |
| Create listing / upload / publish | `/agent/listings/*`, media API | Code path present — **FAT open** |
| Saved | `/saved` | OK |
| Messages | `/messages` → `/contact` | Intentional (WhatsApp-first) |
| Logout | Account actions | Present |
| Admin moderation | `/lex/*` | Staff layouts gated |
| Approval → live | Lex listings | Staff workflow |

---

## 17. Automatic fixes applied this audit

| Fix | File |
|-----|------|
| Align `/swipe`, `/swipe-homes`, `/browse` → `/discover` in next.config | `next.config.ts` |
| Avatar raw upload ≤ 15MB | `src/app/api/profile/avatar/route.ts` |
| Cover raw upload ≤ 15MB | `src/app/api/profile/cover/route.ts` |
| This document + freeze gate wording | `docs/launch/*` |

---

## 18. Final recommendation

### **READY AFTER P0 FIXES**

**Before flipping to READY FOR LAUNCH:**

1. Complete founder FAT (P0-1, P0-2).  
2. Schedule security fix for profiles sensitive columns (P0-3) with PIN-login regression test.  
3. Confirm Coolify build injects commit/version.  
4. Agree soft-launch inventory framing (P0-4).

### Process rule (locked)

> **No new features merge to `main` until every P0 is resolved and this audit is updated to READY FOR LAUNCH.**

Allowed meanwhile: security fixes, production bugs, launch blockers, performance without surface change, docs.

See also: [FEATURE_FREEZE.md](./FEATURE_FREEZE.md) · [APPROVED_UI_FREEZE.md](./APPROVED_UI_FREEZE.md) · [NAVIGATION_AUDIT.md](./NAVIGATION_AUDIT.md) · [INTERACTION_AUDIT.md](./INTERACTION_AUDIT.md) · [UI_REGRESSION_REPORT.md](./UI_REGRESSION_REPORT.md)
