# Property Marketplace Launch Checklist

**Launch scope:** Property Marketplace only  
**Not in launch:** Vehicles · Passport UI · Escrow · Wallet · Industrial / Business / Auctions

Use with [PRODUCTION_VERIFICATION.md](./PRODUCTION_VERIFICATION.md) and [SECURITY_VERIFICATION.md](./SECURITY_VERIFICATION.md).

## A. Pre-launch gates

- [ ] Security Hardening sprint merged / deployed
- [ ] GitHub Actions `PR Checks` green on `main`
- [ ] `npm run typecheck` and `npm run build` pass
- [ ] `npm run verify:supabase-project` → `hlpojfurfldvcxfxhveg` PASS
- [ ] Coolify env: required vars per [ENVIRONMENT_CHECKLIST.md](./ENVIRONMENT_CHECKLIST.md)
- [ ] `SENDCHAMP_WEBHOOK_SECRET` set (webhook fail-closed)
- [ ] `CRON_SECRET` set; Coolify crons from `coolify/cron.jobs.example` enabled if used
- [ ] No secrets in git (`*.pem`, `*.cer`, `safehaven-keys/`)

## B. Consumer journey (property)

- [ ] Home `/` loads
- [ ] Browse `/browse` (Swipe) works
- [ ] Search `/search` + filters
- [ ] Hub pages: `/rent`, `/buy`, `/land`, `/shortlet` (as applicable)
- [ ] Listing detail `/properties/[slug]` — gallery, price, WhatsApp CTA
- [ ] Save listing (guest + logged-in)
- [ ] Seller profile `/agents/[slug]`
- [ ] Email OTP signup / login
- [ ] Report listing submits
- [ ] Safety / moderation public pages load

## C. Agent journey

- [ ] Agent can create listing (photos compress/upload)
- [ ] Listing appears as `pending` for moderation
- [ ] Agent can edit listing (expect re-review — known limitation)
- [ ] Agent WhatsApp verification prompts behave as configured

## D. Lex (admin)

- [ ] Staff login → `/lex`
- [ ] Pending listings queue → approve / reject / hide (PIN as required)
- [ ] Reports queue triage
- [ ] Users directory (super_admin)
- [ ] Audit logs show moderate actions
- [ ] Operations / listing-health readable

## E. Negatives (must remain true)

- [ ] No Vehicle Marketplace UI or `/vehicles` routes
- [ ] `ENABLE_VEHICLE_MARKETPLACE` unset/false
- [ ] No Passport UI
- [ ] No consumer escrow / wallet

## F. Sign-off

| Role | Name | Date | GO / HOLD |
|------|------|------|-----------|
| Founder | | | |
| Ops | | | |

**Rollback:** see [ROLLBACK.md](./ROLLBACK.md)
