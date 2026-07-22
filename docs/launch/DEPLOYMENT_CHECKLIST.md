# Deployment Checklist — Yike

## Pre-deploy

- [ ] Branch `main` green on GitHub Actions (`PR Checks`: lint · typecheck · build)
- [ ] `npx tsc --noEmit` and `npm run build` pass locally if changing code
- [ ] No secrets in git (`*.pem`, `*.cer`, `safehaven-keys/`, `.env*`)
- [ ] Migrations: only **new** files; run `npm run verify:supabase-project -- --require-linked` before any db push
- [ ] Coolify env updated for any new required vars (see ENVIRONMENT_CHECKLIST)
- [ ] `SENDCHAMP_WEBHOOK_SECRET` set if Sendchamp webhooks enabled (fail-closed)

## Deploy

- [ ] Push to `origin/main` (Coolify GitHub App webhook)
- [ ] Coolify build uses repo `Dockerfile`
- [ ] Confirm `.dockerignore` excludes secrets and key dirs
- [ ] Inject Build Variables for `NEXT_PUBLIC_*` as needed

## Post-deploy

- [ ] Container **Running (healthy)**
- [ ] `curl -fsS https://yike.ng/api/public-health` → 200 + expected commit metadata
- [ ] Follow [PRODUCTION_VERIFICATION.md](./PRODUCTION_VERIFICATION.md)
- [ ] Follow [SECURITY_VERIFICATION.md](./SECURITY_VERIFICATION.md) for security-sensitive releases

## Rollback

Coolify → Deployments → redeploy previous successful build.  
Do not use Vercel.
