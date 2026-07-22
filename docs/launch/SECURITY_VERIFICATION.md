# Security Verification Checklist — Yike

## Build & secrets

- [ ] `.dockerignore` excludes `.env*`, `*.pem`, `*.cer`, `safehaven-keys/`
- [ ] `.gitignore` excludes the same
- [ ] `git status` shows no untracked key material staged for commit
- [ ] Coolify env holds secrets — not Dockerfile `ENV` with secret values

## Webhooks & cron

- [ ] `SENDCHAMP_WEBHOOK_SECRET` set in production
- [ ] `POST /api/webhooks/sendchamp` without secret → 401/503 (fail closed)
- [ ] Cron routes reject missing `CRON_SECRET`

## Auth & admin

- [ ] Staff `/lex` requires authenticated staff role
- [ ] Service role key never exposed to client bundles
- [ ] OTP / session still functions after deploy

## CI

- [ ] GitHub Actions `PR Checks` green on `main` (lint · typecheck · build)

## Supabase

- [ ] Linked / verified project ref = `hlpojfurfldvcxfxhveg`
- [ ] No migrations applied to wrong project

## Regression from audit P0

| ID | Check | Expected |
|----|-------|----------|
| P0-1 | Docker context | Secrets not in image layers |
| P0-2 | Sendchamp auth | Fail closed when secret missing |
| P0-3 | Cert/key gitignore | `*.cer` / `safehaven-keys/` ignored |
