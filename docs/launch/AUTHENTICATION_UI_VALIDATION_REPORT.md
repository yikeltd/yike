# Authentication UI Validation Report — Sign-in

**Status:** Ready for founder review — **no commit**  
**Route:** `/auth/login`  
**Date:** 2026-07-23

## Validation matrix

| Check | Expected | Result |
|-------|----------|--------|
| Title | Welcome Back (centered) | Pass |
| Subtitle | Continue where you left off. | Pass |
| AuthShell | `compact` + `centered` (matches signup) | Pass |
| Trust bullet list | Hidden | Pass (0 hits for Verified listers / Rent buy / WhatsApp listing promo) |
| City trust strip | Hidden | Pass |
| Email label | Email Address | Pass |
| Email placeholder | None | Pass |
| PIN label | PIN | Pass |
| PIN helper | Use your 6-digit PIN to sign in. | Pass |
| Recovery | Forgot PIN? → `/auth/forgot-password` | Pass (route unchanged) |
| Primary CTA | Sign In | Pass |
| Footer | New to Yike? + Create your account | Pass |
| API contract | `identifier` + `password` (≥6) | Unchanged |
| Username UI | Removed from labels | Pass — backend `resolveLoginEmail` still supports username |

## API / UX alignment

| Behavior | UI | Server |
|----------|----|--------|
| Email sign-in | `type="email"`, label Email Address | Resolves email via profiles |
| Username | Not offered | Still accepted if sent as `identifier` without `@` |
| 6-digit PIN | Primary label + helper | `signInWithPassword` with PIN-as-password |
| Legacy password (≥6, longer) | Same PIN field (no extra copy) | Still accepted |

## Out of scope (unchanged)

- Email OTP modal / PIN setup modal
- Quick-PIN pad for remembered device
- Forgot-password page copy (“Reset your password”) — recovery route only renamed in login link
- Auth architecture, rate limits, trusted device

## Local smoke

- `GET /auth/login` → **200**
- No AuthShell marketing strings in page body

## Commit

**None** — hold until founder review.
