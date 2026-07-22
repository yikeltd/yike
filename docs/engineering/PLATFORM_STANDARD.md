# Platform Standard — Stankings Ecosystem

Canonical approved production stack. **Coolify only** for hosting — Vercel is legacy and must not be reintroduced.

## Approved stack

| Layer | Technology |
|-------|------------|
| Source control | GitHub (one GitHub App per product repo) |
| CI | GitHub Actions (lint, typecheck, build — not production deploy) |
| Hosting | Hetzner |
| Orchestration | Coolify (`https://control.stankings.com`) |
| Edge & DNS | Cloudflare |
| Database & auth | Supabase |
| Email | Resend (+ Sendchamp for SMS/WhatsApp where applicable) |
| Payments | Product-specific (Paystack, Safe Haven, etc.) |
| Monitoring | Health endpoints + Coolify container health |

## Production deployment policy

1. Push to `main` on the product GitHub repo.
2. Coolify GitHub App webhook triggers Docker build from repo `Dockerfile`.
3. Runtime secrets live in **Coolify only** — never in git, never in Docker build args except public `NEXT_PUBLIC_*` / `VITE_*`.
4. Verify deploy: container healthy → production URL 200 → health endpoint documented per repo.
5. **Do not deploy to Vercel.** Remove Vercel configs and packages when found.

## Architecture

```
GitHub
  │
  ▼
Coolify (control.stankings.com)
  │
  ▼
Hetzner (shared host, per-product containers)
  │
  ├── Supabase (Postgres, Auth, Storage)
  │
  └── Cloudflare (DNS, Access, CDN/WAF)
```

## Per-product references

| Product | Deployment doc | Health |
|---------|----------------|--------|
| Stankings | `docs/engineering/DEPLOYMENT_STANDARD.md` | Homepage / agreed smoke URL |
| BamSignal | `DEPLOYMENT_STANDARD.md` | `GET /ready` |
| Yike | `docs/engineering/DEPLOYMENT_STANDARD.md` | `GET /api/public-health` |
| BayRight | `docs/coolify-deployment.md` | `GET /api/health` |

## Yike ecosystem alignment

Marketplace role, ownership boundaries, and Passport prep:

- `docs/architecture/ECOSYSTEM_ALIGNMENT.md`
- `docs/architecture/PLATFORM_RESPONSIBILITIES.md`
- `docs/architecture/PASSPORT_INTEGRATION_READINESS.md`
- `docs/launch/` (ops checklists)

CI: GitHub Actions workflow `.github/workflows/pr-checks.yml` (lint · typecheck · build).

## Deployment metadata (standard)

See `src/lib/deploy-metadata.ts`. Health: `GET /api/public-health`.

## Supabase Auth

Remove `*.vercel.app` from redirect URLs. Checklist: Stankings `docs/engineering/SUPABASE_REDIRECT_AUDIT.md`.

## Rollback

Redeploy previous successful Coolify deployment from the Coolify UI. Do not use Vercel rollback.

## Historical note

Some repos contain archived references to Vercel in launch-war-room data or migration reports. Those are historical only. Production authority is Coolify.
