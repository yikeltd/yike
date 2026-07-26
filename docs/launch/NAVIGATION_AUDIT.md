# Navigation Audit — Broken Routes (P0)

**Date:** 2026-07-26  
**Severity:** P0 launch blocker (`/vehicles` soft-404)  
**Production commit at discovery:** `618f2d2f` (pre-fix)

---

## Exact cause (not a missing page)

`src/app/(public)/vehicles/page.tsx` **exists** and is in the production build
(`/_next/static/chunks/app/(public)/vehicles/page-…js`).

The page body called:

```ts
if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();
```

Coolify had `ENABLE_VEHICLE_MARKETPLACE=false` (or equivalent), so the server
rendered Next’s **Page not found** UI while:

- HTTP status stayed **200** (App Router soft 404)
- `<title>` still said **Vehicles | Yike** (metadata ran)
- Footer still linked to `/vehicles` (ungated)

Header SSR correctly hid the Vehicles nav item (server flag off) → **nav/footer
disagreement**.

This is an **integration / env-gate** failure, not a renamed route and not a
missing `page.tsx`.

---

## Fix applied

1. **Vehicle flagship always ON** unless
   `ENABLE_VEHICLE_MARKETPLACE_EMERGENCY_OFF=true`.
   Legacy `ENABLE_VEHICLE_MARKETPLACE=false` no longer hides `/vehicles`
   (that misconfig caused this incident).
2. **Footer** gates the Vehicles link with `isLaunchFeatureVisible`.
3. **Alias redirects** (middleware `staticPathRedirect` + `next.config` redirects):

| Alias | Destination |
|-------|-------------|
| `/sell` | `/agent/verify` |
| `/account` | `/agent` |
| `/help` | `/safety` |
| `/messages` | `/contact` (WhatsApp-first; no in-app chat) |
| `/properties` | `/search` (index only; `/properties/:slug` unchanged) |

4. **`/api/public-health`** exposes `diagnostics.vehicleMarketplace` for ops.

---

## Route validation (production, pre-fix)

| Path | HTTP | Body |
|------|------|------|
| `/` | 200 | OK |
| `/vehicles` | 200 | **soft 404** (`NEXT_HTTP_ERROR_FALLBACK;404`) |
| `/search` | 200 | OK |
| `/discover` | 200 | OK |
| `/saved` | 200 | OK (auth may redirect) |
| `/safety` | 200 | OK |
| `/buy` `/rent` `/land` | 200 | OK |
| `/browse` | 308 | → `/discover` |
| `/post-property` | 307 | → `/agent/verify` |
| `/properties` | 200 | soft 404 (catch-all) → **redirect added** |
| `/sell` | 200 | soft 404 → **redirect added** |
| `/account` | 200 | soft 404 → **redirect added** |
| `/messages` | 200 | soft 404 → **redirect added** |
| `/help` | 200 | soft 404 → **redirect added** |

Canonical routes that already exist:

- `/` · `/vehicles` · `/search` · `/discover` · `/saved` · `/safety` · `/agent` (account)
- Listing detail: `/properties/:slug` · `/vehicles/:slug`

---

## Link audit (primary chrome)

| Surface | Vehicles / aliases | Status after fix |
|---------|--------------------|------------------|
| Desktop header | `/vehicles` gated | Matches flag |
| Site footer Explore | `/vehicles` gated | Matches flag |
| Home marketplace CTAs | `/vehicles?*` | Serves when flagship on |
| Bottom nav | Home · Saved · Discover · Sell · Account | Sell/Account are actions → `/agent/verify` / auth/`/agent` |
| SW precache | `/vehicles` | Valid when page serves |

---

## Ops checklist (Coolify)

- [ ] Remove `ENABLE_VEHICLE_MARKETPLACE=false` if present (ignored for hide, but confusing).
- [ ] Do **not** set `ENABLE_VEHICLE_MARKETPLACE_EMERGENCY_OFF` unless intentionally hiding vehicles.
- [ ] After deploy: `curl -s https://yike.ng/api/public-health` → `vehicleMarketplace: true`.
- [ ] Open https://yike.ng/vehicles — must show browse UI, not “Page not found”.
- [ ] Footer **Vehicles** opens the same browse UI.
- [ ] `/sell` `/account` `/help` `/messages` `/properties` redirect (no catch-all empty state).

---

## Files changed

| File | Change |
|------|--------|
| `src/lib/launch-mode/index.ts` | Flagship always on; emergency-off only |
| `src/lib/route-redirects.ts` | Alias redirects |
| `next.config.ts` | Matching permanent/temporary redirects |
| `src/components/layout/site-footer.tsx` | Gate Vehicles link |
| `src/app/api/public-health/route.ts` | Expose vehicle flag |
| `.env.example` | Document emergency-off |
| `docs/launch/NAVIGATION_AUDIT.md` | This audit |

---

## Final validation (post-deploy)

- [ ] `/vehicles` — listing chrome, no “Page not found”
- [ ] `/properties` → `/search`
- [ ] `/sell` → sell/verify flow
- [ ] `/account` → `/agent` (login if needed)
- [ ] `/help` → `/safety`
- [ ] `/messages` → `/contact`
- [ ] No internal chrome link lands on soft 404
