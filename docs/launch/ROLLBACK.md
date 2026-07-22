# Rollback Considerations — Yike

**Hosting:** Coolify only (`control.stankings.com`)  
**App:** yike.ng · container from `Dockerfile`  
**Database:** Supabase `hlpojfurfldvcxfxhveg`

## Application rollback (preferred first response)

1. Coolify → Application → **Deployments**
2. Redeploy last known-good commit (green health)
3. Confirm `GET https://yike.ng/api/public-health` → 200
4. Smoke: home, search, one listing, WhatsApp CTA visible

No Vercel rollback. Do not redeploy from a dirty local tree with secrets.

## Database rollback

- Prefer **forward fix** migrations over restore for small defects.
- PITR / backup restore: follow [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)
- Never restore from another project (e.g. sandbox `gyxemepnrkwxocgzfbeo`)
- Coordinate founder + ops before PITR (auth sessions / listings impact)

## Feature rollback (flags)

| Issue | Action |
|-------|--------|
| Bad WhatsApp provider behavior | Disable related Sendchamp/OTP flags; keep email OTP |
| Accidental vertical leak | Ensure `ENABLE_VEHICLE_MARKETPLACE` unset; remove routes |
| Cron storms | Disable Coolify cron; rotate `CRON_SECRET` if leaked |

## Communication

- Consumer: status via existing support channels (`hello@yike.ng`)
- Staff: pause moderation only if DB restore in progress

## When to escalate

- Public-health down > 15 minutes after rollback attempt
- Suspected secret bake in image → rotate Supabase service role + webhook secrets
- Cross-project Supabase link suspected → stop migrations immediately
