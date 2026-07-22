# Backup & Restore Runbook — Yike

**Supabase project:** `hlpojfurfldvcxfxhveg`  
**Production URL:** https://yike.ng  
**Hosting:** Coolify (`control.stankings.com`) on Hetzner

## What to protect

| Layer | System | Owner action |
|-------|--------|--------------|
| Postgres + Auth | Supabase | Enable / verify PITR or daily backups in Supabase Dashboard |
| Object storage | Supabase Storage buckets | Covered with project backups; confirm retention |
| Application image | Coolify deployments | Keep prior successful deployments for rollback |
| Secrets | Coolify env only | Export encrypted backup of env names (not values in git) |
| DNS / TLS | Cloudflare | Document zone settings offline |

## Backup verification (monthly)

1. Supabase → Project Settings → Database → confirm backup / PITR status.
2. Note last successful backup timestamp in ops log.
3. Confirm Coolify has ≥1 previous healthy deployment available.
4. Confirm `npm run verify:supabase-project -- --require-linked` still matches
   `hlpojfurfldvcxfxhveg` on the ops machine.

## Restore — database (high level)

1. Pause writes / announce maintenance if user-facing.
2. Use Supabase Dashboard restore / PITR to target timestamp (founder + ops only).
3. Verify `GET https://yike.ng/api/public-health`.
4. Smoke: home, search, listing detail, staff `/lex` login.
5. Confirm storage objects for a sample listing still resolve.

Never restore from a **different** Supabase project. Never point production at
dev sandbox `gyxemepnrkwxocgzfbeo`.

## Restore — application

Coolify → Application → Deployments → redeploy last known-good commit.

## RPO / RTO targets (initial)

| Metric | Target | Notes |
|--------|--------|-------|
| RPO | ≤ 24h (or PITR window) | Tighten when BayRight money paths exist |
| RTO | ≤ 2h | App rollback usually minutes; DB restore longer |

## Escalation

Founder / platform ops via Coolify + Supabase org **Stankings Group**.
Do not paste service-role keys into chat or tickets.
