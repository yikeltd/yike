# Progressive Web App Validation Report

**Status:** Implemented — **hold commit**  
**Date:** 2026-07-23

## PWA surface

| Asset | Role |
|-------|------|
| `public/sw.js?v=33` | Offline documents, images, listing warm cache |
| `src/components/pwa/register.tsx` | Register SW (skip Android TWA) |
| `public/manifest.json` | Install metadata |
| `/offline` | Cold-start branded fallback only |

## Registration rules (unchanged + version bump)

- Browser / installed PWA (non-TWA): register `/sw.js?v=33`
- Android TWA (`android-app://` referrer): **unregister** all SWs (wrapper owns connectivity)
- Standalone PWA: no auto `controllerchange` reload storm; tab browsers still hot-reload on `SKIP_WAITING`

## Offline product rules (PWA)

1. **Warm cache** → never replace homepage with full-screen offline error.
2. **Cold start** → branded `/offline` with Try Again.
3. **In-session offline** → compact banner + soft-disable network actions.
4. **Reconnect** → banner ack + `router.refresh()`.

## Validation

| Scenario | Pass criteria |
|----------|----------------|
| SW activates on localhost after visit | Registration shows `activated` for `sw.js?v=33` |
| Manifest installable (Chromium) | Icons + `display` present (pre-existing) |
| Offline after warm home | Cached `/`, banner, no fatal page |
| Offline cold | `/offline` copy matches founder brief |
| TWA | No SW registration (no double offline layer) |
| `/offline` not primary home fallback | Warm `/` cache preferred in SW catch path |

## Manual test script

```text
1. npm run dev → http://localhost:3000
2. Application → Service Workers → ensure v33 controlling
3. Online browse home + one listing
4. Network → Offline
5. Soft: stay on page → banner only
6. Hard reload → still homepage from cache
7. Clear site data → Offline → open / → branded offline + Try Again
8. Online → Try Again → homepage loads; SW re-warms
```

## Risks / notes

- Users on **old SW v32** until they get a controlling update; query `?v=33` + `skipWaiting` in browser tabs accelerates pickup.
- Production Coolify must serve `/sw.js` with existing `Cache-Control: no-cache` header (`next.config.ts`).
