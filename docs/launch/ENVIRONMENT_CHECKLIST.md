# Environment Checklist — Yike

See also `.env.example` and `docs/engineering/ENVIRONMENT_STANDARD.md`.

Runtime validation: `src/lib/env-validation.ts` (logs on Node startup).

## Required in production

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL (`hlpojfurfldvcxfxhveg`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin (Coolify only) |
| `NEXT_PUBLIC_SITE_URL` | `https://yike.ng` |
| `CRON_SECRET` | Cron / health auth |
| `YIKE_OTP_SERVER_TOKEN` | Must match DB `yike_internal_config.otp_server_token` — signup/OTP RPCs |

## Strongly recommended

| Variable | Purpose |
|----------|---------|
| `APP_ENV=production` | Forces production posture |
| `RESEND_API_KEY` | Transactional email (signup OTP delivery) |
| `SENDCHAMP_WEBHOOK_SECRET` | Webhook auth (POSTs fail closed if unset) |
| `GIT_COMMIT_SHA` / `COOLIFY_SOURCE_COMMIT` | Health metadata |

## Launch / deferred features

| Variable | Default | Notes |
|----------|---------|-------|
| `YIKE_LAUNCH_MODE` | strict in production | See `src/lib/launch-mode` |
| `ENABLE_VEHICLE_MARKETPLACE` | true unless set false | Public launch still gated by UAT / founder GO |
| `ENABLE_PASSPORT_UI` | false | Consume Passport later — no local engine |
| `ENABLE_ESCROW` / `ENABLE_WALLET` | false | BayRight owns finance |

## Never

- Commit `.env*`, `*.pem`, `*.cer`, or `safehaven-keys/`
- Bake secrets into Docker build args (except public `NEXT_PUBLIC_*`)
- Point production at non-`hlpojfurfldvcxfxhveg` Supabase refs
