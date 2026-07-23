# Security Review — Sendchamp SMS OTP

**Date:** 2026-07-23  
**Severity:** Credential exposure risk (founder screenshot) + OTP transport hardening

## CRITICAL — Rotate exposed Sendchamp key

A Sendchamp API bearer token may have been exposed in a screenshot. **Treat as compromised.**

### Founder actions (before production deploy)

1. Log in to [Sendchamp dashboard](https://app.sendchamp.com) → Account / API keys.
2. **Revoke / rotate** the exposed public access key (and any secret/live key if shown).
3. Create a new access key.
4. Update **Coolify** application env (never chat/Slack/docs):
   - `SENDCHAMP_PUBLIC_KEY=<new key>`
   - `SENDCHAMP_API_KEY=` (only if dashboard issues a separate live key)
5. Redeploy after env update.
6. Smoke-test one SMS OTP on a staff number.

Do **not** paste the new key into chat, commits, or screenshots.

## Repo credential hygiene

| Check | Result |
|-------|--------|
| Hardcoded Sendchamp tokens in repo | **None found** (grep clean) |
| `.env.example` placeholders only | Pass |
| Client exposure of keys | Pass — send/verify only on server API routes |
| Bearer auth only in server providers | Pass |

## OTP security controls

- Server-only OTP generation / provider confirm
- Hashed / reference-based session storage (no plaintext OTP in DB for Verification API path)
- Resend cooldown 60s
- Max 3 sends / phone / hour (seller path)
- Max 5 verify attempts per session
- 30-minute expiry
- IP hash logged on seller sessions (privacy-preserving)

## Do not

- Commit `.env.local` or Coolify exports
- Log full Authorization headers or OTP codes in production
- Expose `SENDCHAMP_*` via `NEXT_PUBLIC_*`
