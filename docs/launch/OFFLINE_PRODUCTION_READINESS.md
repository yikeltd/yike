# Production Readiness Report — Offline Experience

**Status:** GO after founder review — **do not commit until approved**  
**Date:** 2026-07-23  
**Feature:** Offline = temporary state (warm homepage + banner); cold-start branded `/offline` only

## GO / HOLD

| Gate | Result |
|------|--------|
| Product behavior matches founder brief | **GO** (implemented) |
| No marketplace redesign | **GO** |
| SW prefers cached `/` over `/offline` when warm | **GO** |
| Compact banner + reconnect | **GO** |
| Soft-disable publish / search / sign-in | **GO** (practical) |
| Commit / push | **HOLD** — founder review required |
| Migrations | **N/A** — no schema |

## Ship checklist (after approval)

1. Founder review of local DevTools offline scenarios (see Offline Experience Report).
2. Commit + push `main` (Coolify webhook).
3. Production smoke: https://yike.ng → hard refresh → confirm SW `v33` → Offline reload still shows home when previously visited.
4. Spot-check `/offline` direct URL still branded (cold path).

## Rollback

- Revert SW to prior navigation-only `/offline` fallback and remove banner components.
- Bump SW query string again so clients drop v33.

## Residual risk

| Risk | Mitigation |
|------|------------|
| Stale cached homepage HTML | Reconnect `router.refresh()`; network-first when online |
| Client navigations without warm RSC | Soft-disable search; keep current view |
| Old SW sticky in long-lived tabs | `?v=33` + SKIP_WAITING for browser tabs |

## Related docs

- [OFFLINE_EXPERIENCE_REPORT.md](./OFFLINE_EXPERIENCE_REPORT.md)
- [CACHE_VALIDATION_REPORT.md](./CACHE_VALIDATION_REPORT.md)
- [PWA_VALIDATION_REPORT.md](./PWA_VALIDATION_REPORT.md)

## Confirm

**No commit was created for this work.**
