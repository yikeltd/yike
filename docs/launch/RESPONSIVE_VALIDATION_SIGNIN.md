# Responsive Validation Report — Sign-in

**Status:** Ready for founder review — **no commit**  
**Route:** `/auth/login`  
**Date:** 2026-07-23

## Shell layout (shared with signup)

| Breakpoint | Behavior |
|------------|----------|
| All widths | `max-w-md` centered column; mesh hero + elevated card |
| Mobile | Safe-area top/bottom padding; full-width inputs `h-12`; full-width CTA |
| Desktop | Same composition — calm entry, not a marketing split |

## Checks

| Check | Result |
|-------|--------|
| Logo centered | Pass |
| Welcome Back + subtitle centered (`centered` prop) | Pass |
| No left-aligned marketing bullets under hero | Pass |
| Card floats over mesh (`-mt-10`) without overflow | Pass (unchanged AuthShell) |
| Footer links centered under card | Pass |
| Form spacing `space-y-5` (signup parity) | Pass |
| PIN reveal + Forgot PIN? usable on narrow screens | Pass (right-aligned link, tap target text-sm) |
| Quick-PIN pad (returning device) | Unchanged; still compact shell |

## Manual preview checklist

1. `http://127.0.0.1:3000/auth/login` at ~390px — single column, no trust list, generous whitespace  
2. ≥1024px — same calm form; no desktop marketing rail  
3. Compare `/auth/signup` — matching centered welcome typography/spacing language  

## Commit

**None** — hold until founder review.
