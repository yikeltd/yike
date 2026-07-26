# Post-Deploy Hotfix Report

**Date:** 2026-07-26  
**Repo HEAD at investigation:** `cacbbd22` (`fix(seller): restore missing profiles.listing_rules_accepted_at`)  
**Hotfix commit:** (this change set)

---

## 1. Stale / missing UI — root cause

### What we verified live

| Probe | Result |
|-------|--------|
| GitHub `main` | `cacbbd22…` |
| `GET /api/public-health` | `commit: null`, `version: "0.0.0"`, `uptime` resetting (redeploys in progress) |
| Coolify commit injection | **Not wired** — health cannot prove which SHA is running |
| Service worker | Network-first for `navigate`; documents warmed into `yike-listings-*` |
| Homepage composition | Mobile **did not render** `HomeMobileHero` — only desktop hero (`lg:block`) + sticky toggle |

### Exact reasons latest UI “wasn’t appearing”

1. **No deploy SHA in the running container**  
   Standalone runtime + missing `COOLIFY_SOURCE_COMMIT` / `GIT_COMMIT_SHA` / `APP_VERSION` → health shows `commit: null` and `version: 0.0.0`. Operators cannot confirm Coolify rebuilt from latest `main`.

2. **Homepage mobile chrome was structurally absent**  
   `HomeMarketplaceExperience` never mounted `HomeMobileHero`. Mobile users only saw Vehicles|Properties + rails. That looks like a “failed deploy of homepage improvements” even when the container is current.

3. **PWA cache hygiene**  
   SW could theoretically match non-navigate requests from cache; `_next/` assets are now forced network-only and cache names bumped (`v34` / `v7` / `v6`) so installs drop old shells after activate.

### Fixes

- Dockerfile: accept/pass `COOLIFY_SOURCE_COMMIT`, `SOURCE_COMMIT`, `GIT_COMMIT_SHA`, `APP_VERSION`; copy `package.json` into runner for version fallback.
- `deploy-metadata.ts`: also read `SOURCE_COMMIT`.
- Restore mobile hero above sticky category control.
- Bump SW cache names + never cache-first `/_next/`.

**Coolify ops (founder):** enable Inject Build Variables and map `COOLIFY_SOURCE_COMMIT` (or `GIT_COMMIT_SHA`) so `/api/public-health` shows the live SHA.

---

## 2. Footer scroll bug — root cause

**File:** `src/components/retention/scroll-retention.tsx`

**Cause:** On every `pathname` change, ScrollRetention restored the last `sessionStorage` scroll Y for that path. Bottom-nav / header taps are client navigations (not Back). If the user had previously scrolled a long feed near the footer, the next visit to that route jumped straight to that Y — i.e. the footer.

**Not caused by:** footer `autofocus`, footer hash links, or `SiteFooter` itself.

**Fix:** Restore scroll **only** after `popstate` (Back/Forward). On forward navigations, force `scrollTo(0, 0)`.

---

## 3. Vehicles | Properties sticky behaviour

**File:** `src/components/home/home-marketplace-experience.tsx`

**Before:** Toggle was the first mobile content under the sticky header with `sticky top-14`, so it looked permanently fixed (no travel distance).

**After:**

- `HomeMobileHero` renders above the control (`lg:hidden`) so the toggle starts in-flow and **slides up** as the hero scrolls away.
- `StickyMarketplaceCategoryBar` uses an IntersectionObserver sentinel (`rootMargin: -56px`) to add a light pin shadow when stuck under the header — no layout jump, tab roles preserved.

---

## 4. Files changed

| File | Change |
|------|--------|
| `src/components/retention/scroll-retention.tsx` | Restore only on Back/Forward |
| `src/components/home/home-marketplace-experience.tsx` | Mobile hero + sticky pin behaviour |
| `Dockerfile` | Commit/version build-args; copy `package.json` |
| `src/lib/deploy-metadata.ts` | `SOURCE_COMMIT` fallback |
| `public/sw.js` | Cache bump + `/_next/` network-only |
| `docs/launch/POST_DEPLOY_HOTFIX_REPORT.md` | This report |

---

## 5. Validation checklist

After Coolify Ready on the hotfix SHA:

| Check | Expected |
|-------|----------|
| `/api/public-health` | Prefer non-null `commit` once Coolify injects build vars |
| Homepage mobile | Hero search + category rail visible; toggle below hero |
| Scroll home → mid-feed → tap Saved → Home | Lands at **top**, not footer |
| Browser Back from a deep scroll | Restores previous Y |
| Scroll past hero | Vehicles\|Properties pins under header with soft shadow |
| Desktop | Unchanged panoramic hero; no mobile sticky bar (`lg:hidden`) |
| Hard refresh / new SW | Cache names `v34`/`v7`/`v6`; no stale shell after activate |

Local: `npm run typecheck` after edits; preview `/` on mobile viewport before push.
