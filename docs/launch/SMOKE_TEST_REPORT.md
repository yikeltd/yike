# Smoke Test Report — Launch Candidate

**Date:** 2026-07-23  
**Local server:** `npm run build` then `next start` on `127.0.0.1:3001`  
**Production:** https://yike.ng (pre-ship baseline; re-verify after Coolify deploy)

## Local (production build) — PASS

| Route | HTTP |
|-------|------|
| `/` | **200** |
| `/auth/signup` | **200** |
| `/auth/login` | **200** |
| `/vehicles` | **200** |
| `/search` | **200** |

Note: `next start` locally logged missing Coolify-only secrets in `.env.local` (`SUPABASE_SERVICE_ROLE_KEY`, etc.). Routes still returned 200. **Coolify env confirmed by founder** — local warning is not a production blocker.

## Production baseline (pre-new-deploy)

| Check | Result |
|-------|--------|
| `https://yike.ng/` | **200** |
| `https://yike.ng/api/public-health` | **200** (`signupReady: true`) |

## Not verified here (founder click-through on yike.ng after Coolify)

Do **not** treat these as done — live OTP/SMS cannot be faked:

1. **Signup** — email OTP receive + verify → session
2. **Login** — email/PIN path as configured
3. **Seller phone SMS OTP** — Sendchamp delivery + verify on `/agent/verify` (or profile phone panel)
4. **Seller profile completion** — state / address / DOB → submit for review
5. **Admin** — Lex approve/reject seller verification queue
6. **Listing create gate** — phone-verified seller can create; unverified blocked as designed
7. **Homepage** — property/vehicle toggle, rails, location picker (no crash)
8. **Ads** — empty slots collapse; live slot renders when admin activates placement
9. **Search / vehicles** — results load; WhatsApp CTA present on a listing detail

## Dev-server note

Turbopack `npm run dev` hit `EMFILE: too many open files` in this environment; smoke used **production `next start`** instead (preferred for launch candidate).
