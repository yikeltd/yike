# Cache Validation Report

**Status:** Implemented — **hold commit**  
**Date:** 2026-07-23

## Cache namespaces (SW v33)

| Cache | Purpose |
|-------|---------|
| `yike-shell-v33` | Precache: `/offline`, logo, manifest, icons |
| `yike-listings-v5` | Warmed HTML documents (`/`, listings, browse paths) + `CACHE_URL` pages |
| `yike-images-v6` | Listing CDN images (unchanged strategy) |

Old `yike-shell-v32` / `yike-listings-v4` keys are purged once via `yike-cache-reset-v33`.

## Document navigation strategy

```
navigate GET
  → network (cache: no-store)
  → on OK: put into listings cache (request + clean pathname when needed)
  → on fail: matchCachedDocument(request)
       1. exact request in listings/shell
       2. pathname only
       3. if path is `/` → cached `/`
       4. else → cached `/offline` (cold start only)
```

## Warm paths

Automatically eligible for document warm-cache:

- `/`, `/offline`, `/buy`, `/rent`, `/land`, `/vehicles`, `/search`, `/saved`, `/safety`
- `/properties/*`, `/vehicles/*`, `/agents/*`

Client helper `cachePageForOffline(path)` still posts `{ type: "CACHE_URL", url }` (used by listing view tracker + `OfflineWarmCache`).

## Validation checklist

| Check | Expected |
|-------|----------|
| First online home visit | `/` appears in `yike-listings-v5` |
| Offline hard reload of `/` with warm cache | 200 from SW cache; body is homepage shell |
| Offline hard reload with empty caches | `/offline` from shell precache |
| Image hosts offline | Stale-while-revalidate from `yike-images-v6` when previously viewed |
| Android TWA | SW still unregistered (existing TWA cleanup) — no SW offline layer in TWA |

## DevTools steps

1. Online: load `/`, open a property detail (view tracker caches listing URL).
2. Application → Cache Storage → inspect `yike-listings-v5` keys.
3. Network Offline → reload `/` → Response source should be **ServiceWorker**, URL `/` (not `/offline`).
4. Application → Clear storage → Offline → navigate `/` → `/offline` only.

## Known limits

- Next.js App Router **client** transitions still need network for RSC payloads; soft-disable covers search/login/publish. Already-rendered homepage stays in memory without relying on RSC.
- Cached HTML may be slightly stale until reconnect `router.refresh()`.
- Precache of `/offline` at install still requires that route to be reachable once online (or install fails that single entry via `Promise.allSettled`).
