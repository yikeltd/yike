# SMS OTP Live Validation — Status

**Date:** 2026-07-26  
**Decision:** **NO-GO for commit** (delivery not proven on a handset)  
**OTP fix + footer:** remain **uncommitted**

## Why validation could not finish in Cursor

| Requirement | Status |
|-------------|--------|
| Fixed code present locally (single `/verification/create`) | Yes |
| `SENDCHAMP_PUBLIC_KEY` / `SENDCHAMP_API_KEY` on this machine | **Missing** (only sender ID in `.env.local`) |
| Fix deployed to Coolify production | **No** (uncommitted) |
| Authenticated UI tap + real handset | **Not run** — blocked on key + your confirmation |

Without a live Sendchamp key, Cursor cannot honestly claim HTTP 200 / `processing` / handset delivery.

## Checklist (founder + Cursor)

| # | Check | Status |
|---|--------|--------|
| 1 | Tap Verify once | Pending |
| 2 | Exactly one `/verification/create` | Pending (code enforces; not live-proven) |
| 3 | HTTP 200 + success + processing + reference | Pending |
| 4 | Same reference in DB / `[otp-audit]` logs | Pending |
| 5 | SMS on device | Pending |
| 6 | OTP verifies | Pending |
| 7 | Resend: new OTP, old invalid, one SMS | Pending |
| 8 | Repeat 5–10× | Pending |

## How to complete (≈2 minutes + handset)

1. Add to `.env.local` (do not paste into chat):

```bash
SENDCHAMP_PUBLIC_KEY=<from app.sendchamp.com>
SENDCHAMP_LIVE_BASE_URL=https://api.sendchamp.com/api/v1
SENDCHAMP_SMS_SENDER=YIKE
```

2. Run **one** billable create (API envelope check):

```bash
TEST_PHONE=0803xxxxxxx node --env-file=.env.local scripts/validate-sms-otp-delivery.mjs
```

3. When the SMS arrives:

```bash
TEST_PHONE=0803xxxxxxx CONFIRM_SMS_RECEIVED=true \
  node --env-file=.env.local scripts/validate-sms-otp-delivery.mjs
```

(Second run sends **another** SMS unless you only need the flag for paperwork — prefer confirming once.)

Better: after step 2 succeeds and SMS arrives, reply in chat: **“SMS received, reference=&lt;id&gt;”** — then we run UI verify/resend against local/prod.

4. In the app (local with keys, or after commit+deploy): Verify OTP → Resend → repeat 5–10× while watching Coolify `[otp-audit]` for a single `sendchamp_http_response` per tap.

## Commit gate (your rule)

Approve OTP commit only when:

- One tap → one API call → one Sendchamp request → one reference → one SMS → verify OK → resend OK → no duplicate billing

Until then: **do not commit** OTP or footer.

## Script added (uncommitted)

`scripts/validate-sms-otp-delivery.mjs` — single `/verification/create`, prints full envelope, asserts success/reference, never calls `/sms/send`.
