# Offline Experience Report

**Status:** Implemented — **hold commit** (founder review)  
**Date:** 2026-07-23  
**Scope:** Homepage / marketplace offline UX (PWA service worker + client banner)

## Verdict

Offline is a **temporary app state**, not a fatal full-screen error, after the user has successfully loaded marketplace content.

## Behavior matrix

| Situation | UX |
|-----------|-----|
| First visit, no network, no cache | Branded full-screen `/offline`: **Yike** · No internet connection · Connect… · **Try Again** |
| Homepage loaded successfully, then network drops (no refresh) | Homepage **stays**; compact banner: “You're offline. Showing recently viewed content.” |
| Warm cache exists, hard refresh / reopen while offline | SW serves **cached homepage** (not `/offline`) + banner |
| Back online | Banner → “Back online. Refreshing…” · `router.refresh()` soft reconnect |

## What changed

1. **`public/sw.js` (v33)** — Document navigations are network-first; successful HTML is warmed into `yike-listings-v5`. On failure: match cached document (exact → pathname → `/`) **before** `/offline`.
2. **`OfflineBanner`** — Compact top toast in `ConsumerShell`; auto-reconnect messaging.
3. **`OfflineWarmCache`** — After online visits, asks SW to `CACHE_URL` for `/` and key marketplace paths.
4. **`/offline` page** — Branded cold-start copy; **Try Again** (not “Back home”).
5. Soft-disable while offline (practical, not a redesign):
   - Header **Sell** / list property
   - Universal search submit / suggestion navigation
   - Desktop **Sign in**

## Explicitly not shown (warm sessions)

- Full-screen “You're offline”
- “Check your connection” as a page replacement
- “Back home” as the primary CTA on the fatal shell

## How to test (Chrome DevTools)

1. Start `npm run dev` → open `http://localhost:3000`.
2. Wait for SW register (`Application` → Service Workers → `/sw.js?v=33` active).
3. Visit `/` online; confirm listings render.
4. `Application` → Cache Storage → `yike-listings-v5` should include `/` (or homepage request URL).
5. DevTools → Network → **Offline** (keep tab open, no reload):
   - Homepage UI remains
   - Compact offline banner appears
   - Sell / Sign in dimmed; search submit no-ops
6. Hard reload while still Offline:
   - Must show **cached homepage**, not `/offline`
7. Clear site data / unregister SW, go Offline, open `/`:
   - Full branded offline screen with **Try Again**
8. Toggle Online again → reconnect toast + soft refresh

## Files

- `public/sw.js`
- `src/components/pwa/register.tsx` (cache bump v33)
- `src/components/pwa/offline-banner.tsx`
- `src/components/pwa/offline-warm-cache.tsx`
- `src/hooks/use-online-status.ts`
- `src/lib/pwa/offline-ui.ts`
- `src/app/offline/page.tsx`
- `src/components/layout/consumer-shell.tsx`
- Soft-guards: `list-property-button.tsx`, `header-universal-search.tsx`, `auth-header-account.tsx`

## Out of scope

- Redesigning marketplace features
- Full offline RSC / client-route graph
- WhatsApp deep links (remain available when the OS app can open)
