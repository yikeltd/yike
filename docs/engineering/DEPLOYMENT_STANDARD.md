# Deployment Standard — Yike

Production deploys via **Coolify + Docker on Hetzner only**. Do not use Vercel.

See also: [PLATFORM_STANDARD.md](./PLATFORM_STANDARD.md)

## Architecture

```
GitHub (yikeltd/yike)
  │ webhook
  ▼
Coolify → Dockerfile build → container :3000
  ▼
Cloudflare → yike.ng
  ▼
Supabase
```

**Control plane:** https://control.stankings.com

## Build & start

| Step | Command |
|------|---------|
| Build | Multi-stage `Dockerfile` → `npm run build` (standalone output) |
| Start | `node server.js` (Next standalone; see `Dockerfile` runner stage) |
| Port | `3000` |

Enable **Inject Build Variables** in Coolify for `NEXT_PUBLIC_*` at build time.

**Memory:** Coolify build sets `NODE_OPTIONS=--max-old-space-size=4096` and `NEXT_BUILD_CPUS=1`. Do not raise the heap to 8GB on small Hetzner hosts — Node will claim RAM the kernel then kills (`exit 255` after static pages finish).

## Health verification

| Endpoint | Purpose |
|----------|---------|
| `GET /api/public-health` | Liveness + commit/environment metadata |
| Production smoke | `https://yike.ng` returns 200 |

After deploy: confirm Coolify container **Running (healthy)** and curl public-health.

## Environment variables

Runtime secrets in Coolify only — see `.env.example`. Never commit secrets.

Minimum production:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://yike.ng`
- `CRON_SECRET` (for scheduled jobs)
- `RESEND_API_KEY`, Sendchamp keys as applicable

Optional deploy metadata (set in Coolify if available):

- `GIT_COMMIT_SHA` or `COOLIFY_SOURCE_COMMIT`
- `APP_ENV=production`

## Scheduled jobs

Cron schedules are configured in Coolify. See `coolify/cron.jobs.example`.

## Rollback

Coolify → Application → Deployments → redeploy last successful build.

## Restart

Coolify → Application → Restart (or redeploy same commit).
