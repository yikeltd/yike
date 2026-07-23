# Environment Validation Report — Launch Candidate

**Date:** 2026-07-23  
**Rule:** Checklist only — **no secret values** recorded.

## Identity

| Item | Expected | Observed |
|------|----------|----------|
| Supabase ref | `hlpojfurfldvcxfxhveg` | Match (`PROJECT_IDENTITY.md`, `config.toml`, `.temp/project-ref`) |
| Domain | https://yike.ng | Match |
| Deploy | Coolify ← `main` | Founder confirmed; push triggers deploy |

## Coolify / production (founder-confirmed)

Founder stated Coolify application env is already populated. Local agent did **not** re-read Coolify secrets.

### Required (must be set in Coolify — names only)

- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY` — inferred OK via prod `/api/public-health` (`supabaseServiceRole: true`)
- [x] `YIKE_OTP_SERVER_TOKEN` — inferred OK (`yikeOtpServerToken: true`)
- [x] `ENABLE_EMAIL_OTP` / signup path — `signupReady: true`, `emailOtpEnabled: true`
- [ ] `NEXT_PUBLIC_SITE_URL` — confirm `https://yike.ng` in Coolify
- [ ] `CRON_SECRET` — confirm set (local start warned if absent in `.env.local`)
- [ ] `SENDCHAMP_PUBLIC_KEY` / `SENDCHAMP_API_KEY` — required for seller SMS OTP
- [ ] `SENDCHAMP_WEBHOOK_SECRET` — recommended
- [ ] `SENDCHAMP_SMS_SENDER` — production sender `YIKE`
- [ ] `ENABLE_PHONE_OTP` / `ENABLE_SMS_OTP` / `NEXT_PUBLIC_ENABLE_PHONE_OTP` — align with `.env.example`
- [ ] `ENABLE_WHATSAPP_OTP=false` / `NEXT_PUBLIC_ENABLE_WHATSAPP_OTP=false` (SMS-only OTP)

### Observed from public health (no secrets)

```json
{"status":"ok","signupReady":true,"emailOtpEnabled":true,"yikeOtpServerToken":true,"supabaseServiceRole":true,"otpDbClient":true}
```

## Local `.env.local`

Present for development. **Never commit.** `npm run start` without full Coolify secrets logs validation warnings — expected.

## Action

Rotate Sendchamp credentials if previously exposed; update Coolify only (do not paste keys into chat/git).
