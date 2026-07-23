# WhatsApp Lead Tracking Report

**Date:** 2026-07-23  
**Official line:** `+234 810 351 4329` → E.164 digits `2348103514329`

## Verdict

Lead pipeline already created leads before WhatsApp redirect. This sprint **tightens reference format, message prefills, client attribution (UTM/device/referral), and support number**.

## Flow (unchanged architecture)

1. CTA → `trackLeadAndRedirect` (`src/lib/leads/client.ts`)
2. `POST /api/leads/track` → `logLead` + attribution + `captureListingLead`
3. Prefill message includes **enquiry ref**
4. Redirect to seller or Yike gateway WhatsApp

## Enhancements

| Item | Detail |
|------|--------|
| Enquiry ref | `YK-9D8FK2` style (`generateLeadReference`) |
| Prefill | `Enquiry ref: YK-…` in gateway + direct agent messages |
| Client attribution | UTM source/medium/campaign/content/term, referral host, device |
| Storage | `leads.source_campaign` + `listing_leads.metadata` + `lead_events` |
| First-class columns | Migration `20260723192044_lead_attribution_utm_device.sql` (**not applied**) |

## CTA audit

Primary consumer CTAs use `trackLeadAndRedirect` / `openWhatsAppLead`:

- `contact-buttons.tsx` (detail)
- `property-card.tsx`
- `browse-slide.tsx`

Support / admin `wa.me` links use official `YIKE_SUPPORT_WHATSAPP` (updated).

## Migration note (founder)

Apply when ready:

```sql
-- file: supabase/migrations/20260723192044_lead_attribution_utm_device.sql
```

Via SQL Editor on production, or `npm run db:push` after review. Until applied, UTM still lands in metadata/events; column update is best-effort.

## Number migration

| Before | After |
|--------|-------|
| `2348035143299` | `2348103514329` |

Confirm Coolify env `YIKE_WHATSAPP_NUMBER` / `NEXT_PUBLIC_YIKE_SUPPORT_WHATSAPP` / Sendchamp sender.
