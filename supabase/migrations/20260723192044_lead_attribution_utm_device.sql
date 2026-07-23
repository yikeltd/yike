-- Lead attribution: UTM, referral, device, city, listing type
-- First-class columns (listing_leads.metadata already stores these until applied).
-- Founder: apply via SQL Editor or `npm run db:push` after review.
-- Do NOT auto-apply from agent.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS referral TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS listing_city TEXT,
  ADD COLUMN IF NOT EXISTS listing_type TEXT;

CREATE INDEX IF NOT EXISTS leads_utm_campaign_idx
  ON public.leads (utm_campaign, clicked_at DESC)
  WHERE utm_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_device_type_idx
  ON public.leads (device_type, clicked_at DESC)
  WHERE device_type IS NOT NULL;

COMMENT ON COLUMN public.leads.utm_source IS 'UTM source from WhatsApp lead tap';
COMMENT ON COLUMN public.leads.device_type IS 'mobile | tablet | desktop | unknown';
COMMENT ON COLUMN public.leads.listing_city IS 'Listing city at time of enquiry';
