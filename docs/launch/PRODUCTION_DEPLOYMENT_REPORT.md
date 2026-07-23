# Production Deployment Report — Launch Candidate

**Date:** 2026-07-23  
**Application:** Yike (`yike.ng`)  
**Supabase:** `hlpojfurfldvcxfxhveg`  
**Deploy path:** Push to `origin/main` → Coolify (GitHub App) on Hetzner  
**Verdict:** **GO** (migrations + build + local smoke + prod health)

## Summary

Marketplace launch candidate shipped: inventory-first home, seller trust/onboarding timestamps, location-aware discovery, homepage ad slots 1–5, PIN/phone auth hardening. No new cosmetic UI in this ship gate.

## Migrations

| Migration | Status |
|-----------|--------|
| `20260723153614_seller_verification_onboarding_v1` | **Applied** (remote = local) |
| `20260723170007_homepage_ad_slots_v1` | **Applied** (remote = local) |

**Safety:** `npm run verify:supabase-project -- --require-linked` → **PASS** (config.toml + `.temp/project-ref` = `hlpojfurfldvcxfxhveg`).

**Fix during apply:** seller migration initially failed (`profiles.updated_at` does not exist). SQL corrected to use `created_at` / `whatsapp_verified_at` only; re-pushed successfully. Failed attempt was **not** recorded on remote.

## Build

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0, Next.js 16.2.7 webpack) |

## Git / deploy

| Item | Value |
|------|-------|
| Branch | `main` |
| Commit | `7172aa7314ee3f91c6cb810219af07435869298f` (`7172aa73`) |
| Push | `origin/main` |
| Coolify | Auto-deploy from `main` (confirm in control.stankings.com) |

## Production pre-ship health (existing deploy)

`GET https://yike.ng/api/public-health` → **200**

- `status: ok`, `signupReady: true`, `emailOtpEnabled: true`
- `yikeOtpServerToken`, `supabaseServiceRole`, `otpDbClient` present

Post-push: wait for Coolify build, then re-check health + consumer routes on https://yike.ng.

## Reminder

If Sendchamp keys were exposed in an earlier session, **rotate** Public Key / API key in Sendchamp and update Coolify env.
